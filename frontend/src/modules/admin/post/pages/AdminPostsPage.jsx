// frontend/src/modules/admin/post/pages/AdminPostsPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PostTable from "../components/PostTable";
import { usePostCrud, usePostList } from "../hooks/useAdminPosts";
import { getPostBySlug } from "../services/adminPosts.service";
import { listFiles, deleteFile } from "../../upload/services/adminUploads.service";

const STATUS_TABS = [
  { value: "draft", label: "Chưa duyệt" },
  { value: "published", label: "Đã duyệt" },
  { value: "archived", label: "Ẩn" },
];

const VIEW_TABS = [
  { value: "all", label: "Toàn bộ" },
  { value: "admin", label: "Bài Admin" },
  { value: "user", label: "Bài User" },
];

function useDebouncedValue(value, delay = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

function ConfirmDeleteModal({ open, onClose, onConfirmOnlyPost, onConfirmWithMedia, postTitle = "" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full sm:w-[520px] bg-white rounded-t-2xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold">Xoá bài viết</h3>
        <p className="mt-1 text-sm text-gray-600">Bạn sắp xoá bài: <b>{postTitle || "—"}</b></p>

        <div className="mt-4 space-y-3">
          <button onClick={onConfirmOnlyPost} className="w-full text-left rounded-lg border px-3 py-2 hover:bg-gray-50">
            <div className="font-medium text-sm">Chỉ xoá bài viết</div>
            <div className="text-xs text-gray-600">Bài viết sẽ bị xoá, <b>không</b> xoá ảnh/video/audio liên quan.</div>
          </button>
          <button onClick={onConfirmWithMedia} className="w-full text-left rounded-lg border px-3 py-2 hover:bg-red-50">
            <div className="font-medium text-sm text-red-700">Xoá bài + toàn bộ media</div>
            <div className="text-xs text-red-600">
              Xoá bài viết và <b>mọi</b> file trong group <code>post:&lt;id&gt;</code>.
            </div>
          </button>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 rounded-lg border hover:bg-gray-50 text-sm">Huỷ</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPostsPage() {
  const nav = useNavigate();

  const [status, setStatus] = useState("draft");
  const [view, setView] = useState("all");
  const [qRaw, setQRaw] = useState("");
  const q = useDebouncedValue(qRaw, 350);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const filters = useMemo(() => ({ q, owner: view === "all" ? "" : view }), [q, view]);

  const { items, total, page, limit, loading, error, reload } = usePostList({
    status,
    pageSize: 12,
    filters,
  });

  const { remove, changeStatus } = usePostCrud();

  const onCreate = () => nav("/admin/posts/new");
  const onEdit = (p) => nav(`/admin/posts/${encodeURIComponent(p.slug)}/edit`);
  const onSetCover = (p) => nav(`/admin/posts/${encodeURIComponent(p.slug)}/edit#cover`);
  const onAskDelete = (p) => setDeleteTarget(p);

  /** ✅ NEW: handler đổi trạng thái */
  const onChangeStatus = async (p, nextStatus) => {
    try {
      await changeStatus(p, nextStatus);
      reload(page);
    } catch (e) {
      alert(e.message || "Cập nhật trạng thái thất bại");
    }
  };

  const confirmDeleteOnlyPost = async () => {
    const p = deleteTarget;
    if (!p?._id) return;
    setDeleting(true);
    try {
      await remove(p._id);
      setDeleteTarget(null);
      reload(page);
    } catch (e) {
      alert(e.message || "Xoá thất bại");
    } finally {
      setDeleting(false);
    }
  };

  const confirmDeleteWithMedia = async () => {
    const p = deleteTarget;
    if (!p) return;
    setDeleting(true);
    try {
      const doc = await getPostBySlug(p.slug, { includeGallery: true });
      const postId = doc?._id || p._id;
      const group = doc?.galleryGroup || `post:${postId}`;

      try {
        const list = await listFiles({ group, page: 1, limit: 1000, sort: "-order" });
        const files = list?.items || [];
        for (const f of files) {
          try { await deleteFile({ id: f._id }); } catch { /* ignore */ }
        }
      } catch { /* ignore nếu BE chưa hỗ trợ group */ }

      if (doc?.coverFile?._id) {
        try { await deleteFile({ id: doc.coverFile._id }); } catch { /* ignore */ }
      }

      await remove(postId);
      setDeleteTarget(null);
      reload(page);
    } catch (e) {
      alert(e.message || "Xoá thất bại");
    } finally {
      setDeleting(false);
    }
  };

  const resetFilters = () => {
    setStatus("draft");
    setView("all");
    setQRaw("");
  };

  return (
    <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-lg sm:text-xl font-semibold">Bài viết</h1>
          <span className="text-xs sm:text-sm text-gray-500">Tổng: {total}</span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFiltersOpen((s) => !s)}
            className="sm:hidden w-full inline-flex justify-center items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
            aria-expanded={filtersOpen}
            aria-controls="post-filters"
            title="Mở bộ lọc"
          >
            <svg className="h-5 w-5 text-gray-600" viewBox="0 0 24 24" fill="none">
              <path d="M3 5h18M6 12h12M10 19h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Bộ lọc
          </button>
          <button
            onClick={onCreate}
            className="w-full sm:w-auto inline-flex justify-center rounded-lg bg-indigo-600 text-white px-3 py-2 text-sm hover:bg-indigo-700"
          >
            Tạo bài viết
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div
        id="post-filters"
        className={`rounded-xl border bg-white p-3 sm:p-4 space-y-3 transition-all ${filtersOpen ? "block" : "hidden sm:block"}`}
      >
        {/* Owner chips */}
        <div className="space-y-2">
          <span className="text-sm text-gray-600">Phạm vi</span>
          <div className="overflow-x-auto no-scrollbar -mx-1 px-1">
            <div className="flex gap-2 min-w-max snap-x">
              {VIEW_TABS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setView(t.value)}
                  className={`snap-start px-3 py-1.5 rounded-full text-sm border transition ${
                    view === t.value ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" : "bg-gray-50 text-gray-700 hover:bg-white"
                  }`}
                  title={t.label}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search + Reset */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <div className="relative flex-1">
            <input
              value={qRaw}
              onChange={(e) => setQRaw(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); reload(1); }
              }}
              placeholder="Tìm tiêu đề / slug / tác giả... (tag:seo  category:tai-lieu  author:6520fa...)"
              className="w-full pl-9 pr-9 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Tìm kiếm bài viết"
            />
            <svg className="absolute left-2.5 top-2.5 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M12.9 14.32a8 8 0 111.414-1.414l3.387 3.387a1 1 0 01-1.414 1.414l-3.387-3.387zM14 8a6 6 0 11-12 0 6 6 0 0112 0z" clipRule="evenodd" />
            </svg>
            {qRaw && (
              <button className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600" onClick={() => setQRaw("")} title="Xoá tìm kiếm" aria-label="Xoá nội dung tìm kiếm">
                ✕
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={resetFilters} className="flex-1 sm:flex-none inline-flex justify-center rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">
              Đặt lại
            </button>
          </div>
        </div>

        {/* Status chips */}
        <div className="space-y-2">
          <span className="text-sm text-gray-600">Trạng thái</span>
          <div className="overflow-x-auto no-scrollbar -mx-1 px-1">
            <div className="flex gap-2 min-w-max snap-x">
              {STATUS_TABS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setStatus(t.value)}
                  className={`snap-start px-3 py-1.5 rounded-full text-sm border transition ${
                    status === t.value ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" : "bg-gray-50 text-gray-700 hover:bg-white"
                  }`}
                  title={t.label}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tổng số (mobile) */}
        <div className="text-sm sm:hidden">
          <span className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-gray-100 text-gray-700">
            <span className="h-2 w-2 rounded-full bg-indigo-600"></span>
            Tổng: <b>{total}</b>
          </span>
        </div>
      </div>

      {/* States */}
      {loading && <div className="text-sm text-gray-500">Đang tải...</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      {/* Table */}
      <div className="space-y-2">
        <div className="sm:hidden text-xs text-gray-500">💡 Bảng rộng — hãy <b>kéo ngang</b> để xem đủ thông tin.</div>
        <PostTable
          rows={items}
          page={page}
          total={total}
          limit={limit}
          onEdit={onEdit}
          onDelete={onAskDelete}
          onSetCover={onSetCover}
          onChangeStatus={onChangeStatus}  // ✅ truyền xuống
        />
      </div>

      {/* Modal xoá */}
      <ConfirmDeleteModal
        open={!!deleteTarget}
        postTitle={deleteTarget?.title}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirmOnlyPost={deleting ? undefined : confirmDeleteOnlyPost}
        onConfirmWithMedia={deleting ? undefined : confirmDeleteWithMedia}
      />
    </div>
  );
}
