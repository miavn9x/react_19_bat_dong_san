
//backend/src/modules/uploads/models/file.model.js
/**
 * Storage Service
 * -----------------------------------------
 * Chức năng:
 *  - Xây dựng đường dẫn lưu trữ & tên file SEO.
 *  - Tạo thư mục ngày (YYYY/MM/DD) theo bucket.
 *  - Chuẩn hóa tên gốc (decode Latin-1 → UTF-8).
 *
 * Quy ước tên file:
 *   <seo>_<UPLOAD_NAME_TAG>_<YYYYMMDD>_<HHmmss>_<timestamp>_<nanoid><ext>
 *   - UPLOAD_NAME_TAG lấy từ env (mặc định "mia_9x").
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

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

/**
 * Decode tên file từ Latin-1 về UTF-8 (tránh lỗi “máº«u…/ký tự lạ”)
 */
function normalizeOriginalName(name = "") {
  try {
    return Buffer.from(String(name), "latin1").toString("utf8");
  } catch {
    return String(name);
  }
}

/**
 * Tạo base-name SEO (bỏ dấu TV, chỉ [a-z0-9_], khoảng trắng -> "_")
 */
function toSeoBaseName(input = "") {
  const base = String(input || "").replace(/\.[^.]+$/i, ""); // bỏ phần mở rộng
  const noTone = base
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")   // bỏ dấu Unicode
    .replace(/đ/gi, "d");
  const ascii = noTone
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, "")     // bỏ ký tự lạ
    .trim()
    .replace(/\s+/g, "_")              // space -> _
    .replace(/_+/g, "_")               // gộp nhiều _
    .replace(/^_+|_+$/g, "");          // trim _
  return ascii.slice(0, 80) || "file";
}

/**
 * buildPath(bucket, originalName)
 * - Trả về thông tin đầy đủ để lưu file:
 *   + abs: absolute path
 *   + rel: đường dẫn tương đối (dùng render URL)
 *   + url: đường dẫn public (đã mount static)
 *   + y/m/d/ext/origUtf8/seoBase/fileId/timestamp
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

  // ==> Tên file chuẩn SEO theo yêu cầu:
  const name = `${seo}_${uploaderTag}_${y}${m}${d}_${hh}${mm}${ss}_${ts}_${id}${ext}`;

  const abs = path.join(dir, name);

  // convert to relative (từ backend/src)
  const rel = path
    .relative(path.join(ROOT, ".."), abs)
    .replace(/\\/g, "/"); // Windows normalize
  const url = `/${rel}`; // do static /uploads đã mount

  return {
    abs,
    rel,
    url,
    y: Number(y),
    m: Number(m),
    d: Number(d),
    ext,
    origUtf8,     // để controller lưu originalName đẹp
    seoBase: seo, // useful nếu cần
    fileId: id,   // useful nếu cần
    timestamp: ts // useful nếu cần
  };
}

module.exports = {
  buildPath,
  UPLOAD_ROOT,
  normalizeOriginalName,
  toSeoBaseName
};
