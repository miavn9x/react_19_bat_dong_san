
/**
 * Upload Controller (VI + log)
 * -----------------------------------------
 * - Tạo metadata cho file đã upload (createMany).
 * - Liệt kê (list) với paging/sort (ép limit ≤ 20).
 * - Chi tiết (getOne), sửa meta (updateMeta),
 *   thay file (replace), xóa (remove).
 *
 * Lưu ý:
 * - Dùng req.filesNormalized (đã hậu kiểm kích thước) + req._rejectedFiles (mime/oversize).
 */
const path = require("path");
const fs = require("fs/promises");
const File = require("../models/file.model");

const relToAbs = (rel) => path.join(__dirname, "..", "..", "..", rel);

/** Helper số an toàn */
function toNum(v, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

/** Helper: log + trả JSON VI */
function sendJson(res, status, message, tag = "uploads", extra) {
  const time = new Date().toISOString();
  const line = `[${time}] [${tag}] ${message}`;
  try {
    if (status >= 500) console.error(line, extra || "");
    else if (status >= 400) console.warn(line, extra || "");
    else console.log(line, extra || "");
  } catch { /* noop */ }
  return res.status(status).json({ message });
}

/**
 * POST /uploads/:bucket
 * - Cho phép: 1 hoặc nhiều file (fields "file"/"files"...)
 * - Body: group, startOrder, orders, label/labels
 * - Kết quả: { count, items, errors }, errors từ req._rejectedFiles (mime/oversize...)
 */
exports.createMany = async (req, res, next) => {
  try {
    if (!req.userId) return sendJson(res, 401, "Chưa được xác thực", "uploads/createMany");

    const files = req.filesNormalized || [];
    const rejected = req._rejectedFiles || [];

    if (!files.length && rejected.length) {
      console.warn("[uploads/createMany] Tất cả file bị loại:", rejected);
      // 207 Multi-Status để FE biết có file pass/fail lẫn lộn
      return res.status(207).json({ count: 0, items: [], errors: rejected });
    }
    if (!files.length) return sendJson(res, 400, "Thiếu file", "uploads/createMany");

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
        originalName: f.originalnameUtf8 || f.originalname,
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
    console.log("[uploads/createMany] Tạo metadata OK:", {
      userId: req.userId, count: inserted.length, rejected: rejected.length,
    });

    return res.status(201).json({
      count: inserted.length,
      items: inserted,
      errors: rejected,
    });
  } catch (e) {
    next(e);
  }
};

/**
 * GET /uploads?bucket=&group=&year=&month=&day=&q=&page=&limit=&sort=
 * - Ép cứng ≤ 20 item/trang
 * - Nếu có group → ưu tiên order
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
      limit = 20,
      sort = "createdAt_desc",
    } = req.query;

    const RAW_PAGE = Number(page);
    const RAW_LIMIT = Number(limit);
    const SAFE_PAGE = Math.max(1, Number.isFinite(RAW_PAGE) ? RAW_PAGE : 1);
    const SAFE_LIMIT = Math.max(1, Math.min(20, Number.isFinite(RAW_LIMIT) ? RAW_LIMIT : 20));

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

exports.getOne = async (req, res, next) => {
  try {
    const doc = await File.findById(req.params.id);
    if (!doc) return sendJson(res, 404, "Không tìm thấy", "uploads/getOne", { id: req.params.id });
    res.json(doc);
  } catch (e) {
    next(e);
  }
};

exports.updateMeta = async (req, res, next) => {
  try {
    const patch = {};
    if (typeof req.body.label === "string") patch.label = req.body.label;
    if (typeof req.body.group === "string") patch.group = req.body.group;
    if (req.body.order !== undefined) patch.order = toNum(req.body.order);

    const doc = await File.findByIdAndUpdate(req.params.id, patch, { new: true });
    if (!doc) return sendJson(res, 404, "Không tìm thấy", "uploads/updateMeta", { id: req.params.id });
    res.json(doc);
  } catch (e) {
    next(e);
  }
};

exports.replace = async (req, res, next) => {
  try {
    const old = await File.findById(req.params.id);
    if (!old) return sendJson(res, 404, "Không tìm thấy", "uploads/replace", { id: req.params.id });
    if (!req.file) return sendJson(res, 400, "Thiếu file mới", "uploads/replace");

    try { await fs.unlink(relToAbs(old.relPath)); } catch (_) {}

    const f = req.file;
    old.bucket = req.params.bucket;
    old.type = f.mimetype;
    old.ext = f.ext;
    old.originalName = f.originalnameUtf8 || f.originalname;
    old.size = f.size;
    old.relPath = f.relPath;
    old.url = f.url;
    old.year = f.year;
    old.month = f.month;
    old.day = f.day;

    await old.save();
    console.log("[uploads/replace] Replace OK:", { id: req.params.id });
    res.json(old);
  } catch (e) {
    next(e);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const doc = await File.findByIdAndDelete(req.params.id);
    if (!doc) return sendJson(res, 404, "Không tìm thấy", "uploads/remove", { id: req.params.id });
    try { await fs.unlink(relToAbs(doc.relPath)); } catch (_) {}
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
};
