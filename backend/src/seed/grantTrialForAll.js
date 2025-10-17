require("dotenv").config();
const { connectDB } = require("../config/db");
const User = require("../modules/users/models/user.model");
const Entitlement = require("../modules/quota/models/entitlement.model");

(async () => {
  await connectDB(process.env.MONGODB_URI);
  const users = await User.find({}).select("_id").lean();
  for (const u of users) {
    const has = await Entitlement.findOne({ userId: u._id, planCode: "TRIAL" }).select("_id");
    if (!has) {
      await Entitlement.create({
        userId: u._id, planCode: "TRIAL", planName: "Dùng thử", creditsTotal: Number(process.env.TRIAL_CREDITS || 3),
        creditsUsed: 0, creditsRemaining: Number(process.env.TRIAL_CREDITS || 3),
      });
    }
  }
  console.log("✅ Grant trial ok");
  process.exit(0);
})();
