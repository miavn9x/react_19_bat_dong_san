// backend/src/modules/posts/models/post.model.js
const { Schema, model, Types } = require("mongoose");

/** Chuẩn hoá tiếng Việt -> slug ascii */
function toSlug(input = "") {
  const base = String(input || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // bỏ dấu
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "bai-viet";
}

function stripHtml(html = "") {
  return String(html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

const TagSchema = new Schema(
  {
    name: { type: String, trim: true },
    slug: { type: String, trim: true, lowercase: true, index: true },
  },
  { _id: false }
);

const PostSchema = new Schema(
  {
    // Nội dung & SEO
    title:       { type: String, required: true, trim: true },
    slug:        { type: String, required: true, unique: true, lowercase: true, index: true },
    summary:     { type: String, default: "" },
    contentHtml: { type: String, default: "" },
    contentText: { type: String, default: "" }, // phục vụ text-index

    // Trạng thái
    status:      { type: String, enum: ["draft", "published", "archived"], default: "draft", index: true },
    publishedAt: { type: Date, index: true },

    // Tác giả
    author:      { type: Types.ObjectId, ref: "User", required: true, index: true },

    // Danh mục (nhẹ, lưu trực tiếp)
    category: {
      id:   { type: Types.ObjectId, ref: "Category", default: null, index: true },
      slug: { type: String, default: "", lowercase: true, trim: true, index: true },
      name: { type: String, default: "", trim: true },
    },

    // Thẻ
    tags: { type: [TagSchema], default: [] },

    // Ảnh/Video
    coverFile:    { type: Types.ObjectId, ref: "File", default: null },
    galleryGroup: { type: String, default: "" }, // dùng với Upload.group (vd: "post:<_id>")

    // Counters
    viewCount: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },

    // SEO thêm
    seo: {
      title:       { type: String, default: "" },
      description: { type: String, default: "" },
      canonical:   { type: String, default: "" },
    },
  },
  { timestamps: true, collection: "posts" }
);

/* ===== Index ===== */
PostSchema.index({ status: 1, publishedAt: -1 });
PostSchema.index({ "category.slug": 1, status: 1, publishedAt: -1 });
PostSchema.index({ "tags.slug": 1 });
PostSchema.index(
  { title: "text", summary: "text", contentText: "text", "tags.name": "text" },
  { name: "post_text_idx", weights: { title: 6, summary: 3, contentText: 2, "tags.name": 1 } }
);

/* ===== Hooks & Helpers ===== */
PostSchema.pre("validate", function (next) {
  if (!this.slug && this.title) this.slug = toSlug(this.title);
  if (this.slug) this.slug = toSlug(this.slug);
  if (this.isModified("contentHtml")) this.contentText = stripHtml(this.contentHtml || "");
  next();
});

PostSchema.statics.ensureUniqueSlug = async function (slug, excludeId) {
  const base = toSlug(slug);
  let cand = base;
  let i = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const dup = await this.findOne(
      excludeId ? { slug: cand, _id: { $ne: excludeId } } : { slug: cand }
    ).select("_id").lean();
    if (!dup) return cand;
    cand = `${base}-${i++}`;
  }
};

PostSchema.pre("save", async function (next) {
  if (this.isModified("slug") || this.isNew) {
    this.slug = await this.constructor.ensureUniqueSlug(this.slug, this._id);
  }
  next();
});

module.exports = model("Post", PostSchema);
module.exports.toSlug = toSlug; // tái dùng trong service/controller
