// frontend/src/modules/admin/billing/services/coupon.service.js
import http from "../../../../services/http";

export async function listCoupons() {
  const { data } = await http.get("/billing/coupons");
  return data.items || [];
}
export async function createCoupon(payload) {
  const { data } = await http.post("/billing/coupons", payload);
  return data;
}
export async function updateCoupon(id, patch) {
  const { data } = await http.patch(`/billing/coupons/${id}`, patch);
  return data;
}
export async function deleteCoupon(id) {
  const { data } = await http.delete(`/billing/coupons/${id}`);
  return data;
}
