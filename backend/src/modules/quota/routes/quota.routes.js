const router = require("express").Router();
const { auth, requireRoleDb } = require("../../../middlewares/auth");
const planCtrl = require("../controllers/plan.controller");
const couponCtrl = require("../controllers/coupon.controller");
const orderCtrl = require("../controllers/order.controller");
const quotaCtrl = require("../controllers/quota.controller");

// User
router.get("/quota/me", auth, quotaCtrl.myQuota);
router.get("/quota/logs", auth, quotaCtrl.myLogs);
router.get("/orders/me", auth, orderCtrl.myOrders);
router.post("/orders", auth, orderCtrl.create);

// Admin
router.get("/plans", auth, requireRoleDb("admin"), planCtrl.list);
router.post("/plans", auth, requireRoleDb("admin"), planCtrl.create);
router.patch("/plans/:id", auth, requireRoleDb("admin"), planCtrl.update);
router.delete("/plans/:id", auth, requireRoleDb("admin"), planCtrl.remove);

router.get("/coupons", auth, requireRoleDb("admin"), couponCtrl.list);
router.post("/coupons", auth, requireRoleDb("admin"), couponCtrl.create);
router.patch("/coupons/:id", auth, requireRoleDb("admin"), couponCtrl.update);
router.delete("/coupons/:id", auth, requireRoleDb("admin"), couponCtrl.remove);

router.patch("/orders/:id/mark-paid", auth, requireRoleDb("admin"), orderCtrl.markPaid);

module.exports = router;
