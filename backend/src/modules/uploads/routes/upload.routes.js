// // backend/src/modules/uploads/routes/upload.routes.js
// /**
//  * Upload routes:
//  * - Upload file lên server
//  * - Lưu metadata file vào MongoDB
//  * 
//  */
// const router = require("express").Router();
// const multer = require("multer");
// const path = require("path");
// const auth = require("../../../middlewares/auth");
// const { requireRole, authOptional } = require("../../../middlewares/auth");
// const { buildPath, normalizeOriginalName } = require("../services/storage.service");
// const { assertBucket, allowMime } = require("../validators/upload.validator");
// const ctrl = require("../controllers/upload.controller");

// // ===== Dung lượng theo bucket =====
// const SIZE = { MB: 1024 * 1024, GB: 1024 * 1024 * 1024 };
// const LIMITS_BY_BUCKET = {
//   images: 5 * SIZE.MB,      // ảnh: 5MB / file
//   videos: 8 * SIZE.GB,      // video: 8GB / file
//   audios: 500 * SIZE.MB,    // audio: 500MB / file
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
//       assertBucket(bucket);

//       // Decode tên gốc về UTF-8 trước khi build đường dẫn
//       const originalUtf8 = normalizeOriginalName(file.originalname);
//       const meta = await buildPath(bucket, originalUtf8);

//       // đính kèm để middleware sau/controller dùng
//       file._meta = meta;
//       file._originalnameUtf8 = originalUtf8;

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

// /** Upload nhiều file theo bucket (áp limit từng file) — dùng .any() để tránh Unexpected field */
// function uploadMultiForBucket(req, res, next) {
//   try {
//     const bucket = req.params.bucket || req.body.bucket;
//     assertBucket(bucket);
//     const limitBytes = LIMITS_BY_BUCKET[bucket];

//     // Dùng .any() để chấp nhận mọi tên field (file, files, files[], files[0]...)
//     const uploader = makeUploader(limitBytes).any();
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

// /** Gắn meta từ _meta vào req.filesNormalized (chuẩn hoá cho .any()) */
// function attachMetaMany(req, res, next) {
//   // Với .any(), req.files là MẢNG các file; Multer không group theo key
//   const filesArr = Array.isArray(req.files)
//     ? req.files
//     : (req.files && typeof req.files === "object"
//         ? Object.values(req.files).flat()
//         : []);

//   // Giới hạn số lượng file tối đa/batch (an toàn)
//   const MAX_BATCH = 40;
//   if (filesArr.length > MAX_BATCH) {
//     return res.status(400).json({ message: `Quá số lượng file cho phép (${MAX_BATCH})` });
//   }

//   const norm = [];
//   const pushWithMeta = (f) => {
//     if (!f) return;
//     if (f._meta) {
//       const { rel, url, y, m, d, ext } = f._meta;
//       f.relPath = rel; f.url = url; f.year = y; f.month = m; f.day = d; f.ext = ext;
//       f.originalnameUtf8 = f._originalnameUtf8 || f.originalname;
//     }
//     norm.push(f);
//   };

//   filesArr.forEach(pushWithMeta);

//   req.filesNormalized = norm;
//   next();
// }

// function attachMetaSingle(req, res, next) {
//   if (req.file && req.file._meta) {
//     const { rel, url, y, m, d, ext } = req.file._meta;
//     req.file.relPath = rel; req.file.url = url; req.file.year = y; req.file.month = m; req.file.day = d; req.file.ext = ext;
//     req.file.originalnameUtf8 = req.file._originalnameUtf8 || req.file.originalname;
//   }
//   next();
// }

// /* ---------- ROUTES ---------- */

// // INFO: cho FE biết limits theo bucket (đặt TRƯỚC :id để không bị nuốt)
// router.get("/_info/limits/:bucket", (req, res) => {
//   try {
//     const { bucket } = req.params;
//     assertBucket(bucket);
//     res.json({ bucket, maxBytes: LIMITS_BY_BUCKET[bucket] });
//   } catch (e) {
//     res.status(e.status || 400).json({ message: e.message });
//   }
// });

// // PUBLIC: list + detail
// router.get("/", authOptional, ctrl.list);
// router.get("/:id", authOptional, ctrl.getOne);

// // USER/ADMIN: upload nhiều (hoặc 1) file — áp limit theo bucket
// router.post("/:bucket", auth, uploadMultiForBucket, attachMetaMany, ctrl.createMany);

// // ADMIN: sửa meta
// router.patch("/:id", auth, requireRole("admin"), ctrl.updateMeta);

// // ADMIN: thay 1 file — áp limit theo bucket (chuẩn REST -> PUT)
// router.put("/:id/:bucket", auth, requireRole("admin"), uploadSingleForBucket, attachMetaSingle, ctrl.replace);

// // (TÙY CHỌN) Alias cho ai lỡ gọi POST thay vì PUT khi replace — tránh 404
// router.post("/:id/:bucket", auth, requireRole("admin"), uploadSingleForBucket, attachMetaSingle, ctrl.replace);

// // ADMIN: xoá
// router.delete("/:id", auth, requireRole("admin"), ctrl.remove);

// module.exports = router;


























// backend/src/modules/uploads/models/file.model.js
/**
 * Upload Routes (Express)
 * -----------------------------------------
 * Chức năng:
 *  - Nhận multipart upload (1 hoặc nhiều file).
 *  - Lưu file lên disk (diskStorage) và gắn meta vào req.file(s).
 *  - Chặn MIME theo bucket + giới hạn dung lượng theo bucket.
 *
 * Lưu ý:
 *  - Dùng `.any()` để không bị "LIMIT_UNEXPECTED_FILE" bởi tên field khác nhau.
 *  - Gắn `req.filesNormalized` để controller xử lý thống nhất.
 *  - Giữ nguyên các route đã có (list, detail, createMany, updateMeta, replace, remove).
 */

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
  images: 5 * SIZE.MB,      // ảnh: 5MB / file
  videos: 8 * SIZE.GB,      // video: 8GB / file
  audios: 500 * SIZE.MB,    // audio: 500MB / file
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

/** Kiểm mime theo bucket */
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

/**
 * Upload nhiều file theo bucket (áp limit từng file)
 * - Dùng .any() để chấp nhận mọi tên field (file, files, files[], files[0]...) → tránh MulterError: Unexpected field
 */
function uploadMultiForBucket(req, res, next) {
  try {
    const bucket = req.params.bucket || req.body.bucket;
    assertBucket(bucket);
    const limitBytes = LIMITS_BY_BUCKET[bucket];

    const uploader = makeUploader(limitBytes).any();
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

/**
 * Chuẩn hóa req.filesNormalized từ req.files (khi dùng .any())
 * - Thêm các meta: relPath/url/year/month/day/ext/originalnameUtf8 từ file._meta đã gắn ở storage
 * - Giới hạn batch tối đa 40 file để an toàn
 */
function attachMetaMany(req, res, next) {
  const filesArr = Array.isArray(req.files)
    ? req.files
    : (req.files && typeof req.files === "object"
        ? Object.values(req.files).flat()
        : []);

  const MAX_BATCH = 40;
  if (filesArr.length > MAX_BATCH) {
    return res.status(400).json({ message: `Quá số lượng file cho phép (${MAX_BATCH})` });
  }

  const norm = [];
  const pushWithMeta = (f) => {
    if (!f) return;
    if (f._meta) {
      const { rel, url, y, m, d, ext } = f._meta;
      f.relPath = rel; f.url = url; f.year = y; f.month = m; f.day = d; f.ext = ext;
      f.originalnameUtf8 = f._originalnameUtf8 || f.originalname;
    }
    norm.push(f);
  };

  filesArr.forEach(pushWithMeta);

  req.filesNormalized = norm;
  next();
}

/** Gắn meta cho single upload (replace) */
function attachMetaSingle(req, res, next) {
  if (req.file && req.file._meta) {
    const { rel, url, y, m, d, ext } = req.file._meta;
    req.file.relPath = rel; req.file.url = url; req.file.year = y; req.file.month = m; req.file.day = d; req.file.ext = ext;
    req.file.originalnameUtf8 = req.file._originalnameUtf8 || req.file.originalname;
  }
  next();
}

/* ---------- ROUTES ---------- */

// INFO: cho FE biết limits theo bucket (đặt TRƯỚC :id để không bị nuốt)
router.get("/_info/limits/:bucket", (req, res) => {
  try {
    const { bucket } = req.params;
    assertBucket(bucket);
    res.json({ bucket, maxBytes: LIMITS_BY_BUCKET[bucket] });
  } catch (e) {
    res.status(e.status || 400).json({ message: e.message });
  }
});

// PUBLIC: list + detail
router.get("/", authOptional, ctrl.list);
router.get("/:id", authOptional, ctrl.getOne);

// USER/ADMIN: upload nhiều (hoặc 1) file — áp limit theo bucket
router.post("/:bucket", auth, uploadMultiForBucket, attachMetaMany, ctrl.createMany);

// ADMIN: sửa meta
router.patch("/:id", auth, requireRole("admin"), ctrl.updateMeta);

// ADMIN: thay 1 file — áp limit theo bucket (chuẩn REST -> PUT)
router.put("/:id/:bucket", auth, requireRole("admin"), uploadSingleForBucket, attachMetaSingle, ctrl.replace);

// (TÙY CHỌN) Alias cho ai lỡ gọi POST thay vì PUT khi replace — tránh 404
router.post("/:id/:bucket", auth, requireRole("admin"), uploadSingleForBucket, attachMetaSingle, ctrl.replace);

// ADMIN: xoá
router.delete("/:id", auth, requireRole("admin"), ctrl.remove);

module.exports = router;
