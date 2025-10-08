// backend/src/modules/uploads/services/storage.service.js
const path = require("path");
const fs = require("fs/promises");
const { customAlphabet } = require("nanoid");
const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvwxyz", 12);

const ROOT = path.join(__dirname, "..", "..");          // => src/modules
const UPLOAD_ROOT = path.join(ROOT, "..", "uploads");    // => src/uploads

function today() {
  const t = new Date();
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, "0");
  const d = String(t.getDate()).padStart(2, "0");
  return { y, m, d };
}

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

/** Tạo thư mục YYYY/MM/DD bên trong bucket và sinh tên file */
async function buildPath(bucket, originalName) {
  const { y, m, d } = today();
  const dir = path.join(UPLOAD_ROOT, bucket, y.toString(), m, d);
  await ensureDir(dir);

  const ext = (path.extname(originalName) || "").toLowerCase();
  const name = `${Date.now()}_${nanoid()}${ext}`;
  const abs = path.join(dir, name);

  // convert to relative (từ src/)
  const rel = path.relative(path.join(ROOT, ".."), abs).replace(/\\/g, "/");
  const url = `/${rel}`; // vì đã mount /uploads static

  return { abs, rel, url, y: Number(y), m: Number(m), d: Number(d), ext };
}

module.exports = { buildPath, UPLOAD_ROOT };
