import { API_BASE, authHeaders } from "../../../upload/config/api";

function handle(res) {
  if (!res.ok) return res.text().then((t) => { throw new Error(t || res.statusText); });
  return res.json();
}

export async function createPost(payload) {
  const res = await fetch(`${API_BASE}/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  return handle(res);
}

export async function updatePost(id, patch) {
  const res = await fetch(`${API_BASE}/posts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(patch),
  });
  return handle(res);
}

export async function setCover(postId, fileId) {
  const res = await fetch(`${API_BASE}/posts/${postId}/cover`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ fileId }),
  });
  return handle(res);
}

// Optional (nếu cần list bài của tôi)
export async function listMyPosts({ page = 1, limit = 12, status = "" } = {}) {
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) qs.set("status", status);
  const res = await fetch(`${API_BASE}/posts?${qs}`, { headers: { ...authHeaders() } });
  return handle(res);
}
