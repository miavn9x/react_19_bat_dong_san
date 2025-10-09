
// // backend/src/modules/uploads/validators/upload.validator.js
// /**
//  * Upload validator:
//  */
// const BUCKETS = {
//   images: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"],
//   videos: ["video/mp4", "video/webm", "video/ogg", "video/quicktime", "video/x-matroska"],
//   audios: ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/aac"],
// };

// function assertBucket(bucket) {
//   if (!["images", "videos", "audios"].includes(bucket)) {
//     const err = new Error("Bucket không hợp lệ. Chỉ: images | videos | audios");
//     err.status = 400;
//     throw err;
//   }
// }

// function allowMime(bucket, mimetype) {
//   return (BUCKETS[bucket] || []).includes(mimetype);
// }

// module.exports = { BUCKETS, assertBucket, allowMime };





// backend/src/modules/uploads/services/storage.service.js
/**
 * Upload Validator
 * -----------------------------------------
 * - Xác thực bucket hợp lệ.
 * - Kiểm tra MIME type theo từng bucket.
 */

const BUCKETS = {
  images: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"],
  videos: ["video/mp4", "video/webm", "video/ogg", "video/quicktime", "video/x-matroska"],
  audios: ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/aac"],
};

/** assertBucket(bucket) — ném lỗi nếu bucket không hợp lệ */
function assertBucket(bucket) {
  if (!["images", "videos", "audios"].includes(bucket)) {
    const err = new Error("Bucket không hợp lệ. Chỉ: images | videos | audios");
    err.status = 400;
    throw err;
  }
}

/** allowMime(bucket, mimetype) — true nếu mimetype hợp lệ cho bucket */
function allowMime(bucket, mimetype) {
  return (BUCKETS[bucket] || []).includes(mimetype);
}

module.exports = { BUCKETS, assertBucket, allowMime };
