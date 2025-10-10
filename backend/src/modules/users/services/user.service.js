/** Users Service
 *  - Tầng truy vấn an toàn: chọn field phù hợp từng mục đích
 */
const User = require("../models/user.model");

module.exports = {
  // Me (hiện email)
  findById: (id) =>
    User.findById(id).select("_id name email avatarUrl phone address role createdAt updatedAt"),

  // Public profile (ẩn email)
  findPublicById: (id) =>
    User.findById(id).select("_id name avatarUrl phone address role createdAt"),

  updateMe: (id, update) =>
    User.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true })
      .select("_id name email avatarUrl phone address role createdAt updatedAt"),

  list: (cond, { skip, limit }) =>
    User.find(cond)
      .select("_id name email avatarUrl phone address role createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),

  count: (cond) => User.countDocuments(cond),

  countAdmins: () => User.countDocuments({ role: "admin" }),

  updateRole: (id, role) =>
    User.findByIdAndUpdate(id, { $set: { role } }, { new: true })
      .select("_id name email role"),

  deleteById: (id) => User.findByIdAndDelete(id).select("_id"),
};
