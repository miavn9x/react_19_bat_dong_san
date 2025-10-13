import { useCallback, useEffect, useState } from "react";
import { listFiles, deleteFile, updateMeta } from "../../upload/services/adminUploads.service";
import { toFileURL } from "../../upload/config/api";
import UploadDropzone from "../../upload/components/UploadDropzone";
import { useAdminUploadMany } from "../../upload/hooks/useAdminUploads";
import { setCover } from "../services/adminPosts.service";

export default function CoverSectionInline({ post, onChanged, autoSetCoverWhenEmpty = true }) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const { upload, progress, busy } = useAdminUploadMany({ bucket: "images", batchSize: 6 });

  const group = post?.galleryGroup || (post?._id ? `post:${post._id}` : "");
  const limit = 12;

  const load = useCallback(
    async (p = 1) => {
      if (!post?._id) return;
      setLoading(true);
      try {
        const data = await listFiles({
          bucket: "images",
          group,
          page: p,
          limit,
          sort: "order_asc",
        });
        setItems(data.items || []);
        setTotal(data.total || 0);
        setPage(data.page || p);
      } finally {
        setLoading(false);
      }
    },
    [post?._id, group]
  );

  useEffect(() => { load(1); }, [load]);

  const pages = Math.max(1, Math.ceil(total / limit));

  const replaceCover = async (file) => {
    if (!post?._id || !file) return;
    const newFile = (await upload({ files: [file], bucket: "images", group })).at(0);
    if (!newFile?._id) return;

    const oldId = post.coverFile?._id;
    await setCover(post._id, newFile._id);

    // chuyển meta newFile về đầu
    try { await updateMeta({ id: newFile._id, patch: { group, order: 0 } }); } catch (e) { void e; }

    if (oldId && oldId !== newFile._id) {
      try { await deleteFile({ id: oldId }); } catch (e) { void e; }
    }
    await load(1);
    onChanged?.();
  };

  const isCover = (f) => post?.coverFile?._id && post.coverFile._id === f._id;

  return (
    <div className="space-y-4">
      {/* Thay ảnh bìa (1 hình, xoá cũ) */}
      <div className="rounded-xl border p-3">
        <div className="text-sm font-medium mb-2">Thay ảnh bìa (1 hình)</div>
        <UploadDropzone
          multiple={false}
          accept="image/*"
          onSelect={async (files) => {
            const f = files?.[0];
            if (f) await replaceCover(f);
          }}
        />
        {busy && <div className="text-sm text-gray-600 mt-1">Đang tải... {progress}%</div>}
      </div>

      {/* Thêm ảnh vào gallery */}
      <div className="rounded-xl border p-3">
        <div className="text-sm font-medium mb-2">Thêm ảnh vào gallery</div>
        <UploadDropzone
          multiple
          accept="image/*"
          onSelect={async (files) => {
            const inserted = await upload({ files, bucket: "images", group });
            if (inserted?.length >= 0) {
              if (autoSetCoverWhenEmpty && !post?.coverFile && inserted[0]?._id) {
                try { await setCover(post._id, inserted[0]._id); } catch (e) { void e; }
              }
              await load(1);
              onChanged?.();
            }
          }}
        />
      </div>

      {/* Danh sách ảnh */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map((f) => (
          <div key={f._id} className="rounded-xl overflow-hidden border">
            <img src={toFileURL(f.url)} alt={f.label || f.originalName} className="w-full h-36 object-cover" />
            <div className="p-2 flex items-center justify-between gap-2">
              <div className="text-xs line-clamp-1">{f.label || f.originalName}</div>

              {isCover(f) ? (
                <span className="px-2 py-1 rounded bg-gray-200 text-gray-700 text-xs cursor-default">
                  Đang là bìa
                </span>
              ) : (
                <button
                  className="px-2 py-1 rounded bg-indigo-600 text-white text-xs hover:bg-indigo-700"
                  onClick={async () => {
                    const oldId = post.coverFile?._id;
                    await setCover(post._id, f._id);
                    if (oldId && oldId !== f._id) {
                      try { await deleteFile({ id: oldId }); } catch (e) { void e; }
                    }
                    await onChanged?.();
                  }}
                  title="Đặt làm ảnh bìa"
                >
                  Đặt bìa
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {loading && <div className="text-center py-3 text-sm text-gray-500">Đang tải...</div>}
      {!loading && items.length === 0 && (
        <div className="text-center py-3 text-sm text-gray-500">Chưa có ảnh</div>
      )}

      {total > limit && (
        <div className="flex items-center justify-between pt-1 text-sm text-gray-600">
          <div>Tổng: {total}</div>
          <div className="inline-flex items-center gap-2">
            <button
              onClick={() => load(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="px-2 py-1 rounded border disabled:opacity-50"
            >
              ← Trước
            </button>
            <span>Trang {page} / {pages}</span>
            <button
              onClick={() => load(Math.min(pages, page + 1))}
              disabled={page >= pages}
              className="px-2 py-1 rounded border disabled:opacity-50"
            >
              Sau →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
