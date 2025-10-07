// backend/src/routes/index.js

const express = require("express");
const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");
const auth = require("../middlewares/auth");

const router = express.Router();

router.get("/health", (req, res) =>
  res.json({ status: "ok", time: new Date().toISOString() })
);

router.use("/auth", authRoutes);

// các route dưới đây yêu cầu Bearer token
router.use("/users", auth, userRoutes);

module.exports = router;
