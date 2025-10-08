import api from "../../../../services/http";

// Danh sách người dùng (có tìm kiếm/paginate)
export async function listUsers({ page = 1, limit = 20, q = "" } = {}) {
  const { data } = await api.get("/users", { params: { page, limit, q } });
  return data; // { items, total, page, limit }
}

// Đổi role: 'user' | 'admin'
export async function updateUserRole(id, role) {
  const { data } = await api.patch(`/users/${id}/role`, { role });
  return data; // {_id, name, email, role}
}

// Xoá người dùng
export async function deleteUser(id) {
  const { data } = await api.delete(`/users/${id}`);
  return data; // { success: true }
}
