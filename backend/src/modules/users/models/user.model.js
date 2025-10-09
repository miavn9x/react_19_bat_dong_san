// backend/src/modules/users/models/user.model.js
const { Schema, model, Types } = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new Schema(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },

    // ===== Avatar (denormalize + ref tới File) =====
    avatarUrl:  { type: String, default: "" },               // đọc nhanh
    avatarFile: { type: Types.ObjectId, ref: "File" },       // ràng buộc ngược

    phone:    { type: String, default: "" },
    address:  { type: String, default: "" },
    role:     { type: String, enum: ["user", "admin"], default: "user", index: true },

    // ===== Code ổn định để truy vấn (không phụ thuộc _id) =====
    userCode: { type: String, unique: true, sparse: true, trim: true, index: true },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = model("User", userSchema);

