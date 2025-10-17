const express = require("express");
const router = express.Router();

router.get("/health", (req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

// Modules
const authModule    = require("./modules/auth");
const usersModule   = require("./modules/users");
const uploadsModule = require("./modules/uploads");
const postsModule   = require("./modules/posts");
const quotaModule   = require("./modules/quota");   // ✅ mới

router.use("/auth", authModule.routes);
router.use("/users", usersModule.routes);
router.use("/uploads", uploadsModule.routes);
router.use("/posts", postsModule.routes);
router.use("/billing", quotaModule.routes);         // ✅ mount

module.exports = router;
