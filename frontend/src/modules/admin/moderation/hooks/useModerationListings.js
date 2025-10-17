import { useCallback, useEffect, useMemo, useState } from "react";
import { listPosts, moderatePost } from "../../post/services/adminPosts.service";

export default function useModerationListings() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async ({ page = 1, limit = 20, q = "" } = {}) => {
    setLoading(true); setErr("");
    try {
      const res = await listPosts({
        page, limit, q,
        kind: "listing",
        moderation: "pending",
      });
      setItems(res?.items || []);
    } catch (e) {
      setErr(e?.message || "Không tải được danh sách tin chờ duyệt");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load({}); }, [load]);

  const onApprove = useCallback(async (id) => {
    await moderatePost(id, { action: "approve" });
    await load({});
  }, [load]);

  const onReject = useCallback(async (id, note = "") => {
    await moderatePost(id, { action: "reject", note });
    await load({});
  }, [load]);

  const helpers = useMemo(() => ({
    search: (list, q) => {
      const s = q.trim().toLowerCase();
      if (!s) return list;
      return list.filter(p =>
        String(p.title||"").toLowerCase().includes(s) ||
        String(p.slug||"").toLowerCase().includes(s) ||
        String(p.author?.name||"").toLowerCase().includes(s)
      );
    }
  }), []);

  return { items, loading, err, load, onApprove, onReject, helpers };
}
