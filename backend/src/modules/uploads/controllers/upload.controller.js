// backend/src/modules/uploads/controllers/upload.controller.js
const path = require("path");
const fs = require("fs/promises");
const File = require("../models/file.model");

const relToAbs = (rel) => path.join(__dirname, "..", "..", "..", rel);

exports.create = async (req, res, next) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthenticated" });
    if (!req.file)   return res.status(400).json({ message: "Thiếu file" });

    const f = req.file;
    const doc = await File.create({
      owner: req.userId,                 // ⬅️ gán người upload
      bucket: req.params.bucket,
      type: f.mimetype,
      ext: f.ext,
      originalName: f.originalname,
      size: f.size,
      relPath: f.relPath,
      url: f.url,
      year: f.year, month: f.month, day: f.day,
      label: req.body.label || "",
    });

    res.status(201).json(doc);
  } catch (e) { next(e); }
};

exports.list = async (req, res, next) => {
  try {
    const { bucket, year, month, day, q, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (bucket) filter.bucket = bucket;
    if (year)   filter.year   = Number(year);
    if (month)  filter.month  = Number(month);
    if (day)    filter.day    = Number(day);
    if (q)      filter.originalName = { $regex: q, $options: "i" };

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      File.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      File.countDocuments(filter),
    ]);
    res.json({ total, page: Number(page), limit: Number(limit), items });
  } catch (e) { next(e); }
};

exports.getOne = async (req, res, next) => {
  try {
    const doc = await File.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Không tìm thấy" });
    res.json(doc);
  } catch (e) { next(e); }
};

exports.updateMeta = async (req, res, next) => {
  try {
    const doc = await File.findByIdAndUpdate(
      req.params.id,
      { label: req.body.label },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: "Không tìm thấy" });
    res.json(doc);
  } catch (e) { next(e); }
};

exports.replace = async (req, res, next) => {
  try {
    const old = await File.findById(req.params.id);
    if (!old) return res.status(404).json({ message: "Không tìm thấy" });
    if (!req.file) return res.status(400).json({ message: "Thiếu file mới" });

    // xóa file cũ (nếu còn)
    try { await fs.unlink(relToAbs(old.relPath)); } catch (_) {}

    const f = req.file;
    old.bucket = req.params.bucket;
    old.type = f.mimetype;
    old.ext = f.ext;
    old.originalName = f.originalname;
    old.size = f.size;
    old.relPath = f.relPath;
    old.url = f.url;
    old.year = f.year; old.month = f.month; old.day = f.day;

    await old.save();
    res.json(old);
  } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
  try {
    const doc = await File.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: "Không tìm thấy" });
    try { await fs.unlink(relToAbs(doc.relPath)); } catch (_) {}
    res.json({ ok: true });
  } catch (e) { next(e); }
};
