const { Schema, model, Types } = require("mongoose");

const OrderSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    planId: { type: Types.ObjectId, ref: "Plan", required: true, index: true },

    planSnapshot: {
      code: String, name: String, credits: Number, price: Number, currency: String,
    },

    quantity: { type: Number, min: 1, default: 1 },
    subtotal: { type: Number, min: 0, default: 0 },
    discountPct: { type: Number, min: 0, max: 100, default: 0 },
    discountAmount: { type: Number, min: 0, default: 0 },
    total: { type: Number, min: 0, default: 0 },

    couponCode: { type: String, default: "", uppercase: true, trim: true },
    status: { type: String, enum: ["pending","paid","failed","cancelled"], default: "pending", index: true },
    payMethod: { type: String, default: "manual" },
    note: { type: String, default: "" },
  },
  { timestamps: true, collection: "orders" }
);

module.exports = model("Order", OrderSchema);
