// frontend/src/modules/admin/billing/services/order.service.js
import http from "../../../../services/http";

// Toggle: bật khi BE có GET /billing/orders (admin)
const USE_ADMIN_ORDERS_ENDPOINT = false;

export async function listOrders() {
  if (USE_ADMIN_ORDERS_ENDPOINT) {
    // Khi BE bổ sung endpoint này thì bật cờ trên
    const { data } = await http.get("/billing/orders");
    return data.items || [];
  }
  // Hiện tại: chỉ dùng /me để tránh 404
  const { data } = await http.get("/billing/orders/me");
  return data.items || [];
}

export async function markPaid(id) {
  const { data } = await http.patch(`/billing/orders/${id}/mark-paid`);
  return data;
}
