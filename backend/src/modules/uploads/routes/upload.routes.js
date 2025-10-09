


// // backend/src/modules/uploads/routes/upload.routes.js
// const router = require("express").Router();
// const multer = require("multer");
// const path = require("path");
// const auth = require("../../../middlewares/auth");
// const { requireRole, authOptional } = require("../../../middlewares/auth");
// const { buildPath } = require("../services/storage.service");
// const { assertBucket, allowMime } = require("../validators/upload.validator");
// const ctrl = require("../controllers/upload.controller");

// // ===== Dung lượng theo bucket =====
// const SIZE = { MB: 1024 * 1024, GB: 1024 * 1024 * 1024 };
// const LIMITS_BY_BUCKET = {
//   images: 5 * SIZE.MB,      // ảnh: 5MB
//   videos: 8 * SIZE.GB,      // video: 8GB (tùy bạn chỉnh)
//   audios: 500 * SIZE.MB,    // audio: 500MB
// };

// // ===== Multer storage + MIME filter =====
// const storage = multer.diskStorage({
//   destination: async (req, file, cb) => {
//     try {
//       const bucket = req.params.bucket || req.body.bucket;
//       assertBucket(bucket);

//       const dt = new Date();
//       const Y = dt.getFullYear();
//       const M = String(dt.getMonth() + 1).padStart(2, "0");
//       const D = String(dt.getDate()).padStart(2, "0");

//       const dir = path.join(__dirname, "..", "..", "..", "uploads", bucket, String(Y), M, D);
//       require("fs").mkdirSync(dir, { recursive: true });
//       cb(null, dir);
//     } catch (e) { cb(e); }
//   },
//   filename: async (req, file, cb) => {
//     try {
//       const bucket = req.params.bucket || req.body.bucket;
//       const meta = await buildPath(bucket, file.originalname);
//       file._meta = meta; // đính kèm để middleware sau dùng
//       cb(null, path.basename(meta.abs));
//     } catch (e) { cb(e); }
//   },
// });

// function fileFilter(req, file, cb) {
//   try {
//     const bucket = req.params.bucket || req.body.bucket;
//     assertBucket(bucket);
//     if (!allowMime(bucket, file.mimetype)) {
//       return cb(new Error("Định dạng file không hợp lệ cho bucket này"), false);
//     }
//     cb(null, true);
//   } catch (e) { cb(e, false); }
// }

// /** Tạo uploader theo kích thước limit */
// function makeUploader(limitBytes) {
//   return multer({ storage, fileFilter, limits: { fileSize: limitBytes } });
// }

// /** Upload nhiều file theo bucket (áp limit) */
// function uploadMultiForBucket(req, res, next) {
//   try {
//     const bucket = req.params.bucket || req.body.bucket;
//     assertBucket(bucket);
//     const limitBytes = LIMITS_BY_BUCKET[bucket];
//     const uploader = makeUploader(limitBytes).fields([
//       { name: "file", maxCount: 1 },
//       { name: "files", maxCount: 40 }, // batch an toàn
//     ]);
//     uploader(req, res, (err) => (err ? next(err) : next()));
//   } catch (e) { next(e); }
// }

// /** Upload 1 file theo bucket (áp limit) */
// function uploadSingleForBucket(req, res, next) {
//   try {
//     const bucket = req.params.bucket || req.body.bucket;
//     assertBucket(bucket);
//     const limitBytes = LIMITS_BY_BUCKET[bucket];
//     const uploader = makeUploader(limitBytes).single("file");
//     uploader(req, res, (err) => (err ? next(err) : next()));
//   } catch (e) { next(e); }
// }

// /** Gắn meta từ _meta vào req.filesNormalized */
// function attachMetaMany(req, res, next) {
//   const norm = [];
//   const byField = req.files || {};
//   const pushWithMeta = (f) => {
//     if (f && f._meta) {
//       const { rel, url, y, m, d, ext } = f._meta;
//       f.relPath = rel; f.url = url; f.year = y; f.month = m; f.day = d; f.ext = ext;
//     }
//     if (f) norm.push(f);
//   };
//   (byField.file || []).forEach(pushWithMeta);
//   (byField.files || []).forEach(pushWithMeta);

//   req.filesNormalized = norm;
//   next();
// }

// function attachMetaSingle(req, res, next) {
//   if (req.file && req.file._meta) {
//     const { rel, url, y, m, d, ext } = req.file._meta;
//     req.file.relPath = rel; req.file.url = url; req.file.year = y; req.file.month = m; req.file.day = d; req.file.ext = ext;
//   }
//   next();
// }

// /* ---------- ROUTES ---------- */

// // PUBLIC: list + detail
// router.get("/", authOptional, ctrl.list);
// router.get("/:id", authOptional, ctrl.getOne);

// // INFO: cho FE biết limits theo bucket (hiển thị UI/validate trước khi gửi)
// router.get("/_info/limits/:bucket", (req, res) => {
//   try {
//     const { bucket } = req.params;
//     assertBucket(bucket);
//     res.json({ bucket, maxBytes: LIMITS_BY_BUCKET[bucket] });
//   } catch (e) {
//     res.status(e.status || 400).json({ message: e.message });
//   }
// });

// // USER/ADMIN: upload nhiều (hoặc 1) file — áp limit theo bucket
// router.post("/:bucket", auth, uploadMultiForBucket, attachMetaMany, ctrl.createMany);

// // ADMIN: sửa meta
// router.patch("/:id", auth, requireRole("admin"), ctrl.updateMeta);

// // ADMIN: thay 1 file — áp limit theo bucket
// router.put("/:id/:bucket", auth, requireRole("admin"), uploadSingleForBucket, attachMetaSingle, ctrl.replace);

// // ADMIN: xoá
// router.delete("/:id", auth, requireRole("admin"), ctrl.remove);

// module.exports = router;
// backend/src/modules/uploads/routes/upload.routes.js
const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const auth = require("../../../middlewares/auth");
const { requireRole, authOptional } = require("../../../middlewares/auth");
const { buildPath, normalizeOriginalName } = require("../services/storage.service");
const { assertBucket, allowMime } = require("../validators/upload.validator");
const ctrl = require("../controllers/upload.controller");

// ===== Dung lượng theo bucket =====
const SIZE = { MB: 1024 * 1024, GB: 1024 * 1024 * 1024 };
const LIMITS_BY_BUCKET = {
  images: 5 * SIZE.MB,      // ảnh: 5MB
  videos: 8 * SIZE.GB,      // video: 8GB
  audios: 500 * SIZE.MB,    // audio: 500MB
};

// ===== Multer storage + MIME filter =====
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const bucket = req.params.bucket || req.body.bucket;
      assertBucket(bucket);

      const dt = new Date();
      const Y = dt.getFullYear();
      const M = String(dt.getMonth() + 1).padStart(2, "0");
      const D = String(dt.getDate()).padStart(2, "0");

      const dir = path.join(__dirname, "..", "..", "..", "uploads", bucket, String(Y), M, D);
      require("fs").mkdirSync(dir, { recursive: true });
      cb(null, dir);
    } catch (e) { cb(e); }
  },
  filename: async (req, file, cb) => {
    try {
      const bucket = req.params.bucket || req.body.bucket;
      assertBucket(bucket);

      // Decode tên gốc về UTF-8 trước khi build đường dẫn
      const originalUtf8 = normalizeOriginalName(file.originalname);
      const meta = await buildPath(bucket, originalUtf8);

      // đính kèm để middleware sau/controller dùng
      file._meta = meta;
      file._originalnameUtf8 = originalUtf8;

      cb(null, path.basename(meta.abs));
    } catch (e) { cb(e); }
  },
});

function fileFilter(req, file, cb) {
  try {
    const bucket = req.params.bucket || req.body.bucket;
    assertBucket(bucket);
    if (!allowMime(bucket, file.mimetype)) {
      return cb(new Error("Định dạng file không hợp lệ cho bucket này"), false);
    }
    cb(null, true);
  } catch (e) { cb(e, false); }
}

/** Tạo uploader theo kích thước limit */
function makeUploader(limitBytes) {
  return multer({ storage, fileFilter, limits: { fileSize: limitBytes } });
}

/** Upload nhiều file theo bucket (áp limit) */
function uploadMultiForBucket(req, res, next) {
  try {
    const bucket = req.params.bucket || req.body.bucket;
    assertBucket(bucket);
    const limitBytes = LIMITS_BY_BUCKET[bucket];
    const uploader = makeUploader(limitBytes).fields([
      { name: "file", maxCount: 1 },
      { name: "files", maxCount: 40 }, // batch an toàn
    ]);
    uploader(req, res, (err) => (err ? next(err) : next()));
  } catch (e) { next(e); }
}

/** Upload 1 file theo bucket (áp limit) */
function uploadSingleForBucket(req, res, next) {
  try {
    const bucket = req.params.bucket || req.body.bucket;
    assertBucket(bucket);
    const limitBytes = LIMITS_BY_BUCKET[bucket];
    const uploader = makeUploader(limitBytes).single("file");
    uploader(req, res, (err) => (err ? next(err) : next()));
  } catch (e) { next(e); }
}

/** Gắn meta từ _meta vào req.filesNormalized */
function attachMetaMany(req, res, next) {
  const norm = [];
  const byField = req.files || {};
  const pushWithMeta = (f) => {
    if (f && f._meta) {
      const { rel, url, y, m, d, ext } = f._meta;
      f.relPath = rel; f.url = url; f.year = y; f.month = m; f.day = d; f.ext = ext;
      // tên gốc đã decode
      f.originalnameUtf8 = f._originalnameUtf8 || f.originalname;
    }
    if (f) norm.push(f);
  };
  (byField.file || []).forEach(pushWithMeta);
  (byField.files || []).forEach(pushWithMeta);

  req.filesNormalized = norm;
  next();
}

function attachMetaSingle(req, res, next) {
  if (req.file && req.file._meta) {
    const { rel, url, y, m, d, ext } = req.file._meta;
    req.file.relPath = rel; req.file.url = url; req.file.year = y; req.file.month = m; req.file.day = d; req.file.ext = ext;
    req.file.originalnameUtf8 = req.file._originalnameUtf8 || req.file.originalname;
  }
  next();
}

/* ---------- ROUTES ---------- */

// PUBLIC: list + detail
router.get("/", authOptional, ctrl.list);
router.get("/:id", authOptional, ctrl.getOne);

// INFO: cho FE biết limits theo bucket (hiển thị UI/validate trước khi gửi)
router.get("/_info/limits/:bucket", (req, res) => {
  try {
    const { bucket } = req.params;
    assertBucket(bucket);
    res.json({ bucket, maxBytes: LIMITS_BY_BUCKET[bucket] });
  } catch (e) {
    res.status(e.status || 400).json({ message: e.message });
  }
});

// USER/ADMIN: upload nhiều (hoặc 1) file — áp limit theo bucket
router.post("/:bucket", auth, uploadMultiForBucket, attachMetaMany, ctrl.createMany);

// ADMIN: sửa meta
router.patch("/:id", auth, requireRole("admin"), ctrl.updateMeta);

// ADMIN: thay 1 file — áp limit theo bucket
router.put("/:id/:bucket", auth, requireRole("admin"), uploadSingleForBucket, attachMetaSingle, ctrl.replace);

// ADMIN: xoá
router.delete("/:id", auth, requireRole("admin"), ctrl.remove);

module.exports = router;
