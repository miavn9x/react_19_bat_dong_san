

// ==========================================
// FILE: frontend/src/services/http.js
// ==========================================
import axios from "axios";

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
  withCredentials: true,
  timeout: 10000,
});

// Đính kèm token từ localStorage
http.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Tự refresh khi 401: CHỈ cập nhật token, không đụng user
http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const csrfToken = document.cookie
          .split("; ")
          .find((row) => row.startsWith("rt-csrf="))
          ?.split("=")[1];

        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL || "http://localhost:4000/api"}/auth/refresh`,
          {},
          {
            withCredentials: true,
            headers: csrfToken ? { "X-CSRF-Token": csrfToken } : {},
          }
        );

        localStorage.setItem("token", data.token);
        window.dispatchEvent(new Event("auth-changed"));
        originalRequest.headers.Authorization = `Bearer ${data.token}`;
        return http(originalRequest);
      } catch {
        localStorage.removeItem("token");
        window.dispatchEvent(new Event("auth-changed"));
        window.location.href = "/login";
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export default http;
