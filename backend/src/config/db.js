// backend/src/config/db.js
const mongoose = require("mongoose");

async function connectDB(uri) {
  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(uri, { dbName: "myapp_db" });
    console.log("[MongoDB] Connected");
  } catch (err) {
    console.error("[MongoDB] Connect error:", err);
    process.exit(1);
  }
}

module.exports = { connectDB };

