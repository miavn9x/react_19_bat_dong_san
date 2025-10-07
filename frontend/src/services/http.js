// src/services/http.js
import axios from "axios";

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // ví dụ: http://localhost:4000/api
  withCredentials: false,
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default http;
