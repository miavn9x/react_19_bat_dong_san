const Order = require("../models/order.model");
const quota = require("../services/quota.service");

async function myOrders(req, res) {
  const items = await Order.find({ userId: req.userId }).sort({ createdAt: -1 }).lean();
  res.json({ items });
}

async function create(req, res) {
  try {
    const { planCode, quantity = 1, couponCode = "" } = req.body || {};
    const order = await quota.createOrder(req.userId, { planCode, quantity, couponCode });
    res.status(201).json(order);
  } catch (e) {
    res.status(400).json({ message: e.message || "Không tạo được đơn hàng" });
  }
}

async function markPaid(req, res) {
  try {
    const { id } = req.params;
    const updated = await quota.markPaid(id);
    res.json(updated);
  } catch (e) { res.status(400).json({ message: e.message || "Không thể xác nhận thanh toán" }); }
}

module.exports = { myOrders, create, markPaid };
