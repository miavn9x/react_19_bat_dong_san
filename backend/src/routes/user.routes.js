// backend/src/routes/user.routes.js

const express = require("express");
const User = require("../models/User");

const router = express.Router();

// GET /api/users/me → trả thông tin user từ token
router.get("/me", async (req, res) => {
  // req.userId được set trong middleware auth
  const me = await User.findById(req.userId).select("_id name email createdAt updatedAt");
  if (!me) return res.status(404).json({ message: "User not found" });
  res.json(me);
});

// GET /api/users → list user (chỉ để test nhanh)
router.get("/", async (_req, res) => {
  const list = await User.find().select("_id name email createdAt");
  res.json(list);
});

module.exports = router;
