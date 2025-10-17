require("dotenv").config();
const { connectDB } = require("../config/db");
const Plan = require("../modules/quota/models/plan.model");

(async () => {
  await connectDB(process.env.MONGODB_URI);
  const defs = [
    { code: "BASIC",    name: "Cơ bản",   price: 99000,  currency: "VND", credits: 5,  defaultDiscountPct: 0,  sortOrder: 1 },
    { code: "STANDARD", name: "Tiêu chuẩn", price: 199000, currency: "VND", credits: 12, defaultDiscountPct: 10, sortOrder: 2 },
    { code: "PRO",      name: "Cao cấp",  price: 399000, currency: "VND", credits: 30, defaultDiscountPct: 15, sortOrder: 3 },
  ];
  for (const p of defs) {
    await Plan.updateOne({ code: p.code }, { $set: p }, { upsert: true });
  }
  console.log("✅ Seed plans ok");
  process.exit(0);
})();
