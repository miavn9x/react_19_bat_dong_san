const mongoose = require("mongoose");
const User = require("../models/User");

/** Lấy thông tin user hiện tại */
async function getMe(req, res) {
  const me = await User.findById(req.userId)
    .select("_id name email avatar phone address role createdAt updatedAt");
  if (!me) return res.status(404).json({ message: "User not found" });
  res.json(me);
}

/** Cập nhật hồ sơ cá nhân (user tự sửa) */
async function updateMe(req, res) {
  const allow = ["name", "avatar", "phone", "address"]; // không cho tự đổi role ở đây
  const update = {};
  for (const k of allow) {
    if (typeof req.body?.[k] !== "undefined") update[k] = req.body[k];
  }

  const me = await User.findByIdAndUpdate(
    req.userId,
    { $set: update },
    { new: true, runValidators: true }
  ).select("_id name email avatar phone address role createdAt updatedAt");

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
        { name:   { $regex: q, $options: "i" } },
        { email:  { $regex: q, $options: "i" } },
        { phone:  { $regex: q, $options: "i" } },
      ] }
    : {};

  const [items, total] = await Promise.all([
    User.find(cond)
      .select("_id name email avatar phone address role createdAt")
      .sort({ createdAt: -1 })
      .skip((pg - 1) * lm)
      .limit(lm),
    User.countDocuments(cond),
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

  // Option an toàn: tránh tự giáng cấp nếu là admin duy nhất
  if (String(req.userId) === String(id) && role !== "admin") {
    const adminCount = await User.countDocuments({ role: "admin" });
    if (adminCount <= 1) {
      return res.status(400).json({ message: "Không thể tự giáng cấp admin cuối cùng" });
    }
  }

  const updated = await User.findByIdAndUpdate(
    id,
    { $set: { role } },
    { new: true }
  ).select("_id name email role");

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

  const deleted = await User.findByIdAndDelete(id).select("_id");
  if (!deleted) return res.status(404).json({ message: "User not found" });
  res.json({ success: true });
}

module.exports = { getMe, updateMe, listUsers, updateRole, deleteUser };
