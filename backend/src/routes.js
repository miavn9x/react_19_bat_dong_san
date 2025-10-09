// backend/src/routes.js
const express = require("express");
const router = express.Router();

// Health check
router.get("/health", (req, res) =>
  res.json({ status: "ok", time: new Date().toISOString() })
);

// Modules
const authModule = require("./modules/auth");
const usersModule = require("./modules/users");
const uploadsModule = require("./modules/uploads");

// PUBLIC
router.use("/auth", authModule.routes);

// UPLOADS (images/videos/audios)
// - Public: GET list/detail
// - User/Admin: POST upload (single/multi)
// - Admin: PATCH/PUT/DELETE
router.use("/uploads", uploadsModule.routes);

// USERS
// - Các middleware auth/role đã cấu hình ở bên trong user.routes
router.use("/users", usersModule.routes);

module.exports = router;

