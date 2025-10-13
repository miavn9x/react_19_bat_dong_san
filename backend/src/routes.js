/** backend/src/routes.js
 *  Router gốc:
 *  - GET /api/health
 *  - mount /api/auth, /api/users, /api/uploads (nếu có)
 */
/** backend/src/routes.js */
const express = require("express");
const router = express.Router();

router.get("/health", (req, res) =>
  res.json({ status: "ok", time: new Date().toISOString() })
);

// Modules
const authModule    = require("./modules/auth");
const usersModule   = require("./modules/users");
const uploadsModule = require("./modules/uploads");
const postsModule   = require("./modules/posts");     // ✅ THÊM

router.use("/auth", authModule.routes);
router.use("/users", usersModule.routes);
router.use("/uploads", uploadsModule.routes);
router.use("/posts", postsModule.routes);             // ✅ THÊM

module.exports = router;
