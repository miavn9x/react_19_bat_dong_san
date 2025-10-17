// backend/src/modules/posts/index.js
/** Posts Module Entry */
module.exports = {
  routes: require("./routes/post.routes"),
  models: { Post: require("./models/post.model") },
  services: { postService: require("./services/post.service") },
};
