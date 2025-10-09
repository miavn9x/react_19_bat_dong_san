//frontend/src/modules/admin/upload/hooks/useAdminUploads.js
// Hook quản lý upload trong admin

/** Hook quản lý upload trong admin */

import { useCallback, useEffect,  useRef, useState } from "react";
import { listFiles, uploadMany, updateMeta, replaceFile, deleteFile, getUploadLimit } from "../services/adminUploads.service";

/** Hook list/paginate */
export function useAdminUploadList({ filters, pageSize = 16 }) {
  const [state, set] = useState({ items: [], total: 0, page: 1, limit: pageSize, loading: false, error: "" });

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

/** Hook upload nhiều với tiến trình + queue theo batch để giảm lag */
export function useAdminUploadMany({ bucket, batchSize = 8 } = {}) {
  const [progress, setProgress] = useState(0); // % của batch hiện tại
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef(null);

  const run = useCallback(async ({ files, group = "", startOrder = 0, labels = [], orders = [] }) => {
    setError(""); setBusy(true); setProgress(0);
    const all = Array.from(files);
    const results = [];
    let cursor = 0;
    let orderCursor = startOrder;

    // Chia nhỏ theo batch để giảm spike I/O, vẫn giữ thứ tự chung
    while (cursor < all.length) {
      const batch = all.slice(cursor, cursor + batchSize);
      const batchOrders = orders.slice(cursor, cursor + batchSize);
      const batchLabels = labels.slice(cursor, cursor + batchSize);

      const ac = new AbortController();
      abortRef.current = ac;

      const resp = await uploadMany({
        bucket,
        files: batch,
        group,
        startOrder: orderCursor,
        labels: batchLabels,
        orders: batchOrders,
        onProgress: (p) => setProgress(p),
        signal: ac.signal,
      });
      results.push(...resp.items);

      orderCursor += batch.length;
      cursor += batch.length;
    }

    setBusy(false);
    setProgress(100);
    return results;
  }, [bucket, batchSize, setProgress]);

  const cancel = useCallback(() => {
    abortRef.current?.abort?.();
  }, []);

  return { upload: run, progress, busy, error, cancel, setProgress, setError };
}

/** Hook admin patch/replace/delete */
export function useAdminCrud() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const runUpdate = async ({ id, patch }) => {
    setBusy(true); setError("");
    try { return await updateMeta({ id, patch }); }
    catch (e) { setError(e.message || "Update failed"); throw e; }
    finally { setBusy(false); }
  };

  const runReplace = async ({ id, bucket, file, onProgress, signal }) => {
    setBusy(true); setError("");
    try { return await replaceFile({ id, bucket, file, onProgress, signal }); }
    catch (e) { setError(e.message || "Replace failed"); throw e; }
    finally { setBusy(false); }
  };

  const runDelete = async ({ id }) => {
    setBusy(true); setError("");
    try { return await deleteFile({ id }); }
    catch (e) { setError(e.message || "Delete failed"); throw e; }
    finally { setBusy(false); }
  };

  return { busy, error, update: runUpdate, replace: runReplace, remove: runDelete };
}

/** Hook lấy limit theo bucket (để validate trước khi chọn file) */
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
