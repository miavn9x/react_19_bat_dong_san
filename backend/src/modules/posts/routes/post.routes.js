// backend/src/modules/posts/routes/post.routes.js
const express = require("express");
const { auth, requireRoleDb, authOptional } = require("../../../middlewares/auth");
const ctrl = require("../controllers/post.controller");

const router = express.Router();

/** Public */
router.get("/", authOptional, ctrl.list);
router.get("/:slug", authOptional, ctrl.detail);
router.get("/:id/gallery", authOptional, ctrl.gallery);

/** Auth (user/admin) */
router.post("/", auth, ctrl.create);
router.patch("/:id", auth, ctrl.update);
router.patch("/:id/cover", auth, ctrl.setCover);
router.delete("/:id", auth, ctrl.remove);

/** Admin: xét duyệt */
router.patch("/:id/moderate", auth, requireRoleDb("admin"), ctrl.moderate);

module.exports = router;
