const { Schema, model } = require("mongoose");

const CouponSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    percent: { type: Number, required: true, min: 0, max: 100 },
    expiresAt: { type: Date },
    isActive: { type: Boolean, default: true, index: true },
    maxRedemptions: { type: Number, default: 0 }, // 0 = unlimited
    timesRedeemed: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "coupons" }
);

module.exports = model("Coupon", CouponSchema);
