// backend/src/routes.js
const express = require("express");
const router = express.Router();

// health
router.get("/health", (req, res) =>
  res.json({ status: "ok", time: new Date().toISOString() })
);

// modules
const authModule = require("./modules/auth");
const usersModule = require("./modules/users");
const uploadsModule = require("./modules/uploads"); // ⬅️ thêm

// PUBLIC
router.use("/auth", authModule.routes);

// UPLOADS (tách biệt images/videos/audios, CRUD đầy đủ)
router.use("/uploads", uploadsModule.routes); // ⬅️ mount /api/uploads/...

// USERS (middleware auth đã gắn bên trong user.routes để rõ ràng)
router.use("/users", usersModule.routes);

module.exports = router;
