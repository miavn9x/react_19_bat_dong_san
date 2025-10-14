// backend/src/modules/uploads/models/file.model.js

/**
 * File Model (Mongoose)
 * -----------------------------------------
 * - Lưu metadata của file upload (ảnh/video/audio).
 * - Dùng chung cho nhiều module (post/product/user...).
 * - Tương thích nhóm cũ qua trường `group`.
 */
const { Schema, model, Types } = require("mongoose");

const FileSchema = new Schema(
  {
    owner: { type: Types.ObjectId, ref: "User", required: true, index: true },

    // File info
    bucket: { type: String, enum: ["images", "videos", "audios"], required: true },
    type:   { type: String, required: true },
    ext:    { type: String, required: true },
    originalName: { type: String, required: true },
    size:   { type: Number, required: true },
    relPath: { type: String, required: true },
    url:     { type: String, required: true },

    year: Number, month: Number, day: Number,

    // Meta hiển thị
    label: { type: String },
    order: { type: Number, default: 0 },
    isPrimary: { type: Boolean, default: false },

    // Liên kết bền (mở rộng sau)
    entityType: { type: String, index: true },
    entityId:   { type: Types.ObjectId, index: true, default: null },
    entityCode: { type: String, index: true, default: "" },

    // Backward-compat
    group: { type: String, default: "" },
  },
  { timestamps: true, collection: "uploads" }
);

// Index
FileSchema.index({ entityType: 1, entityId: 1, order: 1 });
FileSchema.index({ entityType: 1, entityCode: 1, order: 1 });
FileSchema.index({ bucket: 1, createdAt: -1 });
FileSchema.index({ group: 1, order: 1 });

module.exports = model("upload", FileSchema);
