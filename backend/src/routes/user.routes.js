// backend/src/routes/user.routes.js

const express = require("express");
const { getMe, updateMe, listUsers, updateRole, deleteUser } = require("../controllers/user.controller");
const { requireRole } = require("../middlewares/auth");

const router = express.Router();

/** User tự xem/sửa hồ sơ */
router.get("/me", getMe);
router.put("/me", updateMe); // cập nhật name/avatar/phone/address

/** Admin quản lý người dùng */
router.get("/", requireRole("admin"), listUsers);
router.patch("/:id/role", requireRole("admin"), updateRole);
router.delete("/:id", requireRole("admin"), deleteUser);

module.exports = router;
