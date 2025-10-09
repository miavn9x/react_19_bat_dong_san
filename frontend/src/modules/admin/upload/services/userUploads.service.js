// frontend/src/modules/admin/upload/services/userUploads.service.js
/**
 * userUploads.service.js
 * ----------------------------------------------------
 * - Dịch vụ gọi API upload cho trang User.
 * - Đồng bộ với BE: list (bucket, group, q, page, limit), upload many (files).
 * - Không set Content-Type cho FormData (browser tự gắn boundary).
 */

import { API_BASE, authHeaders } from "../config/api";
import { xhrUpload } from "../../../../utils/xhrUpload";

/** Lấy limit theo bucket (public) */
export async function getUploadLimit(bucket) {
  const res = await fetch(`${API_BASE}/uploads/_info/limits/${bucket}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/** List file (public) */
export async function listFiles(params = {}) {
  const { bucket, group, page = 1, limit = 20, q } = params;
  const qp = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (bucket) qp.set("bucket", bucket);
  if (group) qp.set("group", group);
  if (q) qp.set("q", q);

  const res = await fetch(`${API_BASE}/uploads?${qp.toString()}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/** Upload nhiều (hoặc 1) — có tiến trình */
export async function uploadMany({ bucket, files, group = "", startOrder = 0, onProgress, signal }) {
  const arr = Array.from(files || []);
  if (arr.length === 0) {
    // Trả shape giống BE cho hook xử lý uniform
    return { items: [], errors: [] };
  }

  const fd = new FormData();
  arr.forEach((f) => fd.append("files", f));
  if (group) fd.append("group", group);
  fd.append("startOrder", String(startOrder));

  return xhrUpload({
    url: `${API_BASE}/uploads/${bucket}`,
    formData: fd,
    headers: { ...authHeaders() }, // user cần login
    onProgress,
    signal,
  });
}
