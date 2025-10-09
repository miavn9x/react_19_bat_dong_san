// // backend/src/modules/uploads/controllers/upload.controller.js
// /**
//  * Upload controller:
//  * 
//  */
// const path = require("path");
// const fs = require("fs/promises");
// const File = require("../models/file.model");

// const relToAbs = (rel) => path.join(__dirname, "..", "..", "..", rel);

// /** Helper: ép số an toàn */
// function toNum(v, def = 0) {
//   const n = Number(v);
//   return Number.isFinite(n) ? n : def;
// }


// exports.createMany = async (req, res, next) => {
//   try {
//     if (!req.userId) return res.status(401).json({ message: "Unauthenticated" });

//     const files = req.filesNormalized || [];
//     if (!files.length) return res.status(400).json({ message: "Thiếu file" });

//     const group = (req.body.group || "").trim();
//     const startOrder = toNum(req.body.startOrder, 0);

//     let orders = [];
//     if (typeof req.body.orders === "string") {
//       orders = req.body.orders.split(",").map((s) => toNum(s.trim()));
//     } else if (Array.isArray(req.body.orders)) {
//       orders = req.body.orders.map((s) => toNum(s));
//     }

//     let labels = [];
//     if (typeof req.body.labels === "string") {
//       labels = req.body.labels.split(",");
//     } else if (Array.isArray(req.body.labels)) {
//       labels = req.body.labels;
//     }

//     const singleLabel =
//       files.length === 1 && typeof req.body.label === "string" ? req.body.label : "";

//     const docs = files.map((f, idx) => {
//       const ord = orders[idx] ?? (startOrder + idx);
//       const lbl = labels[idx] ?? singleLabel ?? "";
//       return {
//         owner: req.userId,
//         bucket: req.params.bucket,
//         type: f.mimetype,
//         ext: f.ext,
//         originalName: f.originalnameUtf8 || f.originalname, // <-- tên gốc đã decode
//         size: f.size,
//         relPath: f.relPath,
//         url: f.url,
//         year: f.year,
//         month: f.month,
//         day: f.day,
//         label: lbl,
//         group,
//         order: ord,
//       };
//     });

//     const inserted = await File.insertMany(docs, { ordered: true });
//     return res.status(201).json({ count: inserted.length, items: inserted });
//   } catch (e) {
//     next(e);
//   }
// };

// /**
//  * GET /uploads?bucket=&group=&year=&month=&day=&q=&page=&limit=&sort=
//  * (PUBLIC + ADMIN dùng chung)
//  * - Ép cứng: tối đa 20 item / trang
//  */
// exports.list = async (req, res, next) => {
//   try {
//     const {
//       bucket,
//       group,
//       year,
//       month,
//       day,
//       q,
//       page = 1,
//       limit = 20,               // default 20
//       sort = "createdAt_desc",
//     } = req.query;

//     // --- Sanitize page/limit ---
//     const RAW_PAGE = Number(page);
//     const RAW_LIMIT = Number(limit);
//     const SAFE_PAGE = Math.max(1, Number.isFinite(RAW_PAGE) ? RAW_PAGE : 1);
//     const SAFE_LIMIT = Math.max(1, Math.min(20, Number.isFinite(RAW_LIMIT) ? RAW_LIMIT : 20)); // <= ép cứng 20

//     const filter = {};
//     if (bucket) filter.bucket = bucket;
//     if (group) filter.group = group;
//     if (year)  filter.year  = Number(year);
//     if (month) filter.month = Number(month);
//     if (day)   filter.day   = Number(day);
//     if (q)     filter.originalName = { $regex: q, $options: "i" };

//     let sortOpt = { createdAt: -1 };
//     if (group) {
//       sortOpt = { order: 1, createdAt: 1 };
//     } else if (sort === "createdAt_asc") {
//       sortOpt = { createdAt: 1 };
//     } else if (sort === "order_asc") {
//       sortOpt = { order: 1, createdAt: 1 };
//     } else if (sort === "order_desc") {
//       sortOpt = { order: -1, createdAt: -1 };
//     }

//     const skip = (SAFE_PAGE - 1) * SAFE_LIMIT;
//     const [items, total] = await Promise.all([
//       File.find(filter).sort(sortOpt).skip(skip).limit(SAFE_LIMIT),
//       File.countDocuments(filter),
//     ]);

//     res.json({ total, page: SAFE_PAGE, limit: SAFE_LIMIT, items });
//   } catch (e) {
//     next(e);
//   }
// };

// // GET /uploads/:id (PUBLIC)
// exports.getOne = async (req, res, next) => {
//   try {
//     const doc = await File.findById(req.params.id);
//     if (!doc) return res.status(404).json({ message: "Không tìm thấy" });
//     res.json(doc);
//   } catch (e) {
//     next(e);
//   }
// };

// // PATCH /uploads/:id (ADMIN) — cập nhật nhãn, group, order
// exports.updateMeta = async (req, res, next) => {
//   try {
//     const patch = {};
//     if (typeof req.body.label === "string") patch.label = req.body.label;
//     if (typeof req.body.group === "string") patch.group = req.body.group;
//     if (req.body.order !== undefined) patch.order = toNum(req.body.order);

//     const doc = await File.findByIdAndUpdate(req.params.id, patch, { new: true });
//     if (!doc) return res.status(404).json({ message: "Không tìm thấy" });
//     res.json(doc);
//   } catch (e) {
//     next(e);
//   }
// };

// // PUT /uploads/:id/:bucket (ADMIN) — thay file vật lý, giữ group/order
// exports.replace = async (req, res, next) => {
//   try {
//     const old = await File.findById(req.params.id);
//     if (!old) return res.status(404).json({ message: "Không tìm thấy" });
//     if (!req.file) return res.status(400).json({ message: "Thiếu file mới" });

//     try { await fs.unlink(relToAbs(old.relPath)); } catch (_) {}

//     const f = req.file;
//     old.bucket = req.params.bucket;
//     old.type = f.mimetype;
//     old.ext = f.ext;
//     old.originalName = f.originalnameUtf8 || f.originalname; // <-- tên gốc đã decode
//     old.size = f.size;
//     old.relPath = f.relPath;
//     old.url = f.url;
//     old.year = f.year;
//     old.month = f.month;
//     old.day = f.day;

//     await old.save();
//     res.json(old);
//   } catch (e) {
//     next(e);
//   }
// };

// // DELETE /uploads/:id (ADMIN)
// exports.remove = async (req, res, next) => {
//   try {
//     const doc = await File.findByIdAndDelete(req.params.id);
//     if (!doc) return res.status(404).json({ message: "Không tìm thấy" });
//     try { await fs.unlink(relToAbs(doc.relPath)); } catch (_) {}
//     res.json({ ok: true });
//   } catch (e) {
//     next(e);
//   }
// };




/**
 * Upload Controller
 * -----------------------------------------
 * Chức năng:
 *  - Tạo bản ghi metadata cho file đã upload (createMany).
 *  - Liệt kê upload (list) với paging & sort.
 *  - Lấy chi tiết (getOne), sửa meta (updateMeta),
 *    thay file vật lý (replace), xóa (remove).
 *
 * Lưu ý:
 *  - Nguyên lý hiện tại dùng `group` để gom file theo thực thể (post/product...).
 *  - Server ép cứng limit ≤ 20 cho endpoint list.
 *  - Controller sử dụng `req.filesNormalized` do middleware gắn sẵn.
 */

const path = require("path");
const fs = require("fs/promises");
const File = require("../models/file.model");

const relToAbs = (rel) => path.join(__dirname, "..", "..", "..", rel);

/** Helper: ép số an toàn */
function toNum(v, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

/**
 * POST /uploads/:bucket
 * - Yêu cầu: user đã đăng nhập (JWT)
 * - Cho phép: 1 hoặc nhiều file (fields: "file"/"files"/"files[]"...)
 * - Body: group, startOrder, orders, label/labels...
 */
exports.createMany = async (req, res, next) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthenticated" });

    const files = req.filesNormalized || [];
    if (!files.length) return res.status(400).json({ message: "Thiếu file" });

    const group = (req.body.group || "").trim();
    const startOrder = toNum(req.body.startOrder, 0);

    let orders = [];
    if (typeof req.body.orders === "string") {
      orders = req.body.orders.split(",").map((s) => toNum(s.trim()));
    } else if (Array.isArray(req.body.orders)) {
      orders = req.body.orders.map((s) => toNum(s));
    }

    let labels = [];
    if (typeof req.body.labels === "string") {
      labels = req.body.labels.split(",");
    } else if (Array.isArray(req.body.labels)) {
      labels = req.body.labels;
    }

    const singleLabel =
      files.length === 1 && typeof req.body.label === "string" ? req.body.label : "";

    const docs = files.map((f, idx) => {
      const ord = orders[idx] ?? (startOrder + idx);
      const lbl = labels[idx] ?? singleLabel ?? "";
      return {
        owner: req.userId,
        bucket: req.params.bucket,
        type: f.mimetype,
        ext: f.ext,
        originalName: f.originalnameUtf8 || f.originalname, // <-- tên gốc đã decode
        size: f.size,
        relPath: f.relPath,
        url: f.url,
        year: f.year,
        month: f.month,
        day: f.day,
        label: lbl,
        group,
        order: ord,
      };
    });

    const inserted = await File.insertMany(docs, { ordered: true });
    return res.status(201).json({ count: inserted.length, items: inserted });
  } catch (e) {
    next(e);
  }
};

/**
 * GET /uploads?bucket=&group=&year=&month=&day=&q=&page=&limit=&sort=
 * (PUBLIC + ADMIN dùng chung)
 * - Ép cứng: tối đa 20 item / trang
 * - Sort mặc định: mới nhất; nếu có group, ưu tiên order.
 */
exports.list = async (req, res, next) => {
  try {
    const {
      bucket,
      group,
      year,
      month,
      day,
      q,
      page = 1,
      limit = 20,               // default 20
      sort = "createdAt_desc",
    } = req.query;

    // --- Sanitize page/limit ---
    const RAW_PAGE = Number(page);
    const RAW_LIMIT = Number(limit);
    const SAFE_PAGE = Math.max(1, Number.isFinite(RAW_PAGE) ? RAW_PAGE : 1);
    const SAFE_LIMIT = Math.max(1, Math.min(20, Number.isFinite(RAW_LIMIT) ? RAW_LIMIT : 20)); // <= ép cứng 20

    // --- Filter ---
    const filter = {};
    if (bucket) filter.bucket = bucket;
    if (group) filter.group = group;
    if (year)  filter.year  = Number(year);
    if (month) filter.month = Number(month);
    if (day)   filter.day   = Number(day);
    if (q)     filter.originalName = { $regex: q, $options: "i" };

    // --- Sort ---
    let sortOpt = { createdAt: -1 };
    if (group) {
      sortOpt = { order: 1, createdAt: 1 };
    } else if (sort === "createdAt_asc") {
      sortOpt = { createdAt: 1 };
    } else if (sort === "order_asc") {
      sortOpt = { order: 1, createdAt: 1 };
    } else if (sort === "order_desc") {
      sortOpt = { order: -1, createdAt: -1 };
    }

    const skip = (SAFE_PAGE - 1) * SAFE_LIMIT;
    const [items, total] = await Promise.all([
      File.find(filter).sort(sortOpt).skip(skip).limit(SAFE_LIMIT),
      File.countDocuments(filter),
    ]);

    res.json({ total, page: SAFE_PAGE, limit: SAFE_LIMIT, items });
  } catch (e) {
    next(e);
  }
};

/**
 * GET /uploads/:id
 * - Trả về chi tiết 1 bản ghi upload theo _id
 */
exports.getOne = async (req, res, next) => {
  try {
    const doc = await File.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Không tìm thấy" });
    res.json(doc);
  } catch (e) {
    next(e);
  }
};

/**
 * PATCH /uploads/:id
 * - ADMIN
 * - Cập nhật metadata: label, group, order
 */
exports.updateMeta = async (req, res, next) => {
  try {
    const patch = {};
    if (typeof req.body.label === "string") patch.label = req.body.label;
    if (typeof req.body.group === "string") patch.group = req.body.group;
    if (req.body.order !== undefined) patch.order = toNum(req.body.order);

    const doc = await File.findByIdAndUpdate(req.params.id, patch, { new: true });
    if (!doc) return res.status(404).json({ message: "Không tìm thấy" });
    res.json(doc);
  } catch (e) {
    next(e);
  }
};

/**
 * PUT /uploads/:id/:bucket
 * - ADMIN
 * - Thay file vật lý, giữ group/order
 */
exports.replace = async (req, res, next) => {
  try {
    const old = await File.findById(req.params.id);
    if (!old) return res.status(404).json({ message: "Không tìm thấy" });
    if (!req.file) return res.status(400).json({ message: "Thiếu file mới" });

    try { await fs.unlink(relToAbs(old.relPath)); } catch (_) {}

    const f = req.file;
    old.bucket = req.params.bucket;
    old.type = f.mimetype;
    old.ext = f.ext;
    old.originalName = f.originalnameUtf8 || f.originalname; // <-- tên gốc đã decode
    old.size = f.size;
    old.relPath = f.relPath;
    old.url = f.url;
    old.year = f.year;
    old.month = f.month;
    old.day = f.day;

    await old.save();
    res.json(old);
  } catch (e) {
    next(e);
  }
};

/**
 * DELETE /uploads/:id
 * - ADMIN
 * - Xóa record + xóa file vật lý nếu có
 */
exports.remove = async (req, res, next) => {
  try {
    const doc = await File.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: "Không tìm thấy" });
    try { await fs.unlink(relToAbs(doc.relPath)); } catch (_) {}
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
};
