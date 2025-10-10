/** Users Controller
 *  - me / updateMe / public profile
 *  - admin: listUsers, updateRole (bảo vệ admin cuối), deleteUser
 *  - khi đổi role / xoá user → revoke toàn bộ phiên để hiệu lực ngay
 */
const mongoose = require("mongoose");
const userService = require("../services/user.service");
const { revokeAllSessions } = require("../../auth/services/auth.service");

const isValidId = (id) => mongoose.isValidObjectId(id);

/** Lấy thông tin user hiện tại (có email vì là của chính chủ) */
async function getMe(req, res) {
  try {
    const me = await userService.findById(req.userId);
    if (!me) return res.status(404).json({ message: "User not found" });
    res.json(me);
  } catch (e) {
    console.error("[users.getMe]", e);
    res.status(500).json({ message: "Server error" });
  }
}

/** Cập nhật hồ sơ cá nhân (user tự sửa, KHÔNG cho đổi role/email/password ở đây) */
async function updateMe(req, res) {
  try {
    const allow = ["name", "avatarUrl", "phone", "address"];
    const update = {};
    for (const k of allow) if (typeof req.body?.[k] !== "undefined") update[k] = req.body[k];

    const me = await userService.updateMe(req.userId, update);
    if (!me) return res.status(404).json({ message: "User not found" });
    res.json(me);
  } catch (e) {
    console.error("[users.updateMe]", e);
    res.status(500).json({ message: "Server error" });
  }
}

/** ✅ Public (cho user đã đăng nhập): xem hồ sơ user khác (ẩn email) */
async function getPublicProfile(req, res) {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: "Invalid user id" });
    const user = await userService.findPublicById(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (e) {
    console.error("[users.getPublicProfile]", e);
    res.status(500).json({ message: "Server error" });
  }
}

/** (Admin) Danh sách người dùng */
async function listUsers(req, res) {
  try {
    const { page = 1, limit = 16, q = "" } = req.query;
    const pg = Math.max(parseInt(page, 10) || 1, 1);
    const lm = Math.min(Math.max(parseInt(limit, 10) || 16, 1), 100);

    const cond = q
      ? {
          $or: [
            { name:    { $regex: q, $options: "i" } },
            { email:   { $regex: q, $options: "i" } },
            { phone:   { $regex: q, $options: "i" } },
            { address: { $regex: q, $options: "i" } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      userService.list(cond, { skip: (pg - 1) * lm, limit: lm }),
      userService.count(cond),
    ]);

    res.json({ items, total, page: pg, limit: lm });
  } catch (e) {
    console.error("[users.listUsers]", e);
    res.status(500).json({ message: "Server error" });
  }
}

/** (Admin) Đổi role (promote/demote) với bảo vệ admin cuối cùng */
async function updateRole(req, res) {
  try {
    const { id } = req.params;
    const { role } = req.body || {};

    if (!isValidId(id)) return res.status(400).json({ message: "Invalid user id" });
    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ message: "role must be 'user' or 'admin'" });
    }

    const target = await userService.findById(id);
    if (!target) return res.status(404).json({ message: "User not found" });

    // Không cho tự giáng cấp nếu là admin duy nhất
    if (String(req.userId) === String(id) && role !== "admin") {
      const adminCount = await userService.countAdmins();
      if (adminCount <= 1) {
        return res.status(400).json({ message: "Không thể tự giáng cấp admin cuối cùng" });
      }
    }

    // Không được hạ cấp "admin cuối cùng"
    if (target.role === "admin" && role !== "admin") {
      const adminCount = await userService.countAdmins();
      if (adminCount <= 1) {
        return res.status(400).json({ message: "Không thể hạ cấp admin cuối cùng" });
      }
    }

    const updated = await userService.updateRole(id, role);
    if (!updated) return res.status(404).json({ message: "User not found" });

    // Thu hồi toàn bộ phiên của user đó để hiệu lực RBAC ngay
    try {
      await revokeAllSessions(id, "role_changed");
    } catch (e) {
      console.error("[users.updateRole] revokeAllSessions", e);
    }

    res.json(updated);
  } catch (e) {
    console.error("[users.updateRole]", e);
    res.status(500).json({ message: "Server error" });
  }
}

/** (Admin) Xoá user — không cho xoá chính mình & không xoá admin cuối cùng */
async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: "Invalid user id" });
    if (String(req.userId) === String(id)) {
      return res.status(400).json({ message: "Không thể tự xoá tài khoản của bạn" });
    }

    const target = await userService.findById(id);
    if (!target) return res.status(404).json({ message: "User not found" });

    if (target.role === "admin") {
      const adminCount = await userService.countAdmins();
      if (adminCount <= 1) {
        return res.status(400).json({ message: "Không thể xoá admin cuối cùng" });
      }
    }

    const deleted = await userService.deleteById(id);
    if (!deleted) return res.status(404).json({ message: "User not found" });

    // Revoke session của user bị xoá (nếu còn)
    try {
      await revokeAllSessions(id, "user_deleted");
    } catch (e) {
      console.error("[users.deleteUser] revokeAllSessions", e);
    }

    res.json({ success: true });
  } catch (e) {
    console.error("[users.deleteUser]", e);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  getMe,
  updateMe,
  getPublicProfile,
  listUsers,
  updateRole,
  deleteUser,
};
