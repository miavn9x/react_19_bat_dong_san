const { Schema, model, Types } = require("mongoose");

const FileSchema = new Schema({
  owner:  { type: Types.ObjectId, ref: "User", required: true },
  bucket: { type: String, enum: ["images", "videos", "audios"], required: true },
  type:   { type: String, required: true },
  ext:    { type: String, required: true },
  originalName: { type: String, required: true },
  size:   { type: Number, required: true },

  relPath: { type: String, required: true }, // uploads/images/2025/10/09/xxx.png
  url:     { type: String, required: true }, // /uploads/images/2025/10/09/xxx.png

  year:  { type: Number, required: true },
  month: { type: Number, required: true },
  day:   { type: Number, required: true },

  label: { type: String },
}, {
  timestamps: true,
  collection: "uploads",   // ⬅️ ĐỔI TÊN COLLECTION Ở ĐÂY
});

// Giữ nguyên tên model "File" để không ảnh hưởng ref/populate
module.exports = model("File", FileSchema);
