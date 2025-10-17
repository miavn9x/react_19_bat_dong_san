
// import { useRef, useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { useUserPostCrud } from "../../post/hooks/useUserPosts";
// import { setCover as setCoverApi } from "../../post/services/userPosts.service";
// import { listFiles, updateMeta } from "../../../admin/upload/services/userUploads.service";
// import useMyQuota from "../../billing/hooks/useMyQuota";
// import UserCoverRequiredUploader from "../components/UserCoverRequiredUploader";
// import QuotaGate from "../components/QuotaGate";

// // ⚙️ tạo group tạm cho content khi chưa có _id
// function makeTempGroup() {
//   const n = Math.random().toString(36).slice(2, 8);
//   const t = Date.now().toString(36);
//   return `temp:post-content:${t}-${n}`;
// }

// export default function UserPostCreatePage() {
//   const nav = useNavigate();
//   const { busy, create } = useUserPostCrud();
//   const [error, setError] = useState("");
//   const [coverFile, setCoverFile] = useState(null);
//   const coverRef = useRef(null);
//   const [contentTempGroup] = useState(() => makeTempGroup());
//   const { remaining, loading: quotaLoading } = useMyQuota();

//   const submitForm = async (payload) => {
//     setError("");
//     try {
//       if (!coverFile?._id) {
//         setError("Vui lòng thêm 1 ảnh bìa trước khi tạo bài viết.");
//         coverRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
//         return;
//       }

//       // 1) Tạo bài (USER) – BE sẽ set status 'draft' / 'pending' tuỳ kind
//       const doc = await create(payload); // {_id, slug}

//       // 2) Đặt ảnh bìa (order=0) + (thử) chuyển group ảnh bìa về post:<id>
//       await setCoverApi(doc._id, coverFile._id);
//       try {
//         await updateMeta({ id: coverFile._id, patch: { group: `post:${doc._id}`, order: 0 } });
//       } catch  {
//         // Nếu BE chặn PATCH của user => bỏ qua, không làm hỏng flow
//         // (ảnh bìa vẫn hoạt động vì setCover đã liên kết qua postId)
//       }

//       // 3) (Thử) chuyển media trong nội dung từ temp -> post:<id> (nếu quyền cho phép)
//       const moveAll = async (bucket, startOrder = 1) => {
//         try {
//           const data = await listFiles({ bucket, group: contentTempGroup, page: 1, limit: 200, sort: "order_asc" });
//           let order = startOrder;
//           for (const f of (data.items || [])) {
//             try { await updateMeta({ id: f._id, patch: { group: `post:${doc._id}`, order } }); } catch { /* ignore */ }
//             order += 1;
//           }
//         } catch { /* ignore */ }
//       };
//       await moveAll("images", 1);
//       await moveAll("videos", 100000); // tách order dải khác (tuỳ bạn)
//       await moveAll("audios", 200000);

//       // 4) Về danh sách của tôi
//       nav("/me/posts", { replace: true });
//     } catch (e) {
//       setError(e.message || "Create failed");
//     }
//   };

//   // Nếu quota chưa tải xong hoặc đang 0 → hiện gate
//   const quotaExhausted = !quotaLoading && Number(remaining || 0) <= 0;

//   // Bạn đang dùng PostForm bên admin – có thể tái sử dụng:
//   // import PostForm from "../../../admin/post/components/PostForm";
//   // Ở đây, để tránh phụ thuộc, mình assume bạn đã có <PostForm ... /> giống admin.

//   return (
//     <div className="p-4 space-y-6">
//       <div className="flex items-center justify-between">
//         <h1 className="text-xl font-semibold">Đăng bài BĐS</h1>
//         <Link to="/me/posts" className="px-3 py-2 rounded-lg border hover:bg-gray-50">← Bài của tôi</Link>
//       </div>

//       {error && <div className="text-sm text-rose-600">{error}</div>}

//       {quotaExhausted && <QuotaGate remaining={remaining} onCreatedOrder={() => window.location.reload()} />}

//       {/* Bước 1: Ảnh bìa bắt buộc */}
//       <section ref={coverRef} className={`rounded-xl border bg-white p-4 ${quotaExhausted ? "opacity-60 pointer-events-none" : ""}`}>
//         <h2 className="text-lg font-semibold mb-2">Ảnh bìa (bắt buộc 1 hình)</h2>
//         <UserCoverRequiredUploader onChange={setCoverFile} group={contentTempGroup} />
//         {!coverFile && <div className="text-xs text-rose-600 mt-1">Chưa có ảnh bìa.</div>}
//       </section>

//       {/* Bước 2: Nội dung bài viết */}
//       <section className={`rounded-xl border bg-white p-4 ${quotaExhausted ? "opacity-60 pointer-events-none" : ""}`}>
//         {/* Tái sử dụng PostForm (giống admin): truyền temp group để RichEditor upload đúng group */}
//         {/* Ví dụ (dùng lại component đã có): */}
//         {/* 
//           <PostForm
//             initial={null}
//             onSubmit={submitForm}
//             onCancel={() => nav(-1)}
//             busy={busy}
//             submitDisabled={!coverFile || quotaExhausted}
//             uploadGroup={contentTempGroup}
//             // Nếu PostForm hỗ trợ, đặt default kind="listing"
//             defaults={{ kind: "listing" }}
//           />
//         */}
//         {/* Nếu bạn chưa import được PostForm, tạm render nút submit để test flow: */}
//         <button
//           disabled={busy || !coverFile || quotaExhausted}
//           onClick={() => submitForm({ title: "Bài mới", summary: "", contentHtml: "", kind: "listing" })}
//           className="px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
//         >
//           {busy ? "Đang tạo…" : "Tạo bài (demo)"}
//         </button>
//         <p className="text-xs text-gray-500 mt-2">* Hãy thay bằng PostForm thật của bạn (giống bên admin).</p>
//       </section>
//     </div>
//   );
// }
// frontend/src/modules/user/post/pages/UserPostCreatePage.jsx
import { useEffect, useRef, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";

// ✅ TÁI DÙNG PostForm & Uploader bên admin để tránh thiếu file
import PostForm from "../../../../admin/post/components/PostForm";
import CoverRequiredUploader from "../../../../admin/post/components/CoverRequiredUploader";

// ✅ Dùng service posts đã có sẵn của admin (user vẫn gọi chung endpoint /posts)
import { createPost, setCover as setCoverApi } from "../../../../admin/post/services/adminPosts.service";

// ✅ Gọi quota trực tiếp qua API đã có (không cần thêm service mới)
import { API_BASE, authHeaders } from "../../../../admin/upload/config/api";

function makeTempGroup() {
  const n = Math.random().toString(36).slice(2, 8);
  const t = Date.now().toString(36);
  return `temp:post-content:${t}-${n}`;
}

export default function UserPostCreatePage() {
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [coverFile, setCoverFile] = useState(null);
  const coverRef = useRef(null);

  // ✅ temp group cho nội dung khi chưa có _id
  const [contentTempGroup] = useState(() => makeTempGroup());

  // ===== QUOTA (3 bài trial theo BE) =====
  const [{ remaining, loadingQuota, quotaErr }, setQuota] = useState({
    remaining: null,
    loadingQuota: true,
    quotaErr: "",
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/billing/quota/me`, {
          headers: { ...authHeaders() },
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        if (alive) setQuota({ remaining: Number(data?.remaining || 0), loadingQuota: false, quotaErr: "" });
      } catch (e) {
        if (alive) setQuota({ remaining: 0, loadingQuota: false, quotaErr: e.message || "Quota error" });
      }
    })();
    return () => { alive = false; };
  }, []);

  const quotaExhausted = useMemo(
    () => !loadingQuota && Number(remaining || 0) <= 0,
    [loadingQuota, remaining]
  );

  // ===== SUBMIT =====
  const submitForm = async (payload) => {
    setError("");
    if (quotaExhausted) {
      setError("Bạn đã hết lượt đăng bài. Vui lòng mua gói để tiếp tục.");
      return;
    }
    try {
      if (!coverFile?._id) {
        setError("Vui lòng thêm 1 ảnh bìa trước khi tạo bài viết.");
        coverRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      setBusy(true);

      // 1) Tạo bài viết (BE sẽ trừ quota theo logic đã triển khai)
      const doc = await createPost(payload); // {_id, slug}

      // 2) Đặt ảnh bìa (order=0). Không cố đổi group ở FE user để bám quyền BE.
      await setCoverApi(doc._id, coverFile._id);

      // 3) Về danh sách bài của tôi (tạm map /me/posts; bạn thay bằng trang list sau)
      nav("/me/posts", { replace: true });
    } catch (e) {
      setError(e.message || "Create failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Đăng bài BĐS</h1>
        <Link to="/me/posts" className="px-3 py-2 rounded-lg border hover:bg-gray-50">← Bài của tôi</Link>
      </div>

      {(error || quotaErr) && (
        <div className="text-sm text-rose-600">
          {error || quotaErr}
        </div>
      )}

      {/* Gate khi hết quota */}
      {quotaExhausted && (
        <div className="p-4 rounded-xl border bg-amber-50 text-amber-800">
          <div className="font-semibold mb-1">Bạn đã hết lượt đăng bài.</div>
          <div className="text-sm">Vui lòng mua gói để tiếp tục sử dụng.</div>
        </div>
      )}

      {/* Bước 1: Ảnh bìa bắt buộc */}
      <section
        ref={coverRef}
        className={[
          "rounded-xl border bg-white p-4",
          quotaExhausted ? "opacity-60 pointer-events-none" : "",
        ].join(" ")}
      >
        <h2 className="text-lg font-semibold mb-2">Ảnh bìa (bắt buộc 1 hình)</h2>
        <CoverRequiredUploader onChange={setCoverFile} />
        {!coverFile && <div className="text-xs text-rose-600 mt-1">Chưa có ảnh bìa.</div>}
      </section>

      {/* Bước 2: Nội dung bài viết */}
      <section
        className={[
          "rounded-xl border bg-white p-4",
          quotaExhausted ? "opacity-60 pointer-events-none" : "",
        ].join(" ")}
      >
        {/* ✅ truyền temp group để RichEditor trong PostForm upload đúng group khi chưa có _id */}
        <PostForm
          initial={null}
          onSubmit={submitForm}
          onCancel={() => nav(-1)}
          busy={busy || loadingQuota}
          submitDisabled={!coverFile || quotaExhausted}
          uploadGroup={contentTempGroup}
          // Nếu PostForm hỗ trợ default field cho bài BĐS:
          // defaults={{ kind: "listing" }}
        />
      </section>
    </div>
  );
}
