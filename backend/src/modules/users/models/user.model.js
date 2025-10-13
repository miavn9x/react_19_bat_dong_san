// /** Users Model
//  *  - Hash password (bcrypt cost 12)
//  *  - role index
//  *  - không select password mặc định
//  */
// const { Schema, model, Types } = require("mongoose");
// const bcrypt = require("bcrypt");

// const userSchema = new Schema(
//   {
//     name:     { type: String, required: true, trim: true },
//     email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
//     password: { type: String, required: true, select: false },

//     avatarUrl:  { type: String, default: "" },
//     avatarFile: { type: Types.ObjectId, ref: "File" },

//     phone:    { type: String, default: "" },
//     address:  { type: String, default: "" },
//     role:     { type: String, enum: ["user", "admin"], default: "user", index: true },

//     userCode: { type: String, unique: true, sparse: true, trim: true, index: true },
//   },
//   { timestamps: true }
// );

// userSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) return next();
//   this.password = await bcrypt.hash(this.password, 12);
//   next();
// });

// userSchema.methods.comparePassword = function (plain) {
//   return bcrypt.compare(plain, this.password);
// };

// module.exports = model("User", userSchema);






























































/** Users Model
 *  - Hash password (bcrypt cost 12)
 *  - role index
 *  - không select password mặc định
 */
const { Schema, model, Types } = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new Schema(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },

    avatarUrl:  { type: String, default: "" },
    avatarFile: { type: Types.ObjectId, ref: "File" },

    phone:    { type: String, default: "" },
    address:  { type: String, default: "" },
    role:     { type: String, enum: ["user", "admin"], default: "user", index: true },

    userCode: { type: String, unique: true, sparse: true, trim: true, index: true },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = model("User", userSchema);
