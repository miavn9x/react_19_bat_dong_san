
/** Upload Routes (Express, VI + log)
 * - Nhận multipart 1 hoặc nhiều file (.any()).
 * - Lưu disk + gắn meta; hậu kiểm kích thước; chặn MIME theo bucket.
 * - Public: list/detail; User/Admin: upload; Admin: sửa/thay/xoá.
 */
const router = require("express").Router();
const multer = require("multer");
const path = require("path");

// ✅ CHỈ dùng destructuring:
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
    } catch (e) { cb(e); }
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
    } catch (e) { cb(e); }
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

/** Upload nhiều file: .any() để chấp nhận mọi tên field */
function uploadMultiForBucket(req, res, next) {
  try {
    const bucket = req.params.bucket || req.body.bucket;
    assertBucket(bucket);
    const uploader = makeUploader().any();
    uploader(req, res, (err) => (err ? next(err) : next()));
  } catch (e) { next(e); }
}

/** Upload 1 file (replace) */
function uploadSingleForBucket(req, res, next) {
  try {
    const bucket = req.params.bucket || req.body.bucket;
    assertBucket(bucket);
    const uploader = makeUploader().single("file");
    uploader(req, res, (err) => (err ? next(err) : next()));
  } catch (e) { next(e); }
}

// ===== Hậu kiểm kích thước + chuẩn hoá filesNormalized =====
const fs = require("fs/promises");

async function deleteIfExists(absPath) {
  try { await fs.unlink(absPath); } catch (_) {}
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
      return res.status(400).json({ message: `Quá số lượng file cho phép (${MAX_BATCH})` });
    }

    req._rejectedFiles = req._rejectedFiles || [];
    const norm = [];

    for (const f of filesArr) {
      if (!f) continue;

      if (f._meta) {
        const { rel, url, y, m, d, ext, abs } = f._meta;
        f.relPath = rel; f.url = url; f.year = y; f.month = m; f.day = d;
        f.ext = ext; f.absPath = abs;
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
    req.file.relPath = rel; req.file.url = url; req.file.year = y; req.file.month = m; req.file.day = d;
    req.file.ext = ext;
    req.file.originalnameUtf8 = req.file._originalnameUtf8 || req.file.originalname;
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
    res.status(e.status || 400).json({ message: e.message || "Bucket không hợp lệ" });
  }
});

// PUBLIC
router.get("/", authOptional, ctrl.list);
router.get("/:id", authOptional, ctrl.getOne);

// USER/ADMIN: upload nhiều file
router.post("/:bucket", auth, uploadMultiForBucket, attachMetaMany, ctrl.createMany);

// ADMIN: sửa meta
router.patch("/:id", auth, requireRole("admin"), ctrl.updateMeta);

// ADMIN: thay 1 file (PUT hoặc alias POST)
router.put("/:id/:bucket", auth, requireRole("admin"), uploadSingleForBucket, attachMetaSingle, ctrl.replace);
router.post("/:id/:bucket", auth, requireRole("admin"), uploadSingleForBucket, attachMetaSingle, ctrl.replace);

// ADMIN: xoá
router.delete("/:id", auth, requireRole("admin"), ctrl.remove);

module.exports = router;
