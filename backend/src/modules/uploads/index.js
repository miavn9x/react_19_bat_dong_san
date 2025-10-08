// backend/src/modules/uploads/index.js
module.exports = {
  routes: require("./routes/upload.routes"),
  models: { File: require("./models/file.model") },
};
