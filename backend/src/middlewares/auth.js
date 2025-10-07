// backend/src/middlewares/auth.js
const jwt = require("jsonwebtoken");

/** Yêu cầu có token hợp lệ */
function auth(req, res, next) {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Missing token" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.sub;
    req.userRole = payload.role || "user"; // lưu role vào req
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
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
module.exports.requireRole = requireRole;
