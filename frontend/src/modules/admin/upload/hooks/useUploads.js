// frontend/src/modules/admin/upload/hooks/useUploads.js
import { useCallback, useEffect, useState } from "react";
import { listFiles } from "../services/uploads.api";

export default function useUploads({ filters, pageSize = 24 }) {
  const [state, set] = useState({
    items: [],
    total: 0,
    page: 1,
    limit: pageSize,
    loading: false,
    error: "",
  });

  // ✅ useCallback để deps của useEffect đơn giản & đúng
  const load = useCallback(async (page = 1) => {
    set((s) => ({ ...s, loading: true, error: "" }));
    try {
      const data = await listFiles({ ...filters, page, limit: pageSize });
      set({
        items: data.items,
        total: data.total,
        page: data.page,
        limit: data.limit,
        loading: false,
        error: "",
      });
    } catch (e) {
      set((s) => ({ ...s, loading: false, error: e.message || "Load failed" }));
    }
  }, [filters, pageSize]);

  // ✅ deps chỉ còn `load`
  useEffect(() => {
    load(1);
  }, [load]);

  return { ...state, reload: load };
}
