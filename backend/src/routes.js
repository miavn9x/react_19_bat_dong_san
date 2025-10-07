// backend/src/routes.js
const express = require("express");
const router = express.Router();

// health
router.get("/health", (req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

// modules
const authModule = require("./modules/auth");
const usersModule = require("./modules/users");


// PUBLIC
router.use("/auth", authModule.routes);

// USERS (middleware auth đã gắn bên trong user.routes để rõ ràng)
router.use("/users", usersModule.routes);

module.exports = router;
