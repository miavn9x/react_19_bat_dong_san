// backend/src/modules/users/index.js
module.exports = {
  routes: require("./routes/user.routes"),
  models: { User: require("./models/user.model") },
};
