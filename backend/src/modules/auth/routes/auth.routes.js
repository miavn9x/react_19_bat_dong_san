// backend/src/modules/auth/routes/auth.routes.js
const express = require("express");
const { register, login } = require("../controllers/auth.controller");

const router = express.Router();
router.post("/register", register);
router.post("/login", login);

module.exports = router;
