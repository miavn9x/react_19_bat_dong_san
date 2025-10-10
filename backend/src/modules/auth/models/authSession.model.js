/** backend/src/modules/auth/models/authSession.model.js
 *  - Lưu phiên refresh (hash) + ràng buộc UA/IP
 *  - TTL index xóa tự động khi refreshTokenExpiresAt qua hạn
 */
const mongoose = require("mongoose");

const AuthSessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, index: true, unique: true },
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    email:     { type: String, required: true, index: true },

    refreshTokenHash: { type: String, required: true },

    userAgent: { type: String, default: "" },
    ip:        { type: String, default: "" },

    refreshTokenExpiresAt: { type: Date, required: true }, // không index trực tiếp
    lastUsedAt: { type: Date, default: null },

    revokedAt:    { type: Date, default: null, index: true },
    revokeReason: { type: String, default: "" },
  },
  { timestamps: true }
);

// TTL index hợp lệ
AuthSessionSchema.index({ refreshTokenExpiresAt: 1 }, { expireAfterSeconds: 0, name: "rt_ttl" });

AuthSessionSchema.methods.isActive = function () {
  if (this.revokedAt) return false;
  return this.refreshTokenExpiresAt.getTime() > Date.now();
};

module.exports = mongoose.model("AuthSession", AuthSessionSchema);
