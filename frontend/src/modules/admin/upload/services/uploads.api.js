// frontend/src/modules/admin/upload/services/uploads.api.js

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";

const auth = () => {
  const t = localStorage.getItem("token");
  return t ? { Authorization: `Bearer ${t}` } : {};
};

export async function listFiles(params = {}) {
  const { bucket, year, month, day, q, page = 1, limit = 24 } = params;
  const qp = new URLSearchParams({ page, limit });
  if (bucket) qp.set("bucket", bucket);
  if (year) qp.set("year", year);
  if (month) qp.set("month", month);
  if (day) qp.set("day", day);
  if (q) qp.set("q", q);

  const res = await fetch(`${API_BASE}/uploads?${qp.toString()}`, { headers: { ...auth() } });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function uploadFile({ bucket, file, label }) {
  const fd = new FormData();
  fd.append("file", file);
  if (label) fd.append("label", label);
  const res = await fetch(`${API_BASE}/uploads/${bucket}`, { method: "POST", headers: { ...auth() }, body: fd });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateMeta({ id, label }) {
  const res = await fetch(`${API_BASE}/uploads/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...auth() },
    body: JSON.stringify({ label }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function replaceFile({ id, bucket, file }) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${API_BASE}/uploads/${id}/${bucket}`, { method: "PUT", headers: { ...auth() }, body: fd });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteFile({ id }) {
  const res = await fetch(`${API_BASE}/uploads/${id}`, { method: "DELETE", headers: { ...auth() } });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
