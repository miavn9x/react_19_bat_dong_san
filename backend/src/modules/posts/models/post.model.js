// backend/src/modules/posts/models/post.model.js
const { Schema, model, Types } = require("mongoose");

/** Chuẩn hoá tiếng Việt -> slug ascii (giữ như cũ) */
function toSlug(input = "") {
  const base = String(input || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
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

/* ---- Listing (BĐS) subdoc ---- */
const ListingSchema = new Schema(
  {
    // Thông tin định giá/diện tích
    price: { type: Number, min: 0, default: 0 },
    currency: { type: String, enum: ["VND", "USD"], default: "VND" },
    area: { type: Number, min: 0, default: 0 }, // m2

    // Thuộc tính tài sản
    propertyType: {
      type: String,
      enum: ["apartment", "house", "land", "villa", "office", "shop", "other"],
      default: "other",
      index: true,
    },
    bedrooms: { type: Number, min: 0, default: 0 },
    bathrooms: { type: Number, min: 0, default: 0 },
    floors: { type: Number, min: 0, default: 0 },
    legal: { type: String, default: "" }, // sổ đỏ/HH/hợp đồng...

    direction: {
      type: String,
      enum: ["N","S","E","W","NE","NW","SE","SW","other"],
      default: "other",
    },

    // Địa chỉ (thân thiện SEO)
    address: { type: String, default: "" },
    street:  { type: String, default: "" },
    ward:    { type: String, default: "" },
    district:{ type: String, default: "" },
    city:    { type: String, default: "" },

    wardSlug:     { type: String, default: "", lowercase: true, index: true },
    districtSlug: { type: String, default: "", lowercase: true, index: true },
    citySlug:     { type: String, default: "", lowercase: true, index: true },

    // Toạ độ (tuỳ chọn)
    lat: { type: Number },
    lng: { type: Number },
  },
  { _id: false }
);

/* ---- Post chính ---- */
const TagSchema = new Schema(
  { name: { type: String, trim: true }, slug: { type: String, trim: true, lowercase: true, index: true } },
  { _id: false }
);

const PostSchema = new Schema(
  {
    // Phân loại: bài viết blog hay tin BĐS
    kind: { type: String, enum: ["article", "listing"], default: "article", index: true },

    // Nội dung & SEO
    title:       { type: String, required: true, trim: true },
    slug:        { type: String, required: true, unique: true, lowercase: true, index: true },
    summary:     { type: String, default: "" },
    contentHtml: { type: String, default: "" },
    contentText: { type: String, default: "" },

    // Trạng thái publish (giữ cũ)
    status:      { type: String, enum: ["draft", "published", "archived"], default: "draft", index: true },
    publishedAt: { type: Date, index: true },

    // Xét duyệt (mới)
    moderation: {
      status: { type: String, enum: ["pending", "approved", "rejected", "n/a"], default: "n/a", index: true },
      note:   { type: String, default: "" },
      by:     { type: Types.ObjectId, ref: "User", default: null },
      at:     { type: Date },
    },

    // Tác giả
    author:      { type: Types.ObjectId, ref: "User", required: true, index: true },

    // Danh mục/Tags (giữ cũ)
    category: {
      id:   { type: Types.ObjectId, ref: "Category", default: null, index: true },
      slug: { type: String, default: "", lowercase: true, trim: true, index: true },
      name: { type: String, default: "", trim: true },
    },
    tags: { type: [TagSchema], default: [] },

    // Ảnh/Video
    coverFile:    { type: Types.ObjectId, ref: "File", default: null },
    galleryGroup: { type: String, default: "" }, // "post:<_id>"

    // BĐS
    listing: { type: ListingSchema, default: undefined },

    // Hạn mức/quy đổi
    quotaConsumptionId: { type: Types.ObjectId, ref: "CreditLog", default: null },

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
PostSchema.index({ kind: 1, status: 1, publishedAt: -1 });
PostSchema.index({ "category.slug": 1, status: 1, publishedAt: -1 });
PostSchema.index({ "tags.slug": 1 });
PostSchema.index({ "listing.citySlug": 1, "listing.districtSlug": 1, "listing.propertyType": 1 });
PostSchema.index({ "listing.price": 1, "listing.area": 1 });

PostSchema.index(
  { title: "text", summary: "text", contentText: "text", "tags.name": "text" },
  { name: "post_text_idx", weights: { title: 6, summary: 3, contentText: 2, "tags.name": 1 } }
);

/* ===== Hooks ===== */
PostSchema.pre("validate", function (next) {
  if (!this.slug && this.title) this.slug = toSlug(this.title);
  if (this.slug) this.slug = toSlug(this.slug);
  if (this.isModified("contentHtml")) this.contentText = stripHtml(this.contentHtml || "");

  // listing slugs
  if (this.listing) {
    const s = (v) => toSlug(v || "");
    if (this.isModified("listing.city"))     this.listing.citySlug     = s(this.listing.city);
    if (this.isModified("listing.district")) this.listing.districtSlug = s(this.listing.district);
    if (this.isModified("listing.ward"))     this.listing.wardSlug     = s(this.listing.ward);
  }
  next();
});

PostSchema.statics.ensureUniqueSlug = async function (slug, excludeId) {
  const base = toSlug(slug);
  let cand = base, i = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const dup = await this.findOne(excludeId ? { slug: cand, _id: { $ne: excludeId } } : { slug: cand })
      .select("_id").lean();
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
module.exports.toSlug = toSlug;
