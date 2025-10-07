
// backend/src/routes/index.js
const express = require("express");
const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");
const auth = require("../middlewares/auth");

const router = express.Router();

router.get("/health", (req, res) =>
  res.json({ status: "ok", time: new Date().toISOString() })
);

// ✨ PUBLIC: KHÔNG gắn middleware auth trước /auth
router.use("/auth", authRoutes);

// ✨ PROTECTED: CHỈ gắn auth cho /users
router.use("/users", auth, userRoutes);

module.exports = router;
