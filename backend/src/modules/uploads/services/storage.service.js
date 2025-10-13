// backend/src/modules/uploads/services/storage.service.js

/**
 * Storage Service
 * -----------------------------------------
 * - Xây dựng đường dẫn lưu trữ & tên file SEO.
 * - Tạo thư mục ngày (YYYY/MM/DD) theo bucket.
 * - Chuẩn hoá tên gốc (decode Latin-1 → UTF-8).
 *
 * Quy ước tên file:
 *   <seo>_<UPLOAD_NAME_TAG>_<YYYYMMDD>_<HHmmss>_<timestamp>_<nanoid><ext>
 */
const path = require("path");
const fs = require("fs/promises");
const { customAlphabet } = require("nanoid");
const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvwxyz", 10);

const ROOT = path.join(__dirname, "..", "..");        // => src/modules
const UPLOAD_ROOT = path.join(ROOT, "..", "uploads"); // => src/uploads

function today(dt = new Date()) {
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  const hh = String(dt.getHours()).padStart(2, "0");
  const mm = String(dt.getMinutes()).padStart(2, "0");
  const ss = String(dt.getSeconds()).padStart(2, "0");
  return { y, m, d, hh, mm, ss };
}

async function ensureDir(p) { await fs.mkdir(p, { recursive: true }); }

/** Decode Latin-1 -> UTF-8 để tránh “ký tự lạ” */
function normalizeOriginalName(name = "") {
  try { return Buffer.from(String(name), "latin1").toString("utf8"); }
  catch { return String(name); }
}

/** Tạo base-name SEO (bỏ dấu TV, chỉ [a-z0-9_], space -> _) */
function toSeoBaseName(input = "") {
  const base = String(input || "").replace(/\.[^.]+$/i, "");
  const noTone = base
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d");
  const ascii = noTone
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  return ascii.slice(0, 80) || "file";
}

/**
 * buildPath(bucket, originalName)
 * -> { abs, rel, url, y/m/d, ext, origUtf8, seoBase, fileId, timestamp }
 */
async function buildPath(bucket, originalName, opts = {}) {
  const uploaderTag = (process.env.UPLOAD_NAME_TAG || "mia_9x").trim() || "mia_9x";
  const now = new Date();
  const { y, m, d, hh, mm, ss } = today(now);

  const dir = path.join(UPLOAD_ROOT, bucket, y.toString(), m, d);
  await ensureDir(dir);

  const origUtf8 = normalizeOriginalName(originalName);
  const ext = (path.extname(origUtf8) || "").toLowerCase();
  const seo = toSeoBaseName(origUtf8);
  const ts = Date.now();
  const id = nanoid();

  const name = `${seo}_${uploaderTag}_${y}${m}${d}_${hh}${mm}${ss}_${ts}_${id}${ext}`;
  const abs = path.join(dir, name);

  const rel = path
    .relative(path.join(ROOT, ".."), abs)
    .replace(/\\/g, "/");
  const url = `/${rel}`; // vì /uploads đã mount static từ index.js

  return { abs, rel, url, y: +y, m: +m, d: +d, ext, origUtf8, seoBase: seo, fileId: id, timestamp: ts };
}

module.exports = { buildPath, UPLOAD_ROOT, normalizeOriginalName, toSeoBaseName };
