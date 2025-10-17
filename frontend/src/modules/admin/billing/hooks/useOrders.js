// frontend/src/modules/admin/billing/hooks/useOrders.js
import { useCallback, useEffect, useMemo, useState } from "react";
import { listOrders, markPaid } from "../services/order.service";

export default function useOrders() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setErr("");
    try {
      const data = await listOrders();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e?.message || "Không tải được đơn hàng");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onMarkPaid = useCallback(async (id) => {
    await markPaid(id);
    await load();
  }, [load]);

  const helpers = useMemo(() => ({
    byStatus: (list, status) => !status ? list : list.filter(o => o.status === status),
    search: (list, q) => {
      const s = q.trim().toLowerCase();
      if (!s) return list;
      return list.filter(o =>
        String(o._id||"").toLowerCase().includes(s) ||
        String(o.userId||"").toLowerCase().includes(s) ||
        String(o.planSnapshot?.name||o.planSnapshot?.code||"").toLowerCase().includes(s)
      );
    }
  }), []);

  return { items, loading, err, load, onMarkPaid, helpers };
}
