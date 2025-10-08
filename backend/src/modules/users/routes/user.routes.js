// backend/src/modules/users/routes/user.routes.js
// const express = require("express");
// const auth = require("../../../middlewares/auth");
// const { requireRole } = require("../../../middlewares/auth");
// const { getMe, updateMe, listUsers, updateRole, deleteUser } = require("../controllers/user.controller");

// const router = express.Router();

// // Bảo vệ toàn bộ /users bằng auth
// router.use(auth);

// /** User tự xem/sửa hồ sơ */
// router.get("/me", getMe);
// router.put("/me", updateMe);

// /** Admin */
// router.get("/", requireRole("admin"), listUsers);
// router.patch("/:id/role", requireRole("admin"), updateRole);
// router.delete("/:id", requireRole("admin"), deleteUser);

// module.exports = router;
const express = require("express");
const auth = require("../../../middlewares/auth");
const { requireRole } = require("../../../middlewares/auth");
const {
  getMe,
  updateMe,
  getPublicProfile,  // 👈 thêm
  listUsers,
  updateRole,
  deleteUser,
} = require("../controllers/user.controller");

const router = express.Router();

// Bảo vệ toàn bộ /users bằng auth (user phải đăng nhập)
router.use(auth);

/** User tự xem/sửa hồ sơ của mình */
router.get("/me", getMe);
router.put("/me", updateMe);

/** ✅ Public (cho user đã đăng nhập): xem hồ sơ user khác (không lộ email) */
router.get("/:id/public", getPublicProfile);

/** Admin quản lý người dùng */
router.get("/", requireRole("admin"), listUsers);
router.patch("/:id/role", requireRole("admin"), updateRole);
router.delete("/:id", requireRole("admin"), deleteUser);

module.exports = router;
