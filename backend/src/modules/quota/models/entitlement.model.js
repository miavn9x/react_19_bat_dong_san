const { Schema, model, Types } = require("mongoose");

const EntSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    planId: { type: Types.ObjectId, ref: "Plan", default: null },
    sourceOrderId: { type: Types.ObjectId, ref: "Order", default: null },

    planCode: { type: String, required: true, uppercase: true, index: true },
    planName: { type: String, required: true },

    creditsTotal: { type: Number, required: true, min: 0 },
    creditsUsed: { type: Number, required: true, min: 0, default: 0 },
    creditsRemaining: { type: Number, required: true, min: 0 },

    expiresAt: { type: Date }, // optional
    status: { type: String, enum: ["active","expired","revoked"], default: "active", index: true },
  },
  { timestamps: true, collection: "entitlements" }
);

module.exports = model("Entitlement", EntSchema);
