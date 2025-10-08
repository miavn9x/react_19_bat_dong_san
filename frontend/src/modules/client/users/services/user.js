import api from "../../../../services/http";

// Hồ sơ của chính mình (BE trả cả email)
export async function getMe() {
  const { data } = await api.get("/users/me");
  return data;
}

export async function updateMe(payload) {
  // chỉ name, avatar, phone, address
  const { data } = await api.put("/users/me", payload);
  return data;
}

// Hồ sơ 1 user khác (KHÔNG có email)
export async function getPublicProfile(id) {
  const { data } = await api.get(`/users/${id}/public`);
  return data;
}
