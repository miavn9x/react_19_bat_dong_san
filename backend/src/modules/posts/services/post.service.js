// backend/src/modules/posts/services/post.service.js
const mongoose = require("mongoose");
const Post = require("../models/post.model");
const File = require("../../uploads/models/file.model");
const { toSlug } = require("../models/post.model");

const isId = (id) => mongoose.isValidObjectId(id);

function toInt(v, d = 1) { const n = parseInt(v, 10); return Number.isFinite(n) && n > 0 ? n : d; }
function escapeRegExp(s = "") { return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

function normTags(tags = []) {
  return (tags || [])
    .map((t) => (typeof t === "string" ? { name: t, slug: toSlug(t) } : t))
    .filter((t) => t && t.name);
}

function normCategory(category = {}) {
  const id = category?.id && isId(category.id) ? category.id : null;
  const slug = (category?.slug || "").toLowerCase().trim();
  const name = (category?.name || "").trim();
  return { id, slug, name };
}

function buildListing(payload = {}) {
  if (!payload) return undefined;
  const pick = (k, d = undefined) => (payload[k] !== undefined ? payload[k] : d);
  const listing = {
    price: pick("price", 0),
    currency: ["VND","USD"].includes(payload.currency) ? payload.currency : "VND",
    area: pick("area", 0),
    propertyType: ["apartment","house","land","villa","office","shop","other"].includes(payload.propertyType)
      ? payload.propertyType : "other",
    bedrooms: pick("bedrooms", 0),
    bathrooms: pick("bathrooms", 0),
    floors: pick("floors", 0),
    legal: pick("legal", ""),
    direction: ["N","S","E","W","NE","NW","SE","SW","other"].includes(payload.direction) ? payload.direction : "other",
    address: pick("address",""),
    street: pick("street",""),
    ward: pick("ward",""),
    district: pick("district",""),
    city: pick("city",""),
    lat: pick("lat"),
    lng: pick("lng"),
  };
  return listing;
}

async function list(params = {}) {
  const {
    page = 1, limit = 12, q = "",
    categorySlug = "", tagSlug = "",
    authorId, status = "published",
    kind, // "listing"|"article"
    // listing filters
    city, district, propertyType,
    priceMin, priceMax, areaMin, areaMax,
    moderation, // "pending"|"approved"|"rejected"
  } = params;

  const pg = toInt(page, 1), lm = Math.min(toInt(limit, 12), 50);
  const cond = {};
  if (status) cond.status = status;
  if (kind) cond.kind = kind;
  if (categorySlug) cond["category.slug"] = String(categorySlug).toLowerCase();
  if (tagSlug) cond["tags.slug"] = String(tagSlug).toLowerCase();
  if (authorId && isId(authorId)) cond.author = authorId;
  if (moderation) cond["moderation.status"] = moderation;

  if (kind === "listing") {
    if (city) cond["listing.citySlug"] = toSlug(city);
    if (district) cond["listing.districtSlug"] = toSlug(district);
    if (propertyType) cond["listing.propertyType"] = propertyType;
    if (priceMin || priceMax) {
      cond["listing.price"] = {};
      if (priceMin) cond["listing.price"].$gte = Number(priceMin);
      if (priceMax) cond["listing.price"].$lte = Number(priceMax);
    }
    if (areaMin || areaMax) {
      cond["listing.area"] = {};
      if (areaMin) cond["listing.area"].$gte = Number(areaMin);
      if (areaMax) cond["listing.area"].$lte = Number(areaMax);
    }
  }

  const qTrim = (q || "").trim();
  let query = { ...cond }, sort = { publishedAt: -1, createdAt: -1 };

  if (qTrim) {
    const slugRegex = { slug: { $regex: escapeRegExp(qTrim), $options: "i" } };
    query = { ...cond, $or: [{ $text: { $search: qTrim } }, slugRegex] };
    sort = { score: { $meta: "textScore" }, publishedAt: -1 };
  }

  const cursor = Post.find(query)
    .sort(sort)
    .skip((pg - 1) * lm)
    .limit(lm)
    .select("_id kind title slug summary publishedAt author coverFile category tags status moderation listing")
    .populate("author", "_id name avatarUrl role")
    .populate("coverFile", "_id url label bucket")
    .lean();

  const [items, total] = await Promise.all([cursor, Post.countDocuments(query)]);
  return { items, total, page: pg, limit: lm };
}

async function getBySlug(slug, { includeGallery = true } = {}) {
  const post = await Post.findOne({ slug })
    .populate("author", "_id name avatarUrl role")
    .populate("coverFile", "_id url label bucket")
    .lean();
  if (!post) return null;

  let gallery = [];
  if (includeGallery) {
    gallery = await File.find({
      $or: [{ entityType: "post", entityId: post._id }, { group: `post:${post._id}` }],
      bucket: { $in: ["images", "videos"] },
    })
      .sort({ order: 1, createdAt: 1 })
      .select("_id url label order isPrimary bucket type")
      .lean();
  }
  return { ...post, gallery };
}

async function create({ kind = "article", title, summary = "", contentHtml = "", authorId, category = {}, tags = [], listing = undefined }) {
  const payload = {
    kind,
    title,
    summary,
    contentHtml,
    author: authorId,
    category: normCategory(category),
    tags: normTags(tags),
    status: "draft",
  };
  if (kind === "listing") {
    payload.moderation = { status: "pending" };
    payload.listing = buildListing(listing || {});
  }
  const doc = await Post.create(payload);
  await Post.findByIdAndUpdate(doc._id, { $set: { galleryGroup: `post:${doc._id}` } });
  return doc;
}

async function updateById(id, payload = {}) {
  const set = {};
  if (payload.kind && ["article","listing"].includes(payload.kind)) set.kind = payload.kind;
  if (payload.title) set.title = payload.title;
  if ("summary" in payload) set.summary = payload.summary || "";
  if ("contentHtml" in payload) set.contentHtml = payload.contentHtml || "";
  if (payload.category) set.category = normCategory(payload.category);
  if (payload.tags) set.tags = normTags(payload.tags);
  if (payload.seo)
    set.seo = {
      title: payload.seo.title || "",
      description: payload.seo.description || "",
      canonical: payload.seo.canonical || "",
    };

  // Publish/Archive cho article (listing sẽ publish qua approve)
  if (payload.status && ["draft", "published", "archived"].includes(payload.status)) {
    set.status = payload.status;
    if (payload.status === "published" && !payload.publishedAt) set.publishedAt = new Date();
  }
  if (payload.publishedAt) set.publishedAt = new Date(payload.publishedAt);

  // Slug
  if (payload.slug) {
    const unique = await Post.ensureUniqueSlug(payload.slug, id);
    set.slug = unique;
  }

  // Listing update
  if (payload.listing) set.listing = buildListing(payload.listing);

  const updated = await Post.findByIdAndUpdate(id, { $set: set }, { new: true, runValidators: true })
    .populate("author", "_id name avatarUrl role")
    .populate("coverFile", "_id url label bucket");
  return updated;
}

async function setCover(postId, fileId) {
  return Post.findByIdAndUpdate(postId, { $set: { coverFile: fileId } }, { new: true })
    .select("_id title slug coverFile")
    .populate("coverFile", "_id url label bucket");
}

async function removeById(id) { return Post.findByIdAndDelete(id).select("_id"); }

async function incView(postId) { await Post.updateOne({ _id: postId }, { $inc: { viewCount: 1 } }); }

/** Dùng cho xét duyệt (admin) */
async function moderate(id, { approved, note, adminId }) {
  const set = {
    "moderation.status": approved ? "approved" : "rejected",
    "moderation.note": note || "",
    "moderation.by": adminId || null,
    "moderation.at": new Date(),
  };
  if (approved) { set.status = "published"; set.publishedAt = new Date(); }
  else { set.status = "draft"; }
  return Post.findByIdAndUpdate(id, { $set: set }, { new: true })
    .select("_id slug kind status moderation quotaConsumptionId author");
}

module.exports = {
  list,
  getBySlug,
  create,
  updateById,
  setCover,
  removeById,
  incView,
  moderate,
};
