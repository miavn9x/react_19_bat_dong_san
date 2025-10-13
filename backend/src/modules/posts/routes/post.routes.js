// backend/src/modules/posts/routes/post.routes.js
const express = require("express");
const { auth, requireRoleDb, authOptional } = require("../../../middlewares/auth");
const ctrl = require("../controllers/post.controller");

const router = express.Router();

/** Public */
router.get("/", authOptional, ctrl.list);
router.get("/:slug", authOptional, ctrl.detail);
router.get("/:id/gallery", authOptional, ctrl.gallery);

/** Admin */
router.post("/", auth, requireRoleDb("admin"), ctrl.create);
router.patch("/:id", auth, requireRoleDb("admin"), ctrl.update);
router.patch("/:id/cover", auth, requireRoleDb("admin"), ctrl.setCover);
router.delete("/:id", auth, requireRoleDb("admin"), ctrl.remove);

module.exports = router;
