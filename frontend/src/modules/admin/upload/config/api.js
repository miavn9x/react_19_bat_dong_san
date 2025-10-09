//frontend/src/modules/admin/upload/config/api.js
// Đọc API base từ .env (triển khai dễ)
export const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "http://localhost:4000/api";

// FILE_BASE = gốc server để build URL tuyệt đối cho /uploads/**
export const FILE_BASE = API_BASE.replace(/\/api\/?$/, "");

// Helper: build URL tuyệt đối cho file tĩnh
export const toFileURL = (u) => (!u ? "" : u.startsWith("/uploads") ? FILE_BASE + u : u);

// Helper: header Auth
export const authHeaders = () => {
  const t = localStorage.getItem("token");
  return t ? { Authorization: `Bearer ${t}` } : {};
};
