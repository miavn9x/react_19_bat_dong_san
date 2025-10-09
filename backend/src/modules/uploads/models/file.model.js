

// backend/src/modules/uploads/models/file.model.js
const { Schema, model, Types } = require("mongoose");

/**
 * File upload model:
 * - group: khóa nhóm (vd: "post:6612abc...", "product:66ff...") để gom file theo bài viết/sản phẩm
 * - order: thứ tự hiển thị trong nhóm (số nguyên, tăng dần)
 */
const FileSchema = new Schema(
  {
    owner: { type: Types.ObjectId, ref: "User", required: true },
    bucket: { type: String, enum: ["images", "videos", "audios"], required: true },
    type: { type: String, required: true },
    ext: { type: String, required: true },
    originalName: { type: String, required: true },
    size: { type: Number, required: true },

    relPath: { type: String, required: true }, // uploads/images/2025/10/09/xxx.png
    url: { type: String, required: true },     // /uploads/images/2025/10/09/xxx.png

    year: { type: Number, required: true },
    month: { type: Number, required: true },
    day: { type: Number, required: true },

    label: { type: String },

    // NEW:
    group: { type: String, default: "" },      // Nhóm liên kết (bài viết/sản phẩm)
    order: { type: Number, default: 0 },       // Thứ tự trong nhóm
  },
  {
    timestamps: true,
    collection: "uploads",
  }
);

// Index giúp list theo nhóm nhanh & ổn định
FileSchema.index({ group: 1, order: 1 });
FileSchema.index({ bucket: 1, createdAt: -1 });

module.exports = model("File", FileSchema);
