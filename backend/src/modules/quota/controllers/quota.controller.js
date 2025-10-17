const quota = require("../services/quota.service");
const CreditLog = require("../models/creditLog.model");

async function myQuota(req, res) {
  const remaining = await quota.getRemaining(req.userId);
  res.json({ remaining });
}

async function myLogs(req, res) {
  const items = await CreditLog.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(200).lean();
  res.json({ items });
}

module.exports = { myQuota, myLogs };
