// // backend/src/controllers/auth.controller.js

const jwt = require("jsonwebtoken");
const User = require("../models/User");

/** Ký access token (thêm role vào payload) */
function signToken(user) {
  return jwt.sign(
    { sub: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES || "1h" }
  );
}

/** Đăng ký */
async function register(req, res) {
  try {
    const { name, email, password, avatar = "", phone = "", address = "" } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email, password are required" });
    }

    // Luôn tạo với role mặc định 'user' (không cho client set role lúc đăng ký)
    const user = await User.create({ name, email, password, avatar, phone, address, role: "user" });

    const token = signToken(user);
    return res.status(201).json({
      token,
      user: {
        _id: user._id, name: user.name, email: user.email,
        avatar: user.avatar, phone: user.phone, address: user.address,
        role: user.role,
      }
    });
  } catch (err) {
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

    const token = signToken(user);
    return res.json({
      token,
      user: {
        _id: user._id, name: user.name, email: user.email,
        avatar: user.avatar, phone: user.phone, address: user.address,
        role: user.role,
      }
    });
  } catch (err) {
    console.error("[login] error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = { register, login };
