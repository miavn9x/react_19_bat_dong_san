// backend/src/modules/users/controllers/user.controller.js
const mongoose = require("mongoose");
const User = require("../models/user.model");
const userService = require("../services/user.service");

/** Lấy thông tin user hiện tại */
async function getMe(req, res) {
  const me = await userService.findById(req.userId);
  if (!me) return res.status(404).json({ message: "User not found" });
  res.json(me);
}

/** Cập nhật hồ sơ cá nhân (user tự sửa) */
async function updateMe(req, res) {
  const allow = ["name", "avatar", "phone", "address"];
  const update = {};
  for (const k of allow) {
    if (typeof req.body?.[k] !== "undefined") update[k] = req.body[k];
  }
  const me = await userService.updateMe(req.userId, update);
  if (!me) return res.status(404).json({ message: "User not found" });
  res.json(me);
}

/** (Admin) Danh sách người dùng */
async function listUsers(req, res) {
  const { page = 1, limit = 20, q = "" } = req.query;
  const pg = Math.max(parseInt(page, 10) || 1, 1);
  const lm = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

  const cond = q
    ? { $or: [
        { name:  { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } },
      ] }
    : {};

  const [items, total] = await Promise.all([
    userService.list(cond, { skip: (pg - 1) * lm, limit: lm }),
    userService.count(cond),
  ]);

  res.json({ items, total, page: pg, limit: lm });
}

/** (Admin) Đổi role của user */
async function updateRole(req, res) {
  const { id } = req.params;
  const { role } = req.body || {};

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid user id" });
  }
  if (!["user", "admin"].includes(role)) {
    return res.status(400).json({ message: "role must be 'user' or 'admin'" });
  }

  // tránh tự giáng cấp nếu là admin duy nhất
  if (String(req.userId) === String(id) && role !== "admin") {
    const adminCount = await userService.countAdmins();
    if (adminCount <= 1) {
      return res.status(400).json({ message: "Không thể tự giáng cấp admin cuối cùng" });
    }
  }

  const updated = await userService.updateRole(id, role);
  if (!updated) return res.status(404).json({ message: "User not found" });
  res.json(updated);
}

/** (Admin) Xoá user (không cho xoá chính mình) */
async function deleteUser(req, res) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid user id" });
  }
  if (String(req.userId) === String(id)) {
    return res.status(400).json({ message: "Không thể tự xoá tài khoản của bạn" });
  }

  const deleted = await userService.deleteById(id);
  if (!deleted) return res.status(404).json({ message: "User not found" });
  res.json({ success: true });
}

module.exports = { getMe, updateMe, listUsers, updateRole, deleteUser };
