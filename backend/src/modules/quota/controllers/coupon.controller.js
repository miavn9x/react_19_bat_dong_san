const Coupon = require("../models/coupon.model");

async function list(req, res) {
  const items = await Coupon.find({}).sort({ createdAt: -1 }).lean();
  res.json({ items });
}

async function create(req, res) {
  try {
    const { code, percent, expiresAt, isActive = true, maxRedemptions = 0 } = req.body || {};
    const doc = await Coupon.create({
      code: String(code).toUpperCase(), percent, expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      isActive, maxRedemptions,
    });
    res.status(201).json(doc);
  } catch (e) { res.status(400).json({ message: e.message || "Dữ liệu không hợp lệ" }); }
}

async function update(req, res) {
  try {
    const { id } = req.params;
    const patch = { ...req.body };
    if (patch.expiresAt) patch.expiresAt = new Date(patch.expiresAt);
    const doc = await Coupon.findByIdAndUpdate(id, { $set: patch }, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ message: "Không tìm thấy" });
    res.json(doc);
  } catch (e) { res.status(400).json({ message: e.message || "Dữ liệu không hợp lệ" }); }
}

async function remove(req, res) {
  const { id } = req.params;
  const r = await Coupon.findByIdAndDelete(id);
  if (!r) return res.status(404).json({ message: "Không tìm thấy" });
  res.json({ ok: true });
}

module.exports = { list, create, update, remove };
