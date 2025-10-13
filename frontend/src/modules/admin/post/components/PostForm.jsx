// frontend/src/modules/admin/post/components/PostForm.jsx
import { useEffect, useState } from "react";
import RichEditor from "../../../common/RichEditor";
// slugify chuẩn cho tiếng Việt
function slugify(input = "") {
  return (input || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export default function PostForm({
  initial = null,
  onSubmit,
  onCancel,
  busy,
  submitDisabled = false,
  uploadGroup = "",          // ✅ NHẬN group để truyền vào RichEditor
}) {
  const [title, setTitle] = useState(initial?.title || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [summary, setSummary] = useState(initial?.summary || "");
  const [contentHtml, setContentHtml] = useState(initial?.contentHtml || "");
  const [categorySlug, setCategorySlug] = useState(initial?.category?.slug || "");
  const [categoryName, setCategoryName] = useState(initial?.category?.name || "");
  const [tagsText, setTagsText] = useState((initial?.tags || []).map(t => t.name || t).join(", "));

  // Cho phép auto slug khi user bắt đầu sửa
  const [slugTouched, setSlugTouched] = useState(false);
  const [catSlugTouched, setCatSlugTouched] = useState(false);

  useEffect(() => {
    setTitle(initial?.title || "");
    setSlug(initial?.slug || "");
    setSummary(initial?.summary || "");
    setContentHtml(initial?.contentHtml || "");
    setCategorySlug(initial?.category?.slug || "");
    setCategoryName(initial?.category?.name || "");
    setTagsText((initial?.tags || []).map(t => t.name || t).join(", "));
    setSlugTouched(false);
    setCatSlugTouched(false);
  }, [initial]);

  // ===== Slug bài viết: auto theo tiêu đề nếu chưa “đụng” slug =====
  const onChangeTitle = (e) => {
    const v = e.target.value;
    setTitle(v);
    if (!slugTouched) setSlug(slugify(v));
  };

  const onChangeSlug = (e) => {
    setSlug(e.target.value);
    setSlugTouched(true);
  };

  useEffect(() => {
    if (slugTouched && !slug) setSlugTouched(false);
  }, [slug, slugTouched]);

  // ===== Slug danh mục: auto theo tên danh mục nếu chưa “đụng” =====
  const onChangeCategoryName = (e) => {
    const v = e.target.value;
    setCategoryName(v);
    if (!catSlugTouched) setCategorySlug(slugify(v));
  };

  const onChangeCategorySlug = (e) => {
    setCategorySlug(e.target.value);
    setCatSlugTouched(true);
  };

  useEffect(() => {
    if (catSlugTouched && !categorySlug) setCatSlugTouched(false);
  }, [catSlugTouched, categorySlug]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (submitDisabled) return;
    const payload = {
      title,
      summary,
      contentHtml,
      category: { slug: categorySlug, name: categoryName },
      tags: tagsText.split(",").map(s => s.trim()).filter(Boolean),
    };
    if (slug) payload.slug = slug; // để trống thì BE tự generate
    onSubmit?.(payload);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="block">
          <div className="text-sm text-gray-600">Tiêu đề *</div>
          <input
            value={title}
            onChange={onChangeTitle}
            required
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </label>
        <label className="block">
          <div className="text-sm text-gray-600">Slug (bỏ trống để tự tạo)</div>
          <input
            value={slug}
            onChange={onChangeSlug}
            placeholder="Tự tạo từ tiêu đề nếu để trống"
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </label>
      </div>

      <label className="block">
        <div className="text-sm text-gray-600">Tóm tắt</div>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-lg border px-3 py-2"
        />
      </label>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="block">
          <div className="text-sm text-gray-600">Danh mục</div>
          <input
            value={categoryName}
            onChange={onChangeCategoryName}
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </label>
        <label className="block">
          <div className="text-sm text-gray-600">Slug danh mục</div>
          <input
            value={categorySlug}
            onChange={onChangeCategorySlug}
            placeholder="Tự tạo từ tên danh mục nếu để trống"
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </label>
      </div>

      <label className="block">
        <div className="text-sm text-gray-600">Tags (phân tách bằng dấu phẩy)</div>
        <input
          value={tagsText}
          onChange={(e) => setTagsText(e.target.value)}
          className="mt-1 w-full rounded-lg border px-3 py-2"
        />
      </label>

      <div>
        <div className="text-sm text-gray-600 mb-1">Nội dung</div>
        {/* ✅ truyền uploadGroup xuống RichEditor */}
        <RichEditor value={contentHtml} onChange={setContentHtml} uploadGroup={uploadGroup} />
      </div>

      {submitDisabled && (
        <div className="text-xs text-rose-600">
          Hãy thêm <b>1 ảnh bìa</b> trước khi tạo bài viết.
        </div>
      )}

      <div className="flex items-center gap-2 justify-end pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
        >
          Huỷ
        </button>
        <button
          type="submit"
          disabled={busy || submitDisabled}
          className="px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {initial?._id ? "Lưu thay đổi" : "Tạo bài viết"}
        </button>
      </div>
    </form>
  );
}
