//frontend/src/modules/admin/users/billing/services/billing.service.js
// Quản lý quota & order cho USER – bám sát /api/billing/*
import { API_BASE, authHeaders } from "../../../admin/upload/config/api";

function handle(res) {
  if (!res.ok) return res.text().then((t) => { throw new Error(t || res.statusText); });
  return res.json();
}

// GET /billing/quota/me  -> { remaining }
export async function getMyQuota() {
  const res = await fetch(`${API_BASE}/billing/quota/me`, { headers: { ...authHeaders() } });
  return handle(res);
}

// GET /billing/orders/me -> { items }
export async function getMyOrders() {
  const res = await fetch(`${API_BASE}/billing/orders/me`, { headers: { ...authHeaders() } });
  return handle(res);
}

// POST /billing/orders { planCode, quantity, couponCode? } -> order
export async function createOrder({ planCode, quantity = 1, couponCode = "" }) {
  const res = await fetch(`${API_BASE}/billing/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ planCode, quantity, couponCode }),
  });
  return handle(res);
}
