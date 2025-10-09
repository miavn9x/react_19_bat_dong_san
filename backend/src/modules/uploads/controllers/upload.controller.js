
// // backend/src/modules/uploads/controllers/upload.controller.js

// const path = require("path");
// const fs = require("fs/promises");
// const File = require("../models/file.model");

// const relToAbs = (rel) => path.join(__dirname, "..", "..", "..", rel);

// /** Helper: ép số an toàn */
// function toNum(v, def = 0) {
//   const n = Number(v);
//   return Number.isFinite(n) ? n : def;
// }

// /**
//  * POST /uploads/:bucket
//  * - Yêu cầu: user đã đăng nhập (JWT)
//  * - Cho phép: 1 hoặc nhiều file (fields: "file" hoặc "files[]")
//  * - Body tùy chọn:
//  *    - group: chuỗi định danh nhóm (vd: "post:6612...", "product:66af...")
//  *    - startOrder: số bắt đầu (vd: 0), server sẽ + index của file
//  *    - orders: chuỗi CSV/tham số lặp lại (vd: "0,10,20") để chỉ định order từng file
//  *    - label: áp dụng nếu chỉ 1 file; với multiple có thể dùng "labels" CSV (tùy chọn)
//  */
// exports.createMany = async (req, res, next) => {
//   try {
//     if (!req.userId) return res.status(401).json({ message: "Unauthenticated" });

//     const files = req.filesNormalized || []; // set bởi normalize middleware
//     if (!files.length) return res.status(400).json({ message: "Thiếu file" });

//     const group = (req.body.group || "").trim();
//     const startOrder = toNum(req.body.startOrder, 0);

//     // parse orders: chấp nhận "orders" như CSV hoặc mảng string
//     let orders = [];
//     if (typeof req.body.orders === "string") {
//       orders = req.body.orders.split(",").map((s) => toNum(s.trim()));
//     } else if (Array.isArray(req.body.orders)) {
//       orders = req.body.orders.map((s) => toNum(s));
//     }

//     // labels cho mỗi file (tùy chọn)
//     let labels = [];
//     if (typeof req.body.labels === "string") {
//       labels = req.body.labels.split(",");
//     } else if (Array.isArray(req.body.labels)) {
//       labels = req.body.labels;
//     }

//     // Nếu upload 1 file & có label chung thì dùng label
//     const singleLabel = (files.length === 1 && typeof req.body.label === "string")
//       ? req.body.label
//       : "";

//     // Tạo documents hàng loạt theo thứ tự input → giảm lag & giữ ổn định
//     const docs = files.map((f, idx) => {
//       const ord = orders[idx] ?? (startOrder + idx);
//       const lbl = labels[idx] ?? singleLabel ?? "";
//       return {
//         owner: req.userId,
//         bucket: req.params.bucket,
//         type: f.mimetype,
//         ext: f.ext,
//         originalName: f.originalname,
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
//     // Trả về theo thứ tự đã insert (giữ input order)
//     return res.status(201).json({ count: inserted.length, items: inserted });
//   } catch (e) {
//     next(e);
//   }
// };

// // GET /uploads?bucket=&group=&year=&month=&day=&q=&page=&limit= (PUBLIC)
// exports.list = async (req, res, next) => {
//   try {
//     const { bucket, group, year, month, day, q, page = 1, limit = 20, sort = "createdAt_desc" } = req.query;
//     const filter = {};
//     if (bucket) filter.bucket = bucket;
//     if (group) filter.group = group;
//     if (year)  filter.year  = Number(year);
//     if (month) filter.month = Number(month);
//     if (day)   filter.day   = Number(day);
//     if (q)     filter.originalName = { $regex: q, $options: "i" };

//     // Sắp xếp:
//     // - group view: ưu tiên theo order ASC rồi createdAt ASC
//     // - mặc định: createdAt DESC
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

//     const skip = (Number(page) - 1) * Number(limit);
//     const [items, total] = await Promise.all([
//       File.find(filter).sort(sortOpt).skip(skip).limit(Number(limit)),
//       File.countDocuments(filter),
//     ]);

//     res.json({ total, page: Number(page), limit: Number(limit), items });
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
//     old.originalName = f.originalname;
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
// backend/src/modules/uploads/controllers/upload.controller.js
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
 * - Cho phép: 1 hoặc nhiều file (fields: "file" hoặc "files[]")
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

// GET /uploads?bucket=&group=&year=&month=&day=&q=&page=&limit= (PUBLIC)
exports.list = async (req, res, next) => {
  try {
    const { bucket, group, year, month, day, q, page = 1, limit = 20, sort = "createdAt_desc" } = req.query;
    const filter = {};
    if (bucket) filter.bucket = bucket;
    if (group) filter.group = group;
    if (year)  filter.year  = Number(year);
    if (month) filter.month = Number(month);
    if (day)   filter.day   = Number(day);
    if (q)     filter.originalName = { $regex: q, $options: "i" };

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

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      File.find(filter).sort(sortOpt).skip(skip).limit(Number(limit)),
      File.countDocuments(filter),
    ]);

    res.json({ total, page: Number(page), limit: Number(limit), items });
  } catch (e) {
    next(e);
  }
};

// GET /uploads/:id (PUBLIC)
exports.getOne = async (req, res, next) => {
  try {
    const doc = await File.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Không tìm thấy" });
    res.json(doc);
  } catch (e) {
    next(e);
  }
};

// PATCH /uploads/:id (ADMIN) — cập nhật nhãn, group, order
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

// PUT /uploads/:id/:bucket (ADMIN) — thay file vật lý, giữ group/order
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

// DELETE /uploads/:id (ADMIN)
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
