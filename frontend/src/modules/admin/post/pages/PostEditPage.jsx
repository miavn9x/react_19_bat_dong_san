// frontend/src/modules/admin/post/pages/PostEditPage.jsx
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PostForm from "../components/PostForm";
import { getPostBySlug, updatePost, setCover } from "../services/adminPosts.service";
import { toFileURL } from "../../upload/config/api";
import UploadDropzone from "../../upload/components/UploadDropzone";
import { useAdminUploadMany } from "../../upload/hooks/useAdminUploads";
import { deleteFile, updateMeta } from "../../upload/services/adminUploads.service";

export default function PostEditPage() {
  const { slug } = useParams();
  const nav = useNavigate();
  const [post, setPost] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const coverRef = useRef(null);

  // uploader cho 1 ảnh bìa
  const { upload, progress, busy: uploading } = useAdminUploadMany({ bucket: "images", batchSize: 1 });

  const load = useCallback(async () => {
    setError("");
    try {
      const doc = await getPostBySlug(slug, { includeGallery: true });
      setPost(doc);
    } catch (e) {
      setError(e.message || "Load failed");
    }
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  const submitForm = async (payload) => {
    if (!post?._id) return;
    setBusy(true); setError("");
    try {
      await updatePost(post._id, payload);
      // Sau khi bấm Lưu → quay về danh sách
      nav("/admin/posts", { replace: true });
    } catch (e) {
      setError(e.message || "Update failed");
    } finally { setBusy(false); }
  };

  // Thay ảnh bìa -> upload ảnh mới -> setCover -> xóa ảnh cũ
  // KHÔNG điều hướng ở đây
  const replaceCover = async (file) => {
    if (!post?._id || !file) return;

    const group = post.galleryGroup || `post:${post._id}`;
    const newDoc = (await upload({ files: [file], bucket: "images", group, startOrder: 0 })).at(0);
    if (!newDoc?._id) return;

    const oldId = post.coverFile?._id;

    await setCover(post._id, newDoc._id);

    // đảm bảo meta ảnh bìa mới đúng group/order
    try { await updateMeta({ id: newDoc._id, patch: { group, order: 0 } }); } catch (e) { void e; }

    // xóa ảnh bìa cũ (nếu khác)
    if (oldId && oldId !== newDoc._id) {
      try { await deleteFile({ id: oldId }); } catch (e) { void e; }
    }

    await load();
  };

  if (!post) {
    return (
      <div className="p-4">
        {error ? <div className="text-sm text-red-600">{error}</div> : <div className="text-sm text-gray-500">Đang tải...</div>}
      </div>
    );
  }

  // ✅ group dành cho editor (media nội dung)
  const contentGroup = post.galleryGroup || `post:${post._id}`;

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Sửa bài viết</h1>
          <div className="text-xs text-gray-500 break-all">/{post.slug}</div>
        </div>
        <Link to="/admin/posts" className="px-3 py-2 rounded-lg border hover:bg-gray-50">← Quay lại danh sách</Link>
      </div>

      {/* Khối thay ảnh bìa: CHỈ 1 Ô NHẬP ẢNH */}
      <section id="cover" ref={coverRef} className="rounded-xl border bg-white p-4 space-y-3">
        <h2 className="text-lg font-semibold">Ảnh bìa</h2>

        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-600">Hiện tại:</div>
          {post.coverFile?.url ? (
            <img src={toFileURL(post.coverFile.url)} alt="cover" className="h-12 w-16 object-cover rounded" />
          ) : (
            <span className="text-xs text-gray-500">Chưa có</span>
          )}
        </div>

        <UploadDropzone
          multiple={false}
          accept="image/*"
          onSelect={async (files) => {
            const f = files?.[0];
            if (f) await replaceCover(f);
          }}
        />
        {uploading && <div className="text-sm text-gray-600">Đang tải ảnh bìa... {progress}%</div>}
      </section>

      {/* Form nội dung */}
      <div className="rounded-xl border bg-white p-4">
        {/* ✅ Truyền uploadGroup để RichEditor upload đúng group & startOrder=1 */}
        <PostForm
          initial={post}
          onSubmit={submitForm}
          onCancel={() => nav(-1)}
          busy={busy}
          uploadGroup={contentGroup}
        />
      </div>
    </div>
  );
}
