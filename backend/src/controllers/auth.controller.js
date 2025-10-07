// backend/src/controllers/auth.controller.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

/** Ký access token */
function signToken(userId) {
  return jwt.sign(
    { sub: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES || "1h" }
  );
}

/** Đăng ký */
async function register(req, res) {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email, password are required" });
    }

    // tạo user
    const user = await User.create({ name, email, password });
    const token = signToken(user._id);

    return res.status(201).json({
      token,
      user: { _id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    // xử lý trùng email (E11000)
    if (err && err.code === 11000) {
      return res.status(409).json({ message: "Email đã tồn tại" });
    }
    console.error("[register] error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

/** Đăng nhập */
async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: "email & password are required" });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = signToken(user._id);
    return res.json({
      token,
      user: { _id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error("[login] error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = { register, login };
