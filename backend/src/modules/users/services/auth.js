// // frontend/src/modules/auth/services/auth.js
// import http from "../../../services/http";
// import { setAccessToken, clearAccessToken } from "../../../services/token";
// import { getCookie } from "../../../services/cookie";

// export const AUTH_EVENT = "auth-changed";
// function emitAuthChanged() {
//   window.dispatchEvent(new Event(AUTH_EVENT));
// }

// /** Đăng nhập */
// export async function login(email, password) {
//   const { data } = await http.post("/auth/login", { email, password });
//   // KHÔNG lưu token vào storage
//   setAccessToken(data.token);
//   // Lưu user (không nhạy cảm) để guard/UI dùng
//   localStorage.setItem("user", JSON.stringify(data.user));
//   emitAuthChanged();
//   return data; // { token, user }
// }

// /** Đăng ký (không auto-login) */
// export async function register(name, email, password) {
//   const { data } = await http.post("/auth/register", { name, email, password });
//   return data;
// }

// /** Lấy hồ sơ của mình (cần access token đang in-memory) */
// export async function getMe() {
//   const { data } = await http.get("/users/me");
//   return data;
// }

// /** Đăng xuất (thu hồi phiên hiện tại) */
// export async function logout() {
//   try {
//     await http.post("/auth/logout"); // có thể fail nếu token hết hạn
//   } catch {}
//   clearAccessToken();
//   localStorage.removeItem("user");
//   emitAuthChanged();
// }

// /** Bootstrap phiên khi F5:
//  *  - Nếu có cookie refresh + rt-csrf -> gọi refresh để lấy access token vào RAM
//  *  - Set lại user từ payload
//  */
// export async function bootstrapAuth() {
//   try {
//     const hasCsrf = !!getCookie("rt-csrf");
//     if (!hasCsrf) return false; // không cố gọi, tránh 403
//     // rely vào http interceptors? Ở đây gọi thẳng refresh để chủ động
//     const { data } = await http.post("/auth/refresh", null, {
//       headers: { "X-CSRF-Token": getCookie("rt-csrf") },
//       withCredentials: true,
//     });
//     setAccessToken(data.token);
//     if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
//     emitAuthChanged();
//     return true;
//   } catch {
//     // im lặng: coi như chưa đăng nhập
//     clearAccessToken();
//     localStorage.removeItem("user");
//     emitAuthChanged();
//     return false;
//   }
// }
