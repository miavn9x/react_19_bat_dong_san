/** backend/src/modules/auth/routes/auth.routes.js
 *  - Public: register, login, refresh (CSRF + rate limit)
 *  - Protected: logout, logout-all, sessions, delete session
 */
const express = require("express");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const { register, login, refresh, logout, logoutAll, sessions, revoke } = require("../controllers/auth.controller");
const { auth } = require("../../../middlewares/auth");

const router = express.Router();

// Đọc rt & rt-csrf
router.use(cookieParser());

// Rate limit
const loginLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });
const refreshLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 120, standardHeaders: true, legacyHeaders: false });

// Public
router.post("/register", loginLimiter, register);
router.post("/login", loginLimiter, login);
router.post("/refresh", refreshLimiter, refresh);

// Protected
router.post("/logout", auth, logout);
router.post("/logout-all", auth, logoutAll);
router.get("/sessions", auth, sessions);
router.delete("/sessions/:sessionId", auth, revoke);

module.exports = router;
