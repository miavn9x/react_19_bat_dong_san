

// backend/src/modules/uploads/models/file.model.js

/**
 * File Model (Mongoose)
 * -----------------------------------------
 * Mô tả:
 *  - Lưu metadata của file đã upload (ảnh/video/audio).
 *  - Tái sử dụng cho nhiều module (post/product/user...).
 *  - Tương thích nhóm cũ qua trường `group`.
 *
 * Trường chính:
 *  - owner      : Người upload (ref User)
 *  - bucket     : images | videos | audios
 *  - type/ext   : MIME & phần mở rộng
 *  - originalName/url/relPath/size + (year, month, day)
 *  - label/order/isPrimary : phục vụ hiển thị & sắp xếp
 *  - entityType/entityId/entityCode : liên kết bền (để mở rộng sau)
 *  - group      : tương thích ngược (đang dùng)
 *
 * Index:
 *  - (entityType, entityId, order), (entityType, entityCode, order)
 *  - (bucket, createdAt), (group, order)
 */

const { Schema, model, Types } = require("mongoose");

/** Upload file model — version nâng cấp, tương thích group */
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
    isPrimary: { type: Boolean, default: false }, // ảnh đại diện

    // Liên kết bền (để mở rộng về sau nếu cần)
    entityType: { type: String, index: true },         // 'user' | 'post' | 'product' | ...
    entityId:   { type: Types.ObjectId, index: true, default: null },
    entityCode: { type: String, index: true, default: "" },

    // Backward-compat: đang dùng group
    group: { type: String, default: "" },
  },
  { timestamps: true, collection: "uploads" }
);

// Index quan trọng
FileSchema.index({ entityType: 1, entityId: 1, order: 1 });
FileSchema.index({ entityType: 1, entityCode: 1, order: 1 });
FileSchema.index({ bucket: 1, createdAt: -1 });
FileSchema.index({ group: 1, order: 1 }); // để không phá phần cũ

module.exports = model("File", FileSchema);
