// backend/src/modules/uploads/routes/upload.routes.js
const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const auth = require("../../../middlewares/auth");
const { requireRole } = require("../../../middlewares/auth");

const { buildPath } = require("../services/storage.service");
const { assertBucket, allowMime } = require("../validators/upload.validator");
const ctrl = require("../controllers/upload.controller");

// Storage
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
      const meta = await buildPath(bucket, file.originalname);
      file._meta = meta; // đính kèm để controller dùng
      cb(null, path.basename(meta.abs));
    } catch (e) { cb(e); }
  }
});

// MIME filter theo bucket
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

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
});

// Đẩy meta đã build vào req.file
function attachMeta(req, res, next) {
  if (req.file && req.file._meta) {
    const { rel, url, y, m, d, ext } = req.file._meta;
    req.file.relPath = rel;
    req.file.url = url;
    req.file.year = y;
    req.file.month = m;
    req.file.day = d;
    req.file.ext = ext;
  }
  next();
}

/* ----------- ROUTES (với phân quyền) ----------- */

// USER (đã đăng nhập) được phép upload
router.post("/:bucket",
  auth,                      // yêu cầu JWT, role nào cũng được
  upload.single("file"),
  attachMeta,
  ctrl.create
);

// LIST: user & admin đều xem được toàn bộ metadata
router.get("/",
  auth,                      // chỉ cần đăng nhập
  ctrl.list
);

// DETAIL: user & admin đều xem metadata của bất kỳ file
router.get("/:id",
  auth,                      // chỉ cần đăng nhập
  ctrl.getOne
);

// ADMIN-only: cập nhật metadata (nhãn)
router.patch("/:id",
  auth, requireRole("admin"),
  ctrl.updateMeta
);

// ADMIN-only: thay file
router.put("/:id/:bucket",
  auth, requireRole("admin"),
  upload.single("file"),
  attachMeta,
  ctrl.replace
);

// ADMIN-only: xoá file
router.delete("/:id",
  auth, requireRole("admin"),
  ctrl.remove
);

module.exports = router;
