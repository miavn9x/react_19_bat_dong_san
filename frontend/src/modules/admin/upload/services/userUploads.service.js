//frontend/src/modules/admin/upload/services/userUploads.service.js
// Service upload trong user
import { API_BASE, authHeaders } from "../config/api";
import { xhrUpload } from "../../../../utils/xhrUpload";

export async function getUploadLimit(bucket) {
  const res = await fetch(`${API_BASE}/uploads/_info/limits/${bucket}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function listFiles(params = {}) {
  const { bucket, group, page = 1, limit = 24, q } = params;
  const qp = new URLSearchParams({ page, limit });
  if (bucket) qp.set("bucket", bucket);
  if (group) qp.set("group", group);
  if (q) qp.set("q", q);

  const res = await fetch(`${API_BASE}/uploads?${qp.toString()}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/** Upload nhiều (hoặc 1) — có tiến trình */
export async function uploadMany({ bucket, files, group = "", startOrder = 0, onProgress, signal }) {
  const fd = new FormData();
  [...files].forEach((f) => fd.append("files", f));
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
