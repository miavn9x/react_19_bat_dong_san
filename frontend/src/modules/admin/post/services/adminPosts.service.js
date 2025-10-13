
// frontend/src/modules/admin/post/services/adminPosts.service.js
import { API_BASE, authHeaders } from "../../upload/config/api";

function handleRes(res) {
  if (!res.ok)
    return res.text().then((t) => {
      throw new Error(t || res.statusText);
    });
  return res.json();
}

// ✅ thêm owner (admin|user) nếu có
export async function listPosts({
  page = 1,
  limit = 12,
  q = "",
  category = "",
  tag = "",
  author = "",
  status = "draft",
  owner = "", // ⬅️ NEW
} = {}) {
  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("limit", String(limit));
  if (q) qs.set("q", q);
  if (category) qs.set("category", category);
  if (tag) qs.set("tag", tag);
  if (author) qs.set("author", author);
  if (status) qs.set("status", status);
  if (owner) qs.set("owner", owner); // ⬅️ truyền xuống BE nếu hỗ trợ

  const res = await fetch(`${API_BASE}/posts?${qs.toString()}`, {
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function createPost(payload) {
  const res = await fetch(`${API_BASE}/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  return handleRes(res);
}

export async function updatePost(id, patch) {
  const res = await fetch(`${API_BASE}/posts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(patch),
  });
  return handleRes(res);
}

export async function setCover(postId, fileId) {
  const res = await fetch(`${API_BASE}/posts/${postId}/cover`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ fileId }),
  });
  return handleRes(res);
}

export async function deletePost(id) {
  const res = await fetch(`${API_BASE}/posts/${id}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}

export async function getPostBySlug(slug, { includeGallery = true } = {}) {
  const qs = includeGallery ? "?include=gallery" : "";
  const res = await fetch(`${API_BASE}/posts/${encodeURIComponent(slug)}${qs}`, {
    headers: { ...authHeaders() },
  });
  return handleRes(res);
}
