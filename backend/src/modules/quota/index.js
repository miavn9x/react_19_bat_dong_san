module.exports = {
  routes: require("./routes/quota.routes"),
  models: {
    Plan: require("./models/plan.model"),
    Coupon: require("./models/coupon.model"),
    Order: require("./models/order.model"),
    Entitlement: require("./models/entitlement.model"),
    CreditLog: require("./models/creditLog.model"),
  },
  services: {
    quotaService: require("./services/quota.service"),
  },
};
