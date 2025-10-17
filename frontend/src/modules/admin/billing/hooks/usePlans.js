import { useCallback, useEffect, useMemo, useState } from "react";
import { listPlans, createPlan, updatePlan, deletePlan } from "../services/plan.service";

export default function usePlans() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setErr("");
    try {
      const data = await listPlans();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e?.message || "Không tải được danh sách gói");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onCreate = useCallback(async (payload) => {
    await createPlan(payload);
    await load();
  }, [load]);

  const onUpdate = useCallback(async (id, patch) => {
    await updatePlan(id, patch);
    await load();
  }, [load]);

  const onDelete = useCallback(async (id) => {
    await deletePlan(id);
    await load();
  }, [load]);

  // client-side filter/sort cơ bản cho UI
  const helpers = useMemo(() => ({
    sortByKey: (key) => {
      setItems((prev) => [...prev].sort((a,b) => String(a[key]??"").localeCompare(String(b[key]??""))));
    },
  }), []);

  return { items, loading, err, load, onCreate, onUpdate, onDelete, helpers };
}
