// // backend/src/middlewares/auth.js
// const jwt = require("jsonwebtoken");

// /** Yêu cầu có token hợp lệ */
// function auth(req, res, next) {
//   const hdr = req.headers.authorization || "";
//   const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
//   if (!token) return res.status(401).json({ message: "Missing token" });

//   try {
//     const payload = jwt.verify(token, process.env.JWT_SECRET);
//     req.userId = payload.sub;
//     req.userRole = payload.role || "user"; // lưu role vào req
//     next();
//   } catch {
//     return res.status(401).json({ message: "Invalid or expired token" });
//   }
// }

// /** Yêu cầu một trong các role */
// function requireRole(...roles) {
//   return (req, res, next) => {
//     if (!req.userRole || !roles.includes(req.userRole)) {
//       return res.status(403).json({ message: "Forbidden" });
//     }
//     next();
//   };
// }

// module.exports = auth;
// module.exports.requireRole = requireRole;
const jwt = require("jsonwebtoken");

/**
 * Xác thực bắt buộc: yêu cầu có Bearer token hợp lệ.
 * - Chỉ tin HS256 (hoặc sửa theo alg bạn dùng)
 * - Gán req.userId, req.userRole
 */
function auth(req, res, next) {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Missing token" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
    req.userId = payload.sub;
    req.userRole = payload.role || "user"; // "user" | "admin"
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

/** Cho phép truy cập khi không có token; nếu có token thì gán user vào req */
function authOptional(req, res, next) {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
  if (!token) return next();

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
    req.userId = payload.sub;
    req.userRole = payload.role || "user";
  } catch (_) {
    // Bỏ qua lỗi; coi như khách
  }
  return next();
}

/** Yêu cầu một trong các role */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}

module.exports = auth;
module.exports.authOptional = authOptional;
module.exports.requireRole = requireRole;
