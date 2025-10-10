/** backend/src/routes.js
 *  Router gốc:
 *  - GET /api/health
 *  - mount /api/auth, /api/users, /api/uploads (nếu có)
 */
const express = require("express");
const router = express.Router();

router.get("/health", (req, res) =>
  res.json({ status: "ok", time: new Date().toISOString() })
);

// Modules
const authModule = require("./modules/auth");
const usersModule = require("./modules/users"); // ✅ bật users

router.use("/auth", authModule.routes);
router.use("/users", usersModule.routes);      // ✅ bật users

module.exports = router;
