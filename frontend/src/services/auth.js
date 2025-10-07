// src/services/auth.js
import api from "../lib/api";

export const AUTH_EVENT = "auth-changed";

function emitAuthChanged() {
  window.dispatchEvent(new Event(AUTH_EVENT));
}

/** Đăng nhập: { email, password } -> { token, user } */
export async function login(email, password) {
  const { data } = await api.post("/auth/login", { email, password });
  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));
  emitAuthChanged();
  return data; // { token, user }
}

/** Đăng ký: { name, email, password } -> { token, user }
 *  ✅ KHÔNG auto-login: KHÔNG lưu token/user
 */
export async function register(name, email, password) {
  const { data } = await api.post("/auth/register", { name, email, password });
  // Không lưu token & user để user phải đăng nhập bằng tài khoản vừa tạo
  return data; // bạn vẫn có thể hiển thị thông báo/next step từ FE
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
