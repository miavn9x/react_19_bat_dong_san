// backend/src/modules/uploads/index.js
/**
 * Uploads Module Entry
 * -----------------------------------------
 * - Xuất routes & models để app chính mount và sử dụng.
 * - Không thay đổi nguyên lý upload đã triển khai.
 */

module.exports = {
  routes: require("./routes/upload.routes"),
  models: { File: require("./models/file.model") },
};
