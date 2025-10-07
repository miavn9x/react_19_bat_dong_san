// backend/src/middlewares/auth.js
const jwt = require("jsonwebtoken");

function auth(req, res, next) {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Missing token" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch (e) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

module.exports = auth;

