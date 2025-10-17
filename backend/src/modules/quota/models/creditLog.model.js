// backend/src/modules/quota/models/creditLog.model.js
const { Schema, model, Types } = require("mongoose");

const CreditLogSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    postId: { type: Types.ObjectId, ref: "Post", default: null, index: true },
    entitlementId: { type: Types.ObjectId, ref: "Entitlement", required: true, index: true },
    amount: { type: Number, required: true }, // -1 consume, +1 refund
    action: { type: String, enum: ["consume","refund"], required: true, index: true },
    reason: { type: String, default: "" },
    refundedOf: { type: Types.ObjectId, ref: "CreditLog", default: null }, // link tới log consume
  },
  { timestamps: true, collection: "credit_logs" }
);

module.exports = model("CreditLog", CreditLogSchema);
