
// backend/src/modules/uploads/validators/upload.validator.js
const BUCKETS = {
  images: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"],
  videos: ["video/mp4", "video/webm", "video/ogg", "video/quicktime", "video/x-matroska"],
  audios: ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/aac"],
};

function assertBucket(bucket) {
  if (!["images", "videos", "audios"].includes(bucket)) {
    const err = new Error("Bucket không hợp lệ. Chỉ: images | videos | audios");
    err.status = 400;
    throw err;
  }
}

function allowMime(bucket, mimetype) {
  return (BUCKETS[bucket] || []).includes(mimetype);
}

module.exports = { BUCKETS, assertBucket, allowMime };
