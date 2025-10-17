const Plan = require("../models/plan.model");

async function list(req, res) {
  const items = await Plan.find({}).sort({ sortOrder: 1, createdAt: -1 }).lean();
  res.json({ items });
}

async function create(req, res) {
  try {
    const { code, name, price, currency = "VND", credits, defaultDiscountPct = 0, isActive = true, sortOrder = 0 } = req.body || {};
    const doc = await Plan.create({ code: String(code).toUpperCase(), name, price, currency, credits, defaultDiscountPct, isActive, sortOrder });
    res.status(201).json(doc);
  } catch (e) { res.status(400).json({ message: e.message || "Dữ liệu không hợp lệ" }); }
}

async function update(req, res) {
  try {
    const { id } = req.params;
    const doc = await Plan.findByIdAndUpdate(id, { $set: req.body || {} }, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ message: "Không tìm thấy" });
    res.json(doc);
  } catch (e) { res.status(400).json({ message: e.message || "Dữ liệu không hợp lệ" }); }
}

async function remove(req, res) {
  const { id } = req.params;
  const r = await Plan.findByIdAndDelete(id);
  if (!r) return res.status(404).json({ message: "Không tìm thấy" });
  res.json({ ok: true });
}

module.exports = { list, create, update, remove };
