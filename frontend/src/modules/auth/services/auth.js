// // ==========================================
// // FILE 2: frontend/src/modules/auth/services/auth.js
// // ==========================================

// frontend/src/modules/auth/services/auth.js
import http from "../../../services/http";

export const AUTH_EVENT = "auth-changed";
function emitAuthChanged() {
  window.dispatchEvent(new Event(AUTH_EVENT));
}

/** Đăng nhập: lưu token, KHÔNG lưu user vào localStorage */
export async function login(email, password) {
  const { data } = await http.post("/auth/login", { email, password });
  localStorage.setItem("token", data.token);
  emitAuthChanged();
  return data; // { token, user }
}

/** Đăng ký (không auto-login) */
export async function register(name, email, password) {
  const { data } = await http.post("/auth/register", { name, email, password });
  return data;
}

/** Lấy hồ sơ của mình (dùng access token) */
export async function getMe() {
  const { data } = await http.get("/users/me");
  return data;
}

/** Đăng xuất: thu hồi phiên + xóa token
 *  (Sửa lỗi ESLint: không để catch rỗng)
 */
export async function logout() {
  try {
    await http.post("/auth/logout");
  } catch (err) {
    // Không làm hỏng luồng nếu logout API lỗi (token hết hạn / network)
    console.warn("[logout] API failed:", err?.message || err);
  } finally {
    localStorage.removeItem("token");
    emitAuthChanged();
  }
}
