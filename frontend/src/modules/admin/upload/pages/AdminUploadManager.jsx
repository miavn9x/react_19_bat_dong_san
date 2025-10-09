// // // //frontend/src/modules/admin/upload/pages/AdminUploadManager.jsx

/** Admin Upload Manager */
import { useMemo, useRef, useState, useEffect } from "react";
import {
  useAdminCrud,
  useAdminUploadList,
  // useUploadLimit,
} from "../hooks/useAdminUploads";
import ProgressBar from "../components/ProgressBar";
import MediaViewer from "../components/MediaViewer";

export default function AdminUploadManager() {
  const [bucket, setBucket] = useState("images");
  const [group, setGroup] = useState("");
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState({
    bucket: "images",
    group: "",
    q: "",
  });

  const { items, total, page, limit, loading, error, reload } =
    useAdminUploadList({ filters, pageSize: 24 });

  // const { limit: maxBytes } = useUploadLimit(bucket);

  const accept = useMemo(
    () =>
      bucket === "images"
        ? "image/*"
        : bucket === "videos"
        ? "video/*"
        : "audio/*",
    [bucket]
  );

  // ===== Scroll-to-top helpers =====
  const topRef = useRef(null);
  const scrollToTop = () => {
    // Ưu tiên cuộn tới main header; fallback cuộn cả cửa sổ
    if (topRef.current?.scrollIntoView) {
      try {
        topRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      } catch {
        // ignore
      }
    }
    if (typeof window !== "undefined") {
      try {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch {
        // ignore
      }
    }
  };

  // Khi trang thay đổi (do gọi reload), tự cuộn lên đầu
  useEffect(() => {
    scrollToTop();
  }, [page]);

  const onChangeBucket = (bk) => {
    setBucket(bk);
    setFilters((f) => ({ ...f, bucket: bk }));
    reload(1);
    scrollToTop();
  };

  const onApplyGroup = () => {
    setFilters((f) => ({ ...f, group: group.trim() }));
    reload(1);
    scrollToTop();
  };

  const searchTimerRef = useRef(null);
  const onSearch = (e) => {
    const v = e.target.value;
    setQ(v);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setFilters((f) => ({ ...f, q: v.trim() }));
      reload(1);
      scrollToTop();
    }, 300);
  };

  return (
    // ====== Layout gốc: đẩy footer xuống đáy ======
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Anchor để scrollToTop */}
      <div ref={topRef} aria-hidden="true" />

      {/* Nội dung chính */}
      <main className="mx-auto flex-1 p-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 tracking-tight">
              Thư viện Media
            </h2>
            <p className="text-sm text-gray-600">
              Quản lý hình ảnh, video và audio. Thay file, chỉnh sửa meta hoặc xóa.
            </p>
          </div>

          {/* Bucket Tabs */}
          <div className="inline-flex rounded-xl bg-white shadow-sm border border-gray-200 overflow-hidden">
            {["images", "videos", "audios"].map((bk) => (
              <button
                key={bk}
                type="button"
                aria-label={`Chọn bucket ${bk}`}
                className={`px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  bucket === bk
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => onChangeBucket(bk)}
              >
                {bk.charAt(0).toUpperCase() + bk.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Toolbar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 bg-white p-4 rounded-lg shadow-sm mt-4">
          {/* Group Filter */}
          <div className="flex items-center gap-2 flex-nowrap">
            <input
              className="flex-1 min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              placeholder="Lọc theo group (vd: post:6612...)"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onApplyGroup()}
              aria-label="Lọc theo group"
            />
            <button
              type="button"
              className="flex-shrink-0 rounded-lg bg-indigo-600 text-white px-4 py-2 text-sm hover:bg-indigo-700 transition disabled:opacity-50"
              onClick={onApplyGroup}
              disabled={!group.trim()}
            >
              Áp dụng
            </button>
          </div>

          {/* Search Bar */}
          <div className="lg:col-span-2 space-y-2">
            <div className="relative">
              <input
                type="search"
                value={q}
                onChange={onSearch}
                placeholder="Tìm theo tên, loại MIME..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 pl-10 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                aria-label="Tìm kiếm media"
              />
              <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 21l-4.35-4.35M10 18a8 8 0 110-16 8 8 0 010 16z" />
                </svg>
              </span>
            </div>
            {/* Giới hạn bucket nếu cần hiển thị */}
            {/* {typeof maxBytes === "number" && (
              <p className="text-xs text-gray-500">
                Giới hạn bucket <span className="font-medium">{bucket}</span>:{" "}
                {(maxBytes / (1024 * 1024)).toFixed(0)} MB/file
              </p>
            )} */}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm mt-4">
            {error}
          </div>
        )}

        {/* Content */}
        <div className="mt-4">
          {loading ? (
            <SkeletonGrid />
          ) : items.length === 0 ? (
            <EmptyState
              onReset={() => {
                setGroup("");
                setQ("");
                setFilters({ bucket });
                reload(1);
                scrollToTop();
              }}
            />
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {items.map((it) => (
                <MediaCard
                  key={it._id}
                  file={it}
                  accept={accept}
                  onChanged={() => {
                    reload(page);
                    scrollToTop();
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ====== Footer phân trang: luôn nằm dưới chân trang ====== */}
      <FooterPagination
        total={total}
        page={page}
        limit={limit}
        onPrev={() => {
          scrollToTop();
          reload(page - 1);
        }}
        onNext={() => {
          scrollToTop();
          reload(page + 1);
        }}
        canPrev={page > 1}
        canNext={page * limit < total}
      />
    </div>
  );
}

/* ========= Footer Pagination ========= */
function FooterPagination({ total, page,  onPrev, onNext, canPrev, canNext }) {
  return (
    <footer className="border-t bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          <p className="text-sm text-gray-600">
            Tổng <span className="font-medium">{total}</span> mục
          </p>
          <div className="flex items-center gap-3">
            <button
              className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition text-sm font-medium"
              disabled={!canPrev}
              onClick={onPrev}
            >
              Trước
            </button>
            <span className="text-sm text-gray-600">Trang {Math.max(1, page)}</span>
            <button
              className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition text-sm font-medium"
              disabled={!canNext}
              onClick={onNext}
            >
              Sau
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ========= Cards & Rows ========= */
function MediaCard({ file, accept, onChanged }) {
  return (
    <div
      tabIndex={0}
      className="group rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-indigo-500"
      aria-label={`Media ${file.originalName}`}
    >
      {/* Preview */}
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
        <MediaViewer url={file.url} type={file.type} />
        <BadgeType type={file.type} />
      </div>

      {/* Meta */}
      <div className="p-4 space-y-1.5 text-sm">
        <div className="font-semibold text-gray-800 truncate" title={file.originalName}>
          {file.originalName}
        </div>
        <div className="text-gray-600 flex items-center gap-2">
          <span className="truncate">{file.bucket}</span>
          <span>•</span>
          <span className="truncate">{file.type}</span>
        </div>
        <div className="text-gray-600">
          {file.year}-{String(file.month).padStart(2, "0")}-{String(file.day).padStart(2, "0")}
        </div>
        {file.group && (
          <div className="truncate text-gray-600" title={file.group}>
            Group: {file.group}
          </div>
        )}
        {Number.isFinite(file.order) && <div className="text-gray-600">Order: {file.order}</div>}
        {file.label && (
          <div className="truncate text-gray-600" title={file.label}>
            Label: {file.label}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="border-t p-4">
        <AdminRow file={file} accept={accept} onChanged={onChanged} />
      </div>
    </div>
  );
}

function BadgeType({ type }) {
  const label =
    type?.startsWith("image/") ? "IMAGE" :
    type?.startsWith("video/") ? "VIDEO" :
    type?.startsWith("audio/") ? "AUDIO" : "FILE";
  return (
    <span className="absolute top-3 left-3 px-2 py-1 text-xs font-semibold rounded-full bg-black/70 text-white tracking-wide">
      {label}
    </span>
  );
}

function AdminRow({ file, onChanged, accept }) {
  const { update, replace, remove } = useAdminCrud();
  const [label, setLabel] = useState(file.label || "");
  const [order, setOrder] = useState(file.order || 0);
  const [group, setGroup] = useState(file.group || "");
  const [busy, setBusy] = useState(false);
  const [p, setP] = useState(0);

  const doUpdate = async () => {
    setBusy(true);
    await update({ id: file._id, patch: { label, group, order: Number(order) } });
    setBusy(false);
    onChanged?.();
  };

  const doReplace = async (e) => {
    const nf = e.target.files?.[0]; if (!nf) return;
    setBusy(true);
    await replace({ id: file._id, bucket: file.bucket, file: nf, onProgress: (x) => setP(x) });
    setBusy(false);
    setP(0);
    onChanged?.();
  };

  const doDelete = async () => {
    if (!confirm("Xóa file này?")) return;
    setBusy(true);
    await remove({ id: file._id });
    setBusy(false);
    onChanged?.();
  };

  return (
    <div className="space-y-3">
      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label"
          aria-label="Nhập label cho file"
        />
        <input
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          value={group}
          onChange={(e) => setGroup(e.target.value)}
          placeholder="Group"
          aria-label="Nhập group cho file"
        />
        <input
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          value={order}
          onChange={(e) => setOrder(e.target.value)}
          type="number"
          placeholder="Order"
          aria-label="Nhập order cho file"
        />
      </div>

      {/* Actions */}
      <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
        {/* Lưu */}
        <button
          type="button"
          title="Lưu"
          aria-label="Lưu meta"
          onClick={doUpdate}
          disabled={busy}
          className="inline-flex items-center justify-center h-10 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 3h10l4 4v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
            <path d="M7 7h8v6H7z" />
            <path d="M12 17a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
          </svg>
        </button>

        {/* Thay file */}
        <label
          title="Thay file"
          aria-label="Thay file"
          className="inline-flex items-center justify-center h-10 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 cursor-pointer transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 16v2a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3v-2" />
            <path d="M8 12l4-4 4 4" />
            <path d="M12 16V8" />
          </svg>
          <input type="file" accept={accept} hidden onChange={doReplace} />
        </label>

        {/* Xóa */}
        <button
          type="button"
          title="Xóa file"
          aria-label="Xóa file"
          onClick={doDelete}
          disabled={busy}
          className="inline-flex items-center justify-center h-10 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 disabled:opacity-50 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>

      {p > 0 && <ProgressBar value={p} />}
    </div>
  );
}

/* ========= Skeleton & Empty ========= */
function SkeletonGrid() {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-xl bg-white border border-gray-200 shadow-sm">
          <div className="animate-pulse bg-gray-100 aspect-[4/3]" />
          <div className="p-4 space-y-2">
            <div className="animate-pulse h-4 bg-gray-100 rounded w-3/4" />
            <div className="animate-pulse h-3 bg-gray-100 rounded w-1/2" />
            <div className="animate-pulse h-3 bg-gray-100 rounded w-2/3" />
          </div>
          <div className="border-t p-4">
            <div className="animate-pulse h-9 bg-gray-100 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onReset }) {
  return (
    <div className="border rounded-xl bg-white p-6 sm:p-8 text-center shadow-sm">
      <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
        <svg width="24" height="24" viewBox="0 0 24 24" className="text-gray-500" fill="currentColor">
          <path d="M21 19V5H3v14zm0 2H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h18a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2M8 11l2.03 2.71L12 12l4 5H8z" />
        </svg>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-800">Không có media phù hợp</h3>
      <p className="mt-2 text-sm text-gray-600">Điều chỉnh bộ lọc (bucket, group, từ khóa) để tìm lại.</p>
      <button
        type="button"
        onClick={onReset}
        className="mt-4 inline-flex items-center rounded-lg px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 text-sm font-medium"
      >
        Đặt lại bộ lọc
      </button>
    </div>
  );
}
