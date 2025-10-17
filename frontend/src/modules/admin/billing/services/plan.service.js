// frontend/src/modules/admin/billing/services/plan.service.js
import http from "../../../../services/http";

export async function listPlans() {
  const { data } = await http.get("/billing/plans");
  return data.items || [];
}
export async function createPlan(payload) {
  const { data } = await http.post("/billing/plans", payload);
  return data;
}
export async function updatePlan(id, patch) {
  const { data } = await http.patch(`/billing/plans/${id}`, patch);
  return data;
}
export async function deletePlan(id) {
  const { data } = await http.delete(`/billing/plans/${id}`);
  return data;
}
