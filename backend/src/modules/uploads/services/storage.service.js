

// // backend/src/modules/uploads/services/storage.service.js
// const path = require("path");
// const fs = require("fs/promises");
// const { customAlphabet } = require("nanoid");
// const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvwxyz", 10);

// const ROOT = path.join(__dirname, "..", "..");        // => src/modules
// const UPLOAD_ROOT = path.join(ROOT, "..", "uploads"); // => src/uploads

// function today() {
//   const t = new Date();
//   const y = t.getFullYear();
//   const m = String(t.getMonth() + 1).padStart(2, "0");
//   const d = String(t.getDate()).padStart(2, "0");
//   return { y, m, d };
// }

// async function ensureDir(p) {
//   await fs.mkdir(p, { recursive: true });
// }

// /** Bỏ dấu TV, chỉ giữ [a-z0-9_], khoảng trắng -> "_" */
// function toSeoBaseName(input = "") {
//   const base = String(input || "")
//     .replace(/\.[^.]+$/i, ""); // bỏ phần mở rộng
//   const noTone = base
//     .normalize("NFD")
//     .replace(/[\u0300-\u036f]/g, "") // bỏ dấu Unicode
//     .replace(/đ/gi, "d");
//   const ascii = noTone
//     .toLowerCase()
//     .replace(/[^a-z0-9\s_-]/g, "")   // bỏ ký tự lạ
//     .trim()
//     .replace(/\s+/g, "_")            // space -> _
//     .replace(/_+/g, "_")             // gộp nhiều _
//     .replace(/^_+|_+$/g, "");        // trim _
//   return ascii.slice(0, 80) || "file";
// }

// /** Tạo đường dẫn YYYY/MM/DD + tên file SEO + nanoid trong bucket */
// async function buildPath(bucket, originalName) {
//   const { y, m, d } = today();
//   const dir = path.join(UPLOAD_ROOT, bucket, y.toString(), m, d);
//   await ensureDir(dir);

//   const ext = (path.extname(originalName) || "").toLowerCase(); // .jpg /.mp4...
//   const seo = toSeoBaseName(originalName); // ví dụ: hinh_anh_san_pham
//   const name = `${seo}_${Date.now()}_${nanoid()}${ext}`;        // seo + timestamp + id
//   const abs = path.join(dir, name);

//   // convert to relative (từ backend/src)
//   const rel = path
//     .relative(path.join(ROOT, ".."), abs)
//     .replace(/\\/g, "/"); // Windows normalize
//   const url = `/${rel}`; // do static /uploads đã mount

//   return { abs, rel, url, y: Number(y), m: Number(m), d: Number(d), ext };
// }

// module.exports = { buildPath, UPLOAD_ROOT };
// backend/src/modules/uploads/services/storage.service.js
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

/** Decode tên file từ Latin-1 về UTF-8 (tránh lỗi “máº«u…”) */
function normalizeOriginalName(name = "") {
  // Nhiều trình duyệt/middleware gửi filename ở Latin-1
  // Buffer 'latin1' => 'utf8' để giữ nguyên ký tự tiếng Việt
  try {
    return Buffer.from(String(name), "latin1").toString("utf8");
  } catch {
    return String(name);
  }
}

/** Bỏ dấu TV, chỉ giữ [a-z0-9_], khoảng trắng -> "_" */
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
 * Tạo đường dẫn + tên file SEO theo format:
 * <seo>_mia_9x_<YYYYMMDD>_<HHmmss>_<timestamp>_<nanoid><ext>
 * - uploaderTag đọc từ env UPLOAD_NAME_TAG (mặc định "mia_9x")
 */
async function buildPath(bucket, originalName, opts = {}) {
  const uploaderTag = (process.env.UPLOAD_NAME_TAG || "mia_9x").trim() || "mia_9x";
  const now = new Date();
  const { y, m, d, hh, mm, ss } = today(now);

  const dir = path.join(UPLOAD_ROOT, bucket, y.toString(), m, d);
  await ensureDir(dir);

  const origUtf8 = normalizeOriginalName(originalName);
  const ext = (path.extname(origUtf8) || "").toLowerCase(); // .jpg /.mp4 ...
  const seo = toSeoBaseName(origUtf8);                       // ví dụ: mau_anh_03
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
