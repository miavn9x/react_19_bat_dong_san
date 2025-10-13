

/**
 * Admin Upload Services (FULL)
 * ---------------------------
 * - listFiles, uploadMany, updateMeta, replaceFile, deleteFile (API gốc)
 * - NEW: listAllByGroup, deleteByGroupOrder, replaceByGroupOrder, setOrder
 */

import { API_BASE, authHeaders } from "../config/api";
import { xhrUpload } from "../../../../utils/xhrUpload";

/** Limit theo bucket */
export async function getUploadLimit(bucket) {
  const res = await fetch(`${API_BASE}/uploads/_info/limits/${bucket}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json(); // { bucket, maxBytes }
}

/** List có phân trang */
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

/** NEW: List toàn bộ theo group (tự phân trang) */
export async function listAllByGroup(group) {
  const pageSize = 20;
  let page = 1;
  let all = [];
  while (true) {
    const qp = new URLSearchParams({
      group, page: String(page), limit: String(pageSize), sort: "order_asc"
    });
    const res = await fetch(`${API_BASE}/uploads?${qp.toString()}`);
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    all = all.concat(data.items || []);
    if (all.length >= (data.total || 0)) break;
    page += 1;
  }
  return all;
}

/** Upload nhiều (hoặc 1) — có tiến trình % */
export async function uploadMany({ bucket, files, group = "", startOrder = 0, labels = [], orders = [], onProgress, signal }) {
  const fd = new FormData();
  [...files].forEach((f) => fd.append("files", f));
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

/** Patch meta (order/group/label) */
export async function updateMeta({ id, patch }) {
  const res = await fetch(`${API_BASE}/uploads/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/** Replace file theo id */
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

/** Delete theo id */
export async function deleteFile({ id }) {
  const res = await fetch(`${API_BASE}/uploads/${id}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/** NEW: Delete theo group + order */
export async function deleteByGroupOrder(group, order) {
  const res = await fetch(`${API_BASE}/uploads/_remove-by-pos`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ group, order }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/** NEW: Replace theo group + order (single) */
export async function replaceByGroupOrder({ group, order, bucket, file, onProgress, signal }) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("group", group);
  fd.append("order", String(order));
  return xhrUpload({
    url: `${API_BASE}/uploads/_replace-by-pos/${bucket}`,
    formData: fd,
    headers: { ...authHeaders() },
    onProgress,
    signal,
  });
}

/** NEW: setOrder (và/hoặc group) cho file id */
export async function setOrder({ id, order, group }) {
  const patch = {};
  if (typeof order === "number") patch.order = order;
  if (group) patch.group = group;
  const res = await fetch(`${API_BASE}/uploads/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
