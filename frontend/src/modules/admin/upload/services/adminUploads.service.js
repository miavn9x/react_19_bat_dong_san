/**
 * adminUploads.service.js
 * ----------------------------------------------------
 * Mục đích:
 * - Dịch vụ gọi API upload cho trang Admin.
 * - Đồng bộ với BE: list (bucket, group, q, page, limit, sort), upload many (files), replace (file), update/delete.
 */

import { API_BASE, authHeaders } from "../config/api";
import { xhrUpload } from "../../../../utils/xhrUpload";

/** Lấy limit theo bucket để FE validate/hiển thị */
export async function getUploadLimit(bucket) {
  const res = await fetch(`${API_BASE}/uploads/_info/limits/${bucket}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json(); // { bucket, maxBytes }
}

/** List file (public + admin dùng) */
export async function listFiles(params = {}) {
  const { bucket, group, year, month, day, q, page = 1, limit = 20, sort } = params;
  const qp = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (bucket) qp.set("bucket", bucket);
  if (group) qp.set("group", group);
  if (year) qp.set("year", String(year));
  if (month) qp.set("month", String(month));
  if (day) qp.set("day", String(day));
  if (q) qp.set("q", q);
  if (sort) qp.set("sort", sort);

  const res = await fetch(`${API_BASE}/uploads?${qp.toString()}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/** Upload nhiều file (hoặc 1) — có tiến trình % (theo tổng request) */
export async function uploadMany({ bucket, files, group = "", startOrder = 0, labels = [], orders = [], onProgress, signal }) {
  const fd = new FormData();
  [...files].forEach((f) => fd.append("files", f));  // name 'files' khớp BE (.any())
  if (group) fd.append("group", group);
  fd.append("startOrder", String(startOrder));
  if (labels.length) fd.append("labels", labels.join(","));
  if (orders.length) fd.append("orders", orders.map(String).join(","));

  return xhrUpload({
    url: `${API_BASE}/uploads/${bucket}`,
    formData: fd,
    headers: { ...authHeaders() },
    onProgress,
    signal,
  });
}

/** Admin: cập nhật metadata (label/group/order) */
export async function updateMeta({ id, patch }) {
  const res = await fetch(`${API_BASE}/uploads/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/** Admin: thay file (single) — có tiến trình */
export async function replaceFile({ id, bucket, file, onProgress, signal }) {
  const fd = new FormData();
  fd.append("file", file);
  return xhrUpload({
    url: `${API_BASE}/uploads/${id}/${bucket}`,
    formData: fd,
    headers: { ...authHeaders() },
    onProgress,
    signal,
  });
}

/** Admin: xóa file */
export async function deleteFile({ id }) {
  const res = await fetch(`${API_BASE}/uploads/${id}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
