// backend/src/modules/users/services/user.service.js
// const User = require("../models/user.model");

// module.exports = {
//   findById: (id) =>
//     User.findById(id).select("_id name email avatar phone address role createdAt updatedAt"),
//   updateMe: (id, update) =>
//     User.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true })
//       .select("_id name email avatar phone address role createdAt updatedAt"),
//   list: (cond, { skip, limit }) =>
//     User.find(cond)
//       .select("_id name email avatar phone address role createdAt")
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit),
//   count: (cond) => User.countDocuments(cond),
//   countAdmins: () => User.countDocuments({ role: "admin" }),
//   updateRole: (id, role) =>
//     User.findByIdAndUpdate(id, { $set: { role } }, { new: true }).select("_id name email role"),
//   deleteById: (id) => User.findByIdAndDelete(id).select("_id"),
// };
const User = require("../models/user.model");

module.exports = {
  // Me (bao gồm email để hiển thị cho chính chủ)
  findById: (id) =>
    User.findById(id).select("_id name email avatar phone address role createdAt updatedAt"),

  // Public profile (KHÔNG trả email)
  findPublicById: (id) =>
    User.findById(id).select("_id name avatar phone address role createdAt"),

  updateMe: (id, update) =>
    User.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true })
      .select("_id name email avatar phone address role createdAt updatedAt"),

  list: (cond, { skip, limit }) =>
    User.find(cond)
      .select("_id name email avatar phone address role createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),

  count: (cond) => User.countDocuments(cond),

  countAdmins: () => User.countDocuments({ role: "admin" }),

  updateRole: (id, role) =>
    User.findByIdAndUpdate(id, { $set: { role } }, { new: true }).select("_id name email role"),

  deleteById: (id) => User.findByIdAndDelete(id).select("_id"),
};
