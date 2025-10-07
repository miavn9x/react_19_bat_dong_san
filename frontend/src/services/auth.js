// src/services/auth.js
import api from "../lib/api";

export const AUTH_EVENT = "auth-changed";

function emitAuthChanged() {
  window.dispatchEvent(new Event(AUTH_EVENT));
}

/** Đăng nhập: { email, password } -> { token, user } */
export async function login(email, password) {
  const { data } = await api.post("/auth/login", { email, password });
  // Nếu BE trả lỗi 4xx, axios sẽ throw và KHÔNG chạy các dòng dưới.
  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));
  emitAuthChanged();
  return data; // { token, user }
}

/** Đăng ký: { name, email, password } -> { token, user } */
export async function register(name, email, password) {
  const { data } = await api.post("/auth/register", { name, email, password });
  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));
  emitAuthChanged();
  return data;
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  emitAuthChanged();
}

/** (tùy BE) */
export async function getMe() {
  const { data } = await api.get("/users/me");
  return data;
}
