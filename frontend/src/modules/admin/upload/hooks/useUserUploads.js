// frontend/src/modules/admin/upload/hooks/useUserUploads.js
/**
 * useUserUploads.js (FIXED)
 * ----------------------------------------------------
 * Fix:
 * 1. Reset progress về 0 trước khi upload mới
 * 2. Upload theo batch để tránh vượt MAX_BATCH (40)
 * 3. Không set progress=100 trong finally (để XHR tự set)
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { listFiles, uploadMany, getUploadLimit } from "../services/userUploads.service";

/** Lấy danh sách file (public endpoint), lọc theo filters */
export function useUserUploadList({ filters, pageSize = 20 }) {
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

  useEffect(() => { load(1); }, [load]);

  return { ...state, reload: load };
}

/** Upload nhiều file với BATCH processing (giống admin) */
export function useUserUploadMany({ bucket, batchSize = 8 } = {}) {
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [rejected, setRejected] = useState([]); // Tích lũy qua các batch
  const abortRef = useRef(null);

  const run = useCallback(async ({ files, group = "", startOrder = 0 }) => {
    // Chuẩn hoá & CHẶN RỖNG
    const arr = Array.from(files || []);
    if (arr.length === 0) {
      setError("Không có file để upload");
      return [];
    }

    // RESET STATE trước khi bắt đầu
    setBusy(true);
    setError("");
    setRejected([]);
    setProgress(0);

    const allItems = [];
    const allErrors = [];
    let cursor = 0;
    let orderCursor = startOrder;

    try {
      // Upload theo BATCH (giống admin)
      while (cursor < arr.length) {
        const batch = arr.slice(cursor, cursor + batchSize);
        const ac = new AbortController();
        abortRef.current = ac;

        const resp = await uploadMany({
          bucket,
          files: batch,
          group,
          startOrder: orderCursor,
          onProgress: (p) => {
            // Tính progress tổng thể
            const completedBatches = cursor;
            const currentBatchProgress = (p / 100) * batch.length;
            const totalProgress = Math.round(
              ((completedBatches + currentBatchProgress) / arr.length) * 100
            );
            setProgress(Math.min(totalProgress, 99)); // Giữ <100 cho đến khi hoàn toàn xong
          },
          signal: ac.signal,
        });

        // Gom kết quả
        if (resp.items) allItems.push(...resp.items);
        if (resp.errors) allErrors.push(...resp.errors);

        orderCursor += batch.length;
        cursor += batch.length;
      }

      // Cập nhật rejected cuối cùng
      if (allErrors.length) setRejected(allErrors);

      return allItems;
    } catch (e) {
      // Xử lý lỗi abort
      if (e?.aborted) {
        setError("Upload đã bị hủy");
      } else {
        const msg = e?.body?.message || e?.message || "Upload failed";
        setError(msg);
      }
      return allItems; // Trả items đã upload được (nếu có)
    } finally {
      setBusy(false);
      setProgress(100); // Chỉ set 100% khi HOÀN TOÀN xong
      abortRef.current = null;
    }
  }, [bucket, batchSize]);

  const cancel = useCallback(() => abortRef.current?.abort?.(), []);
  
  return { 
    upload: run, 
    progress, 
    busy, 
    error, 
    rejected, 
    cancel 
  };
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