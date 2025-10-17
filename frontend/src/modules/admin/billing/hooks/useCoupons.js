import { useCallback, useEffect, useMemo, useState } from "react";
import { listCoupons, createCoupon, updateCoupon, deleteCoupon } from "../services/coupon.service";

export default function useCoupons() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setErr("");
    try {
      const data = await listCoupons();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e?.message || "Không tải được mã giảm giá");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onCreate = useCallback(async (payload) => {
    await createCoupon(payload);
    await load();
  }, [load]);

  const onToggle = useCallback(async (id, cur) => {
    await updateCoupon(id, { isActive: !cur });
    await load();
  }, [load]);

  const onDelete = useCallback(async (id) => {
    await deleteCoupon(id);
    await load();
  }, [load]);

  const helpers = useMemo(() => ({
    filterActive: (list, active) => list.filter(c => !!c.isActive === active),
    searchByCode: (list, q) => {
      const s = q.trim().toLowerCase();
      if (!s) return list;
      return list.filter(c => String(c.code||"").toLowerCase().includes(s));
    }
  }), []);

  return { items, loading, err, load, onCreate, onToggle, onDelete, helpers };
}
