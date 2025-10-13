// frontend/src/modules/admin/post/pages/PostCreatePage.jsx
import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PostForm from "../components/PostForm";
import CoverRequiredUploader from "../components/CoverRequiredUploader";
import { usePostCrud } from "../hooks/useAdminPosts";
import { setCover } from "../services/adminPosts.service";
import { listFiles, updateMeta } from "../../upload/services/adminUploads.service";

function makeTempGroup() {
  const n = Math.random().toString(36).slice(2, 8);
  const t = Date.now().toString(36);
  return `temp:post-content:${t}-${n}`;
}

export default function PostCreatePage() {
  const nav = useNavigate();
  const { busy, create } = usePostCrud();
  const [error, setError] = useState("");
  const [coverFile, setCoverFile] = useState(null);
  const coverRef = useRef(null);

  // ✅ temp group cho nội dung khi chưa có _id
  const [contentTempGroup] = useState(() => makeTempGroup());

  const submitForm = async (payload) => {
    setError("");
    try {
      if (!coverFile?._id) {
        setError("Vui lòng thêm 1 ảnh bìa trước khi tạo bài viết.");
        coverRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      // 1) Tạo bài viết
      const doc = await create(payload); // {_id, slug}

      // 2) Đặt ảnh bìa (order=0) + chuyển group ảnh bìa về post:<id>
      await setCover(doc._id, coverFile._id);
      try {
        await updateMeta({ id: coverFile._id, patch: { group: `post:${doc._id}`, order: 0 } });
      } catch (e) { void e; }

      // 3) Chuyển tất cả media của nội dung (đang ở temp group) sang post:<id> và sắp order từ 1
      const moveAll = async (bucket, startOrder = 1) => {
        const data = await listFiles({ bucket, group: contentTempGroup, page: 1, limit: 200, sort: "order_asc" });
        let order = startOrder;
        for (const f of (data.items || [])) {
          try { await updateMeta({ id: f._id, patch: { group: `post:${doc._id}`, order } }); } catch (e) { void e; }
          order += 1;
        }
        return order;
      };
      let next = await moveAll("images", 1);
      next = await moveAll("videos", next);
      await moveAll("audios", next);

      // 4) Quay về danh sách
      nav("/admin/posts", { replace: true });
    } catch (e) {
      setError(e.message || "Create failed");
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Tạo bài viết</h1>
        <Link to="/admin/posts" className="px-3 py-2 rounded-lg border hover:bg-gray-50">← Quay lại danh sách</Link>
      </div>

      {error && <div className="text-sm text-rose-600">{error}</div>}

      {/* Bước 1: Ảnh bìa bắt buộc */}
      <section ref={coverRef} className="rounded-xl border bg-white p-4">
        <h2 className="text-lg font-semibold mb-2">Ảnh bìa (bắt buộc 1 hình)</h2>
        <CoverRequiredUploader onChange={setCoverFile} />
        {!coverFile && <div className="text-xs text-rose-600 mt-1">Chưa có ảnh bìa.</div>}
      </section>

      {/* Bước 2: Nội dung bài viết */}
      <section className="rounded-xl border bg-white p-4">
        {/* ✅ truyền temp group để RichEditor upload đúng group (startOrder=1) khi chưa có _id */}
        <PostForm
          initial={null}
          onSubmit={submitForm}
          onCancel={() => nav(-1)}
          busy={busy}
          submitDisabled={!coverFile}
          uploadGroup={contentTempGroup}
        />
      </section>
    </div>
  );
}
