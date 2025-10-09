//frontend/src/modules/admin/upload/hooks/useUserUploads.js
// Hook quản lý upload trong user
// Hook quản lý upload trong user (list + upload có % tiến trình)
import { useCallback, useEffect, useRef, useState } from "react";
import { listFiles, uploadMany, getUploadLimit } from "../services/userUploads.service";

/** Lấy danh sách file (public endpoint), lọc theo filters */
export function useUserUploadList({ filters, pageSize = 18 }) {
  const [state, set] = useState({
    items: [],
    total: 0,
    page: 1,
    limit: pageSize,
    loading: false,
    error: "",
  });

  const load = useCallback(async (page = 1) => {
    set((s) => ({ ...s, loading: true, error: "" }));
    try {
      const data = await listFiles({ ...filters, page, limit: pageSize });
      set({ items: data.items, total: data.total, page: data.page, limit: data.limit, loading: false, error: "" });
    } catch (e) {
      set((s) => ({ ...s, loading: false, error: e.message || "Load failed" }));
    }
  }, [filters, pageSize]);

  useEffect(() => { load(1); }, [load]);

  return { ...state, reload: load };
}

/** Upload nhiều file (1 request) với % tiến trình */
export function useUserUploadMany({ bucket } = {}) {
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef(null);

  const run = useCallback(async ({ files, group = "", startOrder = 0 }) => {
    setBusy(true); setError(""); setProgress(0);
    const ac = new AbortController();
    abortRef.current = ac;

    const resp = await uploadMany({
      bucket,
      files,
      group,
      startOrder,
      onProgress: (p) => setProgress(p),
      signal: ac.signal,
    });

    setBusy(false);
    setProgress(100);
    return resp.items;
  }, [bucket]);

  const cancel = useCallback(() => abortRef.current?.abort?.(), []);
  return { upload: run, progress, busy, error, cancel, setProgress, setError };
}

/** Hỏi limit theo bucket (để FE báo trước kích thước) */
export function useUploadLimit(bucket) {
  const [limit, setLimit] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    if (!bucket) return;
    (async () => {
      try {
        const data = await getUploadLimit(bucket);
        if (alive) setLimit(data.maxBytes);
      } catch (e) {
        if (alive) setError(e.message || "Cannot get limit");
      }
    })();
    return () => { alive = false; };
  }, [bucket]);

  return { limit, error };
}
