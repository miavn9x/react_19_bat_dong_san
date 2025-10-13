// // /** Users Routes
// //  *  - bảo vệ toàn bộ /users bằng auth
// //  *  - admin zone dùng requireRoleDb('admin') để chống token cũ
// //  */
// // const express = require("express");
// // const { auth, requireRoleDb } = require("../../../middlewares/auth");
// // const {
// //   getMe,
// //   updateMe,
// //   getPublicProfile,
// //   listUsers,
// //   updateRole,
// //   deleteUser,
// // } = require("../controllers/user.controller");

// // const router = express.Router();

// // router.use(auth);

// // // Me
// // router.get("/me", getMe);
// // router.put("/me", updateMe);

// // // Public profile (ẩn email)
// // router.get("/:id/public", getPublicProfile);

// // // Admin zone
// // router.get("/", requireRoleDb("admin"), listUsers);
// // router.patch("/:id/role", requireRoleDb("admin"), updateRole);
// // router.delete("/:id", requireRoleDb("admin"), deleteUser);

// // module.exports = router;
// const express = require("express");
// const { auth, requireRoleDb } = require("../../../middlewares/auth");
// const {
//   getMe,
//   updateMe,
//   getPublicProfile,
//   listUsers,
//   updateRole,
//   deleteUser,
// } = require("../controllers/user.controller");

// const router = express.Router();

// router.use(auth);

// // Me
// router.get("/me", getMe);
// router.put("/me", updateMe);

// // Public profile (ẩn email)
// router.get("/:id/public", getPublicProfile);

// // Admin zone
// router.get("/", requireRoleDb("admin"), listUsers);
// router.patch("/:id/role", requireRoleDb("admin"), updateRole);
// router.delete("/:id", requireRoleDb("admin"), deleteUser);

// module.exports = router;







































/** Users Routes
 *  - bảo vệ toàn bộ /users bằng auth
 *  - admin zone dùng requireRoleDb('admin') để chống token cũ
 */
const express = require("express");
const { auth, requireRoleDb } = require("../../../middlewares/auth");
const {
  getMe,
  updateMe,
  getPublicProfile,
  listUsers,
  updateRole,
  deleteUser,
} = require("../controllers/user.controller");

const router = express.Router();

router.use(auth);

// Me
router.get("/me", getMe);
router.put("/me", updateMe);

// Public profile (ẩn email)
router.get("/:id/public", getPublicProfile);

// Admin zone
router.get("/", requireRoleDb("admin"), listUsers);
router.patch("/:id/role", requireRoleDb("admin"), updateRole);
router.delete("/:id", requireRoleDb("admin"), deleteUser);

module.exports = router;



