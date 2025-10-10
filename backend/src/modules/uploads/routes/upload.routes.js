// /**
//  * Upload Routes (Express)
//  * -----------------------------------------
//  * Chức năng:
//  *  - Nhận multipart upload (1 hoặc nhiều file).
//  *  - Lưu file lên disk (diskStorage) và gắn meta vào req.file(s).
//  *  - Chặn MIME theo bucket + giới hạn dung lượng theo bucket (hậu kiểm).
//  *
//  * Lưu ý:
//  *  - Dùng `.any()` để không bị "LIMIT_UNEXPECTED_FILE" bởi tên field khác nhau.
//  *  - KHÔNG dùng limits.fileSize của Multer để tránh fail cả lô.
//  *  - `fileFilter`: MIME sai => bỏ qua (không ném lỗi), ghi vào req._rejectedFiles.
//  *  - `attachMetaMany`: hậu kiểm kích thước; file quá limit => xóa file + đưa vào rejected.
//  *  - `req.filesNormalized` chứa các file hợp lệ để controller xử lý.
//  */

// const router = require("express").Router();
// const multer = require("multer");
// const path = require("path");
// const auth = require("../../../middlewares/auth");
// const { requireRole, authOptional } = require("../../../middlewares/auth");
// const { buildPath, normalizeOriginalName } = require("../services/storage.service");
// const { assertBucket, allowMime } = require("../validators/upload.validator");
// const ctrl = require("../controllers/upload.controller");

// // ===== Dung lượng theo bucket (per-file) =====
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

// /**
//  * fileFilter: kiểm tra MIME theo bucket
//  * - Nếu không hợp lệ: KHÔNG ném lỗi → cb(null,false) để bỏ qua file.
//  * - Ghi lại danh sách file bị bỏ qua vào req._rejectedFiles để controller trả về FE.
//  */
// function fileFilter(req, file, cb) {
//   try {
//     const bucket = req.params.bucket || req.body.bucket;
//     assertBucket(bucket);
//     if (!allowMime(bucket, file.mimetype)) {
//       // ghi rejected (mime)
//       req._rejectedFiles = req._rejectedFiles || [];
//       req._rejectedFiles.push({
//         originalName: normalizeOriginalName(file.originalname),
//         reason: "disallowed_mime",
//         mimetype: file.mimetype,
//       });
//       return cb(null, false); // bỏ qua file, KHÔNG lỗi
//     }
//     cb(null, true);
//   } catch (e) { cb(e, false); }
// }

// /** Tạo uploader: KHÔNG set limits.fileSize để không fail cả lô */
// function makeUploader() {
//   return multer({ storage, fileFilter }); // <== bỏ limits.fileSize
// }

// /**
//  * Upload nhiều file theo bucket
//  * - Dùng .any() để chấp nhận mọi tên field (file, files, files[], files[0]...) → tránh MulterError
//  * - Giới hạn số lượng file/batch trong attachMetaMany (an toàn)
//  */
// function uploadMultiForBucket(req, res, next) {
//   try {
//     const bucket = req.params.bucket || req.body.bucket;
//     assertBucket(bucket);
//     const uploader = makeUploader().any();
//     uploader(req, res, (err) => (err ? next(err) : next()));
//   } catch (e) { next(e); }
// }

// /** Upload 1 file theo bucket (áp dụng cho replace) */
// function uploadSingleForBucket(req, res, next) {
//   try {
//     const bucket = req.params.bucket || req.body.bucket;
//     assertBucket(bucket);
//     const uploader = makeUploader().single("file");
//     uploader(req, res, (err) => (err ? next(err) : next()));
//   } catch (e) { next(e); }
// }

// /**
//  * Chuẩn hóa req.filesNormalized từ req.files (dùng .any())
//  * - Hậu kiểm kích thước theo LIMITS_BY_BUCKET[bucket]
//  * - File oversize → xóa file vật lý + đưa vào req._rejectedFiles
//  * - Giới hạn batch tối đa 40 file
//  */
// const fs = require("fs/promises");
// const pathJoinRoot = (rel) => path.join(__dirname, "..", "..", "..", rel);

// async function deleteIfExists(absPath) {
//   try { await fs.unlink(absPath); } catch (_) {}
// }

// async function attachMetaMany(req, res, next) {
//   try {
//     const bucket = req.params.bucket || req.body.bucket;
//     assertBucket(bucket);
//     const limitBytes = LIMITS_BY_BUCKET[bucket];

//     const filesArr = Array.isArray(req.files)
//       ? req.files
//       : (req.files && typeof req.files === "object"
//           ? Object.values(req.files).flat()
//           : []);

//     const MAX_BATCH = 40;
//     if (filesArr.length > MAX_BATCH) {
//       return res.status(400).json({ message: `Quá số lượng file cho phép (${MAX_BATCH})` });
//     }

//     req._rejectedFiles = req._rejectedFiles || [];
//     const norm = [];

//     for (const f of filesArr) {
//       if (!f) continue;

//       // gắn meta từ _meta
//       if (f._meta) {
//         const { rel, url, y, m, d, ext, abs } = f._meta;
//         f.relPath = rel; f.url = url; f.year = y; f.month = m; f.day = d; f.ext = ext;
//         f.absPath = abs; // để tiện xóa nếu oversize
//         f.originalnameUtf8 = f._originalnameUtf8 || f.originalname;
//       }

//       // Hậu kiểm kích thước (per-file)
//       if (typeof f.size === "number" && f.size > limitBytes) {
//         // xóa file vật lý + ghi rejected
//         if (f.absPath) await deleteIfExists(f.absPath);
//         req._rejectedFiles.push({
//           originalName: f.originalnameUtf8 || f.originalname,
//           reason: "oversize",
//           size: f.size,
//           maxBytes: limitBytes,
//         });
//         continue; // bỏ qua file này
//       }

//       norm.push(f);
//     }

//     req.filesNormalized = norm;
//     next();
//   } catch (e) {
//     next(e);
//   }
// }

// /** Gắn meta cho single upload (replace) */
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

// // USER/ADMIN: upload nhiều file — hậu kiểm kích thước theo bucket
// router.post("/:bucket", auth, uploadMultiForBucket, attachMetaMany, ctrl.createMany);

// // ADMIN: sửa meta
// router.patch("/:id", auth, requireRole("admin"), ctrl.updateMeta);

// // ADMIN: thay 1 file
// router.put("/:id/:bucket", auth, requireRole("admin"), uploadSingleForBucket, attachMetaSingle, ctrl.replace);

// // Alias POST cho replace (tránh 404)
// router.post("/:id/:bucket", auth, requireRole("admin"), uploadSingleForBucket, attachMetaSingle, ctrl.replace);

// // ADMIN: xoá
// router.delete("/:id", auth, requireRole("admin"), ctrl.remove);

// module.exports = router;


/** backend/src/modules/uploads/routes/upload.routes.js
 * Upload Routes (Express)
 * - Nhận multipart 1 hoặc nhiều file (.any()).
 * - Lưu disk + gắn meta; hậu kiểm kích thước; chặn MIME theo bucket.
 * - Public: list/detail; User/Admin: upload; Admin: sửa/thay/xoá.
 */
const router = require("express").Router();
const multer = require("multer");
const path = require("path");

// ✅ CHỈ DÙNG DESTRUCTURING, KHÔNG require default:
const { auth, requireRole, authOptional } = require("../../../middlewares/auth");

const { buildPath, normalizeOriginalName } = require("../services/storage.service");
const { assertBucket, allowMime } = require("../validators/upload.validator");
const ctrl = require("../controllers/upload.controller");

// ===== Dung lượng theo bucket (per-file) =====
const SIZE = { MB: 1024 * 1024, GB: 1024 * 1024 * 1024 };
const LIMITS_BY_BUCKET = {
  images: 5 * SIZE.MB,
  videos: 8 * SIZE.GB,
  audios: 500 * SIZE.MB,
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
    } catch (e) {
      cb(e);
    }
  },
  filename: async (req, file, cb) => {
    try {
      const bucket = req.params.bucket || req.body.bucket;
      assertBucket(bucket);

      const originalUtf8 = normalizeOriginalName(file.originalname);
      const meta = await buildPath(bucket, originalUtf8);

      file._meta = meta;
      file._originalnameUtf8 = originalUtf8;

      cb(null, path.basename(meta.abs));
    } catch (e) {
      cb(e);
    }
  },
});

/** MIME filter: không hợp lệ → cb(null,false) + ghi vào req._rejectedFiles */
function fileFilter(req, file, cb) {
  try {
    const bucket = req.params.bucket || req.body.bucket;
    assertBucket(bucket);
    if (!allowMime(bucket, file.mimetype)) {
      req._rejectedFiles = req._rejectedFiles || [];
      req._rejectedFiles.push({
        originalName: normalizeOriginalName(file.originalname),
        reason: "disallowed_mime",
        mimetype: file.mimetype,
      });
      return cb(null, false);
    }
    cb(null, true);
  } catch (e) {
    cb(e, false);
  }
}

/** KHÔNG set limits.fileSize để không fail cả lô; hậu kiểm sau */
function makeUploader() {
  return multer({ storage, fileFilter });
}

/** Upload nhiều file: dùng .any() để chấp nhận mọi tên field */
function uploadMultiForBucket(req, res, next) {
  try {
    const bucket = req.params.bucket || req.body.bucket;
    assertBucket(bucket);
    const uploader = makeUploader().any();
    uploader(req, res, (err) => (err ? next(err) : next()));
  } catch (e) {
    next(e);
  }
}

/** Upload 1 file (replace) */
function uploadSingleForBucket(req, res, next) {
  try {
    const bucket = req.params.bucket || req.body.bucket;
    assertBucket(bucket);
    const uploader = makeUploader().single("file");
    uploader(req, res, (err) => (err ? next(err) : next()));
  } catch (e) {
    next(e);
  }
}

// ===== Hậu kiểm kích thước + chuẩn hoá filesNormalized =====
const fs = require("fs/promises");

async function deleteIfExists(absPath) {
  try {
    await fs.unlink(absPath);
  } catch (_) {}
}

async function attachMetaMany(req, res, next) {
  try {
    const bucket = req.params.bucket || req.body.bucket;
    assertBucket(bucket);
    const limitBytes = LIMITS_BY_BUCKET[bucket];

    const filesArr = Array.isArray(req.files)
      ? req.files
      : req.files && typeof req.files === "object"
      ? Object.values(req.files).flat()
      : [];

    const MAX_BATCH = 40;
    if (filesArr.length > MAX_BATCH) {
      return res
        .status(400)
        .json({ message: `Quá số lượng file cho phép (${MAX_BATCH})` });
    }

    req._rejectedFiles = req._rejectedFiles || [];
    const norm = [];

    for (const f of filesArr) {
      if (!f) continue;

      if (f._meta) {
        const { rel, url, y, m, d, ext, abs } = f._meta;
        f.relPath = rel;
        f.url = url;
        f.year = y;
        f.month = m;
        f.day = d;
        f.ext = ext;
        f.absPath = abs;
        f.originalnameUtf8 = f._originalnameUtf8 || f.originalname;
      }

      if (typeof f.size === "number" && f.size > limitBytes) {
        if (f.absPath) await deleteIfExists(f.absPath);
        req._rejectedFiles.push({
          originalName: f.originalnameUtf8 || f.originalname,
          reason: "oversize",
          size: f.size,
          maxBytes: limitBytes,
        });
        continue;
      }

      norm.push(f);
    }

    req.filesNormalized = norm;
    next();
  } catch (e) {
    next(e);
  }
}

/** Gắn meta cho single upload (replace) */
function attachMetaSingle(req, res, next) {
  if (req.file && req.file._meta) {
    const { rel, url, y, m, d, ext } = req.file._meta;
    req.file.relPath = rel;
    req.file.url = url;
    req.file.year = y;
    req.file.month = m;
    req.file.day = d;
    req.file.ext = ext;
    req.file.originalnameUtf8 =
      req.file._originalnameUtf8 || req.file.originalname;
  }
  next();
}

/* ---------- ROUTES ---------- */

// INFO limits (đặt trước :id)
router.get("/_info/limits/:bucket", (req, res) => {
  try {
    const { bucket } = req.params;
    assertBucket(bucket);
    res.json({ bucket, maxBytes: LIMITS_BY_BUCKET[bucket] });
  } catch (e) {
    res.status(e.status || 400).json({ message: e.message });
  }
});

// PUBLIC
router.get("/", authOptional, ctrl.list);
router.get("/:id", authOptional, ctrl.getOne);

// USER/ADMIN: upload nhiều file
router.post(
  "/:bucket",
  auth,
  uploadMultiForBucket,
  attachMetaMany,
  ctrl.createMany
);

// ADMIN: sửa meta
router.patch("/:id", auth, requireRole("admin"), ctrl.updateMeta);

// ADMIN: thay 1 file (PUT hoặc alias POST)
router.put(
  "/:id/:bucket",
  auth,
  requireRole("admin"),
  uploadSingleForBucket,
  attachMetaSingle,
  ctrl.replace
);
router.post(
  "/:id/:bucket",
  auth,
  requireRole("admin"),
  uploadSingleForBucket,
  attachMetaSingle,
  ctrl.replace
);

// ADMIN: xoá
router.delete("/:id", auth, requireRole("admin"), ctrl.remove);

module.exports = router;
