const { Schema, model } = require("mongoose");

const PlanSchema = new Schema(
  {
    code:   { type: String, required: true, unique: true, uppercase: true, trim: true },
    name:   { type: String, required: true },
    price:  { type: Number, required: true, min: 0 }, // đơn giá 1 gói
    currency: { type: String, enum: ["VND","USD"], default: "VND" },
    credits: { type: Number, required: true, min: 1 }, // số lượt đăng bài
    defaultDiscountPct: { type: Number, min: 0, max: 100, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
    sortOrder:{ type: Number, default: 0 },
  },
  { timestamps: true, collection: "plans" }
);

module.exports = model("Plan", PlanSchema);
