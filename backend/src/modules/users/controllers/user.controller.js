
/** Users Controller
 *  - me / updateMe / public profile
 *  - admin: listUsers, updateRole (bảo vệ admin cuối), deleteUser
 *  - khi đổi role / xoá user → revoke toàn bộ phiên để hiệu lực ngay
 *  - VIỆT HOÁ thông điệp + log terminal
 */
const mongoose = require("mongoose");
const userService = require("../services/user.service");
const { revokeAllSessions } = require("../../auth/services/auth.service");

const isValidId = (id) => mongoose.isValidObjectId(id);

/** Helper: log + trả JSON VI */
function sendJson(res, status, message, tag = "users", extra) {
  const time = new Date().toISOString();
  const line = `[${time}] [${tag}] ${message}`;
  try {
    if (status >= 500) console.error(line, extra || "");
    else if (status >= 400) console.warn(line, extra || "");
    else console.log(line, extra || "");
  } catch { /* noop */ }
  return res.status(status).json({ message });
}

/** Lấy thông tin user hiện tại (có email vì là của chính chủ) */
async function getMe(req, res) {
  try {
    const me = await userService.findById(req.userId);
    if (!me) return sendJson(res, 404, "Không tìm thấy người dùng", "users/getMe", { userId: req.userId });
    res.json(me);
  } catch (e) {
    console.error("[users.getMe]", e);
    return sendJson(res, 500, "Lỗi máy chủ", "users/getMe");
  }
}

/** Cập nhật hồ sơ cá nhân (user tự sửa, KHÔNG cho đổi role/email/password ở đây) */
async function updateMe(req, res) {
  try {
    const allow = ["name", "avatarUrl", "phone", "address"];
    const update = {};
    for (const k of allow) if (typeof req.body?.[k] !== "undefined") update[k] = req.body[k];

    const me = await userService.updateMe(req.userId, update);
    if (!me) return sendJson(res, 404, "Không tìm thấy người dùng", "users/updateMe", { userId: req.userId });
    res.json(me);
  } catch (e) {
    console.error("[users.updateMe]", e);
    return sendJson(res, 500, "Lỗi máy chủ", "users/updateMe");
  }
}

/** ✅ Public (cho user đã đăng nhập): xem hồ sơ user khác (ẩn email) */
async function getPublicProfile(req, res) {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return sendJson(res, 400, "ID người dùng không hợp lệ", "users/getPublicProfile", { id });
    const user = await userService.findPublicById(id);
    if (!user) return sendJson(res, 404, "Không tìm thấy người dùng", "users/getPublicProfile", { id });
    res.json(user);
  } catch (e) {
    console.error("[users.getPublicProfile]", e);
    return sendJson(res, 500, "Lỗi máy chủ", "users/getPublicProfile");
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
    return sendJson(res, 500, "Lỗi máy chủ", "users/listUsers");
  }
}

/** (Admin) Đổi role (promote/demote) với bảo vệ admin cuối cùng */
async function updateRole(req, res) {
  try {
    const { id } = req.params;
    const { role } = req.body || {};

    if (!isValidId(id)) return sendJson(res, 400, "ID người dùng không hợp lệ", "users/updateRole", { id });
    if (!["user", "admin"].includes(role)) {
      return sendJson(res, 400, "Giá trị 'role' phải là 'user' hoặc 'admin'", "users/updateRole", { role });
    }

    const target = await userService.findById(id);
    if (!target) return sendJson(res, 404, "Không tìm thấy người dùng", "users/updateRole", { id });

    // Không cho tự giáng cấp nếu là admin duy nhất
    if (String(req.userId) === String(id) && role !== "admin") {
      const adminCount = await userService.countAdmins();
      if (adminCount <= 1) {
        return sendJson(res, 400, "Không thể tự giáng cấp admin cuối cùng", "users/updateRole", { id, adminCount });
      }
    }

    // Không được hạ cấp "admin cuối cùng"
    if (target.role === "admin" && role !== "admin") {
      const adminCount = await userService.countAdmins();
      if (adminCount <= 1) {
        return sendJson(res, 400, "Không thể hạ cấp admin cuối cùng", "users/updateRole", { id, adminCount });
      }
    }

    const updated = await userService.updateRole(id, role);
    if (!updated) return sendJson(res, 404, "Không tìm thấy người dùng", "users/updateRole", { id });

    // Thu hồi toàn bộ phiên của user đó để hiệu lực RBAC ngay
    try {
      await revokeAllSessions(id, "role_changed");
    } catch (e) {
      console.error("[users.updateRole] revokeAllSessions", e);
    }

    res.json(updated);
  } catch (e) {
    console.error("[users.updateRole]", e);
    return sendJson(res, 500, "Lỗi máy chủ", "users/updateRole");
  }
}

/** (Admin) Xoá user — không cho xoá chính mình & không xoá admin cuối cùng */
async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return sendJson(res, 400, "ID người dùng không hợp lệ", "users/deleteUser", { id });
    if (String(req.userId) === String(id)) {
      return sendJson(res, 400, "Không thể tự xoá tài khoản của bạn", "users/deleteUser", { id });
    }

    const target = await userService.findById(id);
    if (!target) return sendJson(res, 404, "Không tìm thấy người dùng", "users/deleteUser", { id });

    if (target.role === "admin") {
      const adminCount = await userService.countAdmins();
      if (adminCount <= 1) {
        return sendJson(res, 400, "Không thể xoá admin cuối cùng", "users/deleteUser", { id, adminCount });
      }
    }

    const deleted = await userService.deleteById(id);
    if (!deleted) return sendJson(res, 404, "Không tìm thấy người dùng", "users/deleteUser", { id });

    // Revoke session của user bị xoá (nếu còn)
    try {
      await revokeAllSessions(id, "user_deleted");
    } catch (e) {
      console.error("[users.deleteUser] revokeAllSessions", e);
    }

    res.json({ success: true });
  } catch (e) {
    console.error("[users.deleteUser]", e);
    return sendJson(res, 500, "Lỗi máy chủ", "users/deleteUser");
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
