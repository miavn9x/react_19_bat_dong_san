// // backend/src/models/User.js


const { Schema, model } = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new Schema(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },

    // ➕ Trường tuỳ chọn
    avatar:   { type: String, default: "" },   // URL ảnh
    phone:    { type: String, default: "" },
    address:  { type: String, default: "" },

    // ➕ Phân quyền
    role:     { type: String, enum: ["user", "admin"], default: "user", index: true },
  },
  { timestamps: true }
);

// unique index
userSchema.index({ email: 1 }, { unique: true });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = model("User", userSchema);
