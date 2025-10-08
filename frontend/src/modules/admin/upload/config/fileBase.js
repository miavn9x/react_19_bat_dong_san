export const API_BASE =
  import.meta.env.VITE_API_URL ||    // bạn đã set biến này
  import.meta.env.VITE_API_BASE ||
  "http://localhost:4000/api";

export const FILE_BASE = API_BASE.replace(/\/api\/?$/, ""); // -> http://localhost:4000

export const toFileURL = (u) =>
  !u ? "" : u.startsWith("/uploads") ? FILE_BASE + u : u;
