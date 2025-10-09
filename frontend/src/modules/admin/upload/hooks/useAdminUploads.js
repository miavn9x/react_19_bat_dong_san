/**
 * useAdminUploads.js (FIXED)
 * ----------------------------------------------------
 * Mục đích:
 * - Tập hợp các hook cho trang quản trị upload:
 *   + useAdminUploadList: tải danh sách media (list)
 *   + useAdminUploadMany: upload nhiều file theo batch + % tiến trình
 *   + useAdminCrud: cập nhật meta / thay file / xóa file
 *   + useUploadLimit: hỏi giới hạn byte theo bucket
 *
 * Đồng bộ với BE:
 * - Filter: bucket, group, q, page, limit (≤ 20)
 * - Upload: field "files" (nhiều), "file" (single/replace)
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { listFiles, uploadMany, updateMeta, replaceFile, deleteFile, getUploadLimit } from "../services/adminUploads.service";

/** Hook list/paginate (admin) */
export function useAdminUploadList({ filters, pageSize = 20 }) {
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

/** Hook upload nhiều với tiến trình TỔNG THỂ + queue theo batch */
export function useAdminUploadMany({ bucket, batchSize = 8 } = {}) {
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [rejected, setRejected] = useState([]); // Gom errors từ tất cả batch
  const abortRef = useRef(null);

  const run = useCallback(async ({ files, group = "", startOrder = 0, labels = [], orders = [] }) => {
    // Reset state
    setError("");
    setRejected([]);
    setBusy(true);
    setProgress(0);

    const all = Array.from(files);
    if (all.length === 0) {
      setError("Không có file để upload");
      setBusy(false);
      return [];
    }

    const results = [];
    const allErrors = [];
    let cursor = 0;
    let orderCursor = startOrder;

    try {
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
          onProgress: (batchProgress) => {
            // ✅ Tính progress tổng thể
            const completedFiles = cursor; // Số files đã hoàn thành
            const currentBatchProgress = (batchProgress / 100) * batch.length; // Progress của batch hiện tại
            const totalProgress = Math.round(
              ((completedFiles + currentBatchProgress) / all.length) * 100
            );
            setProgress(Math.min(totalProgress, 99)); // Giữ <100 đến khi hoàn toàn xong
          },
          signal: ac.signal,
        });

        // Gom kết quả
        if (resp.items) results.push(...resp.items);
        if (resp.errors) allErrors.push(...resp.errors);

        orderCursor += batch.length;
        cursor += batch.length;
      }

      // Cập nhật rejected cuối cùng
      if (allErrors.length) setRejected(allErrors);

      return results;
    } catch (e) {
      if (e?.aborted) {
        setError("Upload đã bị hủy");
      } else {
        const msg = e?.body?.message || e?.message || "Upload failed";
        setError(msg);
      }
      return results; // Trả items đã upload được
    } finally {
      setBusy(false);
      setProgress(100); // Chỉ set 100% khi hoàn toàn xong
      abortRef.current = null;
    }
  }, [bucket, batchSize]);

  const cancel = useCallback(() => { abortRef.current?.abort?.(); }, []);

  return { upload: run, progress, busy, error, rejected, cancel };
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