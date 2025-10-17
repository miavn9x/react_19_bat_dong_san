const Entitlement = require("../models/entitlement.model");
const CreditLog = require("../models/creditLog.model");
const Plan = require("../models/plan.model");
const Order = require("../models/order.model");
const Coupon = require("../models/coupon.model");
const mongoose = require("mongoose");

const TRIAL_PLAN_CODE = "TRIAL";
const TRIAL_CREDITS = Number(process.env.TRIAL_CREDITS || 3);

/** Tổng số credits còn lại */
async function getRemaining(userId) {
  const rows = await Entitlement.find({ userId, status: "active", creditsRemaining: { $gt: 0 } })
    .select("creditsRemaining").lean();
  return rows.reduce((s, r) => s + (r.creditsRemaining || 0), 0);
}

/** Cấp trial nếu chưa có */
async function grantTrialIfNeeded(userId) {
  const exists = await Entitlement.findOne({ userId, planCode: TRIAL_PLAN_CODE }).select("_id").lean();
  if (exists) return null;
  return Entitlement.create({
    userId,
    planCode: TRIAL_PLAN_CODE,
    planName: "Dùng thử",
    creditsTotal: TRIAL_CREDITS,
    creditsUsed: 0,
    creditsRemaining: TRIAL_CREDITS,
  });
}

/** Tiêu thụ 1 credit (FIFO theo entitlement) */
async function consumeOneOrThrow(userId, { postId = null, reason = "" } = {}) {
  const ent = await Entitlement.findOne({
    userId,
    status: "active",
    creditsRemaining: { $gt: 0 },
  }).sort({ createdAt: 1 });

  if (!ent) {
    const left = await getRemaining(userId);
    const err = new Error(`Hết hạn mức đăng tin. Còn lại: ${left}`);
    err.code = "NO_CREDIT";
    throw err;
  }

  ent.creditsUsed += 1;
  ent.creditsRemaining = Math.max(0, ent.creditsRemaining - 1);
  await ent.save();

  const log = await CreditLog.create({
    userId, postId, entitlementId: ent._id, amount: -1, action: "consume", reason,
  });

  return log;
}

/** Hoàn trả theo consumptionId (khi reject hoặc xoá pending) */
async function refundByConsumptionId(consumptionId, reason = "") {
  const consume = await CreditLog.findById(consumptionId);
  if (!consume || consume.action !== "consume") return null;

  const ent = await Entitlement.findById(consume.entitlementId);
  if (!ent) return null;

  // Đã có refund?
  const refunded = await CreditLog.findOne({ refundedOf: consume._id }).select("_id").lean();
  if (refunded) return null;

  ent.creditsUsed = Math.max(0, ent.creditsUsed - 1);
  ent.creditsRemaining += 1;
  await ent.save();

  const ref = await CreditLog.create({
    userId: consume.userId,
    postId: consume.postId,
    entitlementId: ent._id,
    amount: +1,
    action: "refund",
    reason,
    refundedOf: consume._id,
  });

  return ref;
}

/** Tạo đơn hàng (pending) + tính giảm giá */
async function createOrder(userId, { planCode, quantity = 1, couponCode = "" }) {
  const plan = await Plan.findOne({ code: planCode.toUpperCase(), isActive: true });
  if (!plan) throw new Error("Gói không tồn tại hoặc ngừng bán");

  let discountPct = plan.defaultDiscountPct || 0;
  let coupon = null;

  if (couponCode) {
    coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
    if (!coupon) throw new Error("Mã giảm giá không hợp lệ");
    if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) throw new Error("Mã giảm giá đã hết hạn");
    if (coupon.maxRedemptions && coupon.timesRedeemed >= coupon.maxRedemptions) throw new Error("Mã đã dùng hết lượt");
    discountPct = Math.max(discountPct, coupon.percent || 0);
  }

  const subtotal = plan.price * quantity;
  const discountAmount = Math.floor(subtotal * (discountPct / 100));
  const total = Math.max(0, subtotal - discountAmount);

  const order = await Order.create({
    userId,
    planId: plan._id,
    planSnapshot: { code: plan.code, name: plan.name, credits: plan.credits, price: plan.price, currency: plan.currency },
    quantity,
    subtotal, discountPct, discountAmount, total,
    couponCode: couponCode.toUpperCase(),
    status: "pending",
  });

  return order;
}

/** Admin: đánh dấu đã thanh toán -> cấp entitlement */
async function markPaid(orderId) {
  const order = await Order.findById(orderId).populate("planId");
  if (!order || order.status !== "pending") throw new Error("Order không hợp lệ");

  order.status = "paid";
  await order.save();

  // Cộng credits
  const credits = (order.planSnapshot?.credits || order.planId.credits) * (order.quantity || 1);
  await Entitlement.create({
    userId: order.userId,
    planId: order.planId?._id || null,
    sourceOrderId: order._id,
    planCode: order.planSnapshot?.code || order.planId.code,
    planName: order.planSnapshot?.name || order.planId.name,
    creditsTotal: credits,
    creditsUsed: 0,
    creditsRemaining: credits,
  });

  // tăng đếm coupon
  if (order.couponCode) {
    await Coupon.updateOne({ code: order.couponCode }, { $inc: { timesRedeemed: 1 } });
  }

  return order;
}

module.exports = {
  getRemaining,
  grantTrialIfNeeded,
  consumeOneOrThrow,
  refundByConsumptionId,
  createOrder,
  markPaid,
};
