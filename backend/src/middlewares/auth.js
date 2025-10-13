

/** backend/src/middlewares/auth.js
 *  - Access JWT auth: xác thực + kiểm tra phiên chưa revoke/hết hạn
 *  - requireRole('admin'): kiểm tra role từ token (nhanh)
 *  - requireRoleDb('admin'): kiểm tra role trực tiếp từ DB (an toàn trước token cũ)
 *  - authOptional: có cũng được, không có cũng không sao (public)
 *  - VIỆT HOÁ thông điệp + log terminal
 */
const jwt = require("jsonwebtoken");
const AuthSession = require("../modules/auth/models/authSession.model");
const User = require("../modules/users/models/user.model");

const JWT_ALGS = ["HS256"];
const getAccessSecret = () =>
  process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;

function warn(where, message, extra) {
  const t = new Date().toISOString();
  try { console.warn(`[${t}] [${where}] ${message}`, extra || ""); }
  catch { /* noop */ }
}

/** BẮT BUỘC có token + phiên còn hiệu lực */
async function auth(req, res, next) {
  try {
    const hdr = req.get("authorization") || "";
    const m = hdr.match(/^Bearer\s+(.+)$/i);
    if (!m) {
      warn("auth", "Thiếu access token", { ip: req.ip });
      return res.status(401).json({ message: "Chưa được xác thực" });
    }

    const token = m[1];
    const payload = jwt.verify(token, getAccessSecret(), { algorithms: JWT_ALGS });

    req.userId = payload.sub;
    req.sessionId = payload.sid;
    req.role = payload.role;

    const sess = await AuthSession.findOne({
      sessionId: req.sessionId,
      userId: req.userId,
    }).select("revokedAt refreshTokenExpiresAt");

    if (!sess || sess.revokedAt || sess.refreshTokenExpiresAt.getTime() <= Date.now()) {
      warn("auth", "Phiên đăng nhập đã hết hạn hoặc bị thu hồi", { userId: req.userId, sid: req.sessionId });
      return res.status(401).json({ message: "Phiên đăng nhập đã hết hạn hoặc bị thu hồi" });
    }
    next();
  } catch {
    warn("auth", "Access token không hợp lệ", { ip: req.ip });
    res.status(401).json({ message: "Chưa được xác thực" });
  }
}

/** TUỲ CHỌN: có token thì gắn user, sai/thiếu token thì bỏ qua (public endpoint) */
async function authOptional(req, res, next) {
  try {
    const hdr = req.get("authorization") || "";
    const m = hdr.match(/^Bearer\s+(.+)$/i);
    if (!m) return next();

    const token = m[1];
    const payload = jwt.verify(token, getAccessSecret(), { algorithms: JWT_ALGS });

    req.userId = payload.sub;
    req.sessionId = payload.sid;
    req.role = payload.role;
    next();
  } catch {
    next();
  }
}

// Kiểm tra role từ token (nhanh, nhưng có thể “trễ” khi role vừa đổi)
function requireRole(role) {
  return (req, res, next) => {
    if (!req.role || req.role !== role) {
      warn("auth/requireRole", "Không có quyền truy cập", { roleRequired: role, roleHas: req.role });
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }
    next();
  };
}

// Kiểm tra role trực tiếp DB (an toàn trước token cũ)
function requireRoleDb(role) {
  return async (req, res, next) => {
    try {
      const u = await User.findById(req.userId).select("_id role");
      if (!u) return res.status(401).json({ message: "Chưa được xác thực" });
      if (u.role !== role) {
        warn("auth/requireRoleDb", "Không có quyền truy cập (DB)", { roleRequired: role, roleHas: u.role });
        return res.status(403).json({ message: "Không có quyền truy cập" });
      }
      next();
    } catch {
      res.status(500).json({ message: "Lỗi máy chủ" });
    }
  };
}

module.exports = { auth, authOptional, requireRole, requireRoleDb };
