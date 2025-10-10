/** backend/src/modules/auth/controllers/auth.controller.js
 *  - Register/Login: tạo phiên + set HttpOnly refresh cookie + CSRF cookie
 *  - Refresh: rotate (yêu cầu header X-CSRF-Token khớp cookie rt-csrf)
 *  - Logout/Logout-all: revoke phiên & xóa cookie
 *  - Sessions/Delete session
 */
const crypto = require("crypto");
const {
  createSessionAndTokens,
  rotateRefreshToken,
  revokeSession,
  revokeAllSessions,
  listUserSessions,
} = require("../services/auth.service");
const User = require("../../users/models/user.model");

const REFRESH_COOKIE_NAME = "rt";
const CSRF_COOKIE_NAME = "rt-csrf";
const isProd = process.env.NODE_ENV === "production";

const genCsrf = () => crypto.randomBytes(32).toString("base64url");

function setRefreshCookie(res, token, maxAgeMs) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    path: "/api/auth/refresh",
    maxAge: maxAgeMs,
  });
}
function setCsrfCookie(res, maxAgeMs) {
  const v = genCsrf();
  res.cookie(CSRF_COOKIE_NAME, v, {
    httpOnly: false,
    secure: isProd,
    sameSite: "strict",
    path: "/api/auth/refresh",
    maxAge: maxAgeMs,
  });
  return v;
}
function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: "/api/auth/refresh" });
  res.clearCookie(CSRF_COOKIE_NAME, { path: "/api/auth/refresh" });
}

async function register(req, res) {
  try {
    const { name, email, password, avatarUrl = "", phone = "", address = "" } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email, password are required" });
    }
    const user = await User.create({ name, email, password, avatarUrl, phone, address, role: "user" });

    const { accessToken, refreshToken, refreshTokenExpiresAt } = await createSessionAndTokens(user, req);
    const maxAge = refreshTokenExpiresAt.getTime() - Date.now();
    setRefreshCookie(res, refreshToken, maxAge);
    setCsrfCookie(res, maxAge);

    return res.status(201).json({
      token: accessToken,
      user: {
        _id: user._id, name: user.name, email: user.email,
        avatarUrl: user.avatarUrl, phone: user.phone, address: user.address, role: user.role,
      },
    });
  } catch (err) {
    if (err && err.code === 11000) return res.status(409).json({ message: "Email đã tồn tại" });
    console.error("[register] error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: "email & password are required" });

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const { accessToken, refreshToken, refreshTokenExpiresAt } = await createSessionAndTokens(user, req);
    const maxAge = refreshTokenExpiresAt.getTime() - Date.now();
    setRefreshCookie(res, refreshToken, maxAge);
    setCsrfCookie(res, maxAge);

    return res.json({
      token: accessToken,
      user: {
        _id: user._id, name: user.name, email: user.email,
        avatarUrl: user.avatarUrl, phone: user.phone, address: user.address, role: user.role,
      },
    });
  } catch (err) {
    console.error("[login] error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function refresh(req, res) {
  try {
    const oldToken = req.cookies?.[REFRESH_COOKIE_NAME];
    const csrfHdr = req.get("x-csrf-token") || "";
    const csrfCookie = req.cookies?.[CSRF_COOKIE_NAME] || "";

    if (!oldToken) return res.status(401).json({ message: "Missing refresh token" });
    if (!csrfHdr || !csrfCookie || csrfHdr !== csrfCookie) {
      return res.status(403).json({ message: "CSRF token invalid" });
    }

    const { accessToken, refreshToken, refreshTokenExpiresAt, user } = await rotateRefreshToken(oldToken, req);
    const maxAge = refreshTokenExpiresAt.getTime() - Date.now();
    setRefreshCookie(res, refreshToken, maxAge);
    setCsrfCookie(res, maxAge);

    return res.json({
      token: accessToken,
      user: {
        _id: user._id, name: user.name, email: user.email,
        avatarUrl: user.avatarUrl, phone: user.phone, address: user.address, role: user.role,
      },
    });
  } catch (err) {
    console.error("[refresh] error:", err.message);
    clearRefreshCookie(res);
    return res.status(401).json({ message: "Invalid refresh" });
  }
}

async function logout(req, res) {
  try {
    const sid = req.sessionId;
    if (sid && req.userId) await revokeSession(sid, req.userId, "logout");
    clearRefreshCookie(res);
    return res.json({ message: "Logged out" });
  } catch (err) {
    console.error("[logout] error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function logoutAll(req, res) {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });
    await revokeAllSessions(req.userId, "logout_all");
    clearRefreshCookie(res);
    return res.json({ message: "All sessions revoked" });
  } catch (err) {
    console.error("[logoutAll] error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function sessions(req, res) {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });
    const list = await listUserSessions(req.userId);
    return res.json({ items: list });
  } catch (err) {
    console.error("[sessions] error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

async function revoke(req, res) {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });
    const { sessionId } = req.params;
    await revokeSession(sessionId, req.userId, "revoke_by_user");
    return res.json({ message: "Session revoked" });
  } catch (err) {
    console.error("[revoke] error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = { register, login, refresh, logout, logoutAll, sessions, revoke };
