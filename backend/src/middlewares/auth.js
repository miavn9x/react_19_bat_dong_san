// /** backend/src/middlewares/auth.js
//  *  - Access JWT auth: xác thực + kiểm tra phiên chưa revoke/hết hạn
//  *  - requireRole('admin'): kiểm tra role từ token (nhanh)
//  *  - requireRoleDb('admin'): kiểm tra role trực tiếp từ DB (an toàn trước token cũ)
//  */
// const jwt = require("jsonwebtoken");
// const AuthSession = require("../modules/auth/models/authSession.model");
// const User = require("../modules/users/models/user.model");

// const JWT_ALGS = ["HS256"];
// const getAccessSecret = () => process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;

// async function auth(req, res, next) {
//   try {
//     const hdr = req.get("authorization") || "";
//     const m = hdr.match(/^Bearer\s+(.+)$/i);
//     if (!m) return res.status(401).json({ message: "Unauthorized" });

//     const token = m[1];
//     const payload = jwt.verify(token, getAccessSecret(), { algorithms: JWT_ALGS });

//     req.userId = payload.sub;
//     req.sessionId = payload.sid;
//     req.role = payload.role;

//     const sess = await AuthSession.findOne({ sessionId: req.sessionId, userId: req.userId })
//       .select("revokedAt refreshTokenExpiresAt");
//     if (!sess || sess.revokedAt || sess.refreshTokenExpiresAt.getTime() <= Date.now()) {
//       return res.status(401).json({ message: "Session expired or revoked" });
//     }
//     next();
//   } catch {
//     res.status(401).json({ message: "Unauthorized" });
//   }
// }

// // Kiểm tra role từ token (nhanh, nhưng có thể “trễ” khi role vừa đổi)
// function requireRole(role) {
//   return (req, res, next) => {
//     if (!req.role || req.role !== role) return res.status(403).json({ message: "Forbidden" });
//     next();
//   };
// }

// // Kiểm tra role trực tiếp từ DB (an toàn tuyệt đối trước token cũ)
// // Kiểm tra role trực tiếp DB (an toàn trước token cũ)
// function requireRoleDb(role) {
//   return async (req, res, next) => {
//     try {
//       const u = await User.findById(req.userId).select("_id role");
//       if (!u) return res.status(401).json({ message: "Unauthorized" });
//       if (u.role !== role) return res.status(403).json({ message: "Forbidden" });
//       next();
//     } catch (e) {
//       res.status(500).json({ message: "Server error" });
//     }
//   };
// }

// module.exports = { auth, requireRole, requireRoleDb };

/** backend/src/middlewares/auth.js
 *  - Access JWT auth: xác thực + kiểm tra phiên chưa revoke/hết hạn
 *  - requireRole('admin'): kiểm tra role từ token (nhanh)
 *  - requireRoleDb('admin'): kiểm tra role trực tiếp từ DB (an toàn trước token cũ)
 *  - authOptional: nếu có token hợp lệ thì gắn user, nếu không thì cho qua như khách
 */
const jwt = require("jsonwebtoken");
const AuthSession = require("../modules/auth/models/authSession.model");
const User = require("../modules/users/models/user.model");

const JWT_ALGS = ["HS256"];
const getAccessSecret = () =>
  process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;

/** BẮT BUỘC có token + phiên còn hiệu lực */
async function auth(req, res, next) {
  try {
    const hdr = req.get("authorization") || "";
    const m = hdr.match(/^Bearer\s+(.+)$/i);
    if (!m) return res.status(401).json({ message: "Unauthorized" });

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
      return res.status(401).json({ message: "Session expired or revoked" });
    }
    next();
  } catch {
    res.status(401).json({ message: "Unauthorized" });
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
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}

// Kiểm tra role trực tiếp DB (an toàn trước token cũ)
function requireRoleDb(role) {
  return async (req, res, next) => {
    try {
      const u = await User.findById(req.userId).select("_id role");
      if (!u) return res.status(401).json({ message: "Unauthorized" });
      if (u.role !== role) return res.status(403).json({ message: "Forbidden" });
      next();
    } catch {
      res.status(500).json({ message: "Server error" });
    }
  };
}

module.exports = { auth, authOptional, requireRole, requireRoleDb };
