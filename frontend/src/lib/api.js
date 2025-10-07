// src/lib/api.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,  // ví dụ: http://localhost:4000/api
  withCredentials: false,                 // dùng Bearer token (không dùng cookie)
});

// Gắn token vào header trước mỗi request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Bắt lỗi chung (tuỳ chọn)
api.interceptors.response.use(
  (res) => res,
  (error) => {
    // Ví dụ: nếu 401 thì có thể logout tự động
    return Promise.reject(error);
  }
);

export default api;
