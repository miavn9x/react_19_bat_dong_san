

const mongoose = require("mongoose");
const Post = require("../models/post.model");
const File = require("../../uploads/models/file.model");
const { toSlug } = require("../models/post.model");

const isId = (id) => mongoose.isValidObjectId(id);

function toInt(v, d = 1) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : d;
}

function escapeRegExp(s = "") {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

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

async function list({
  page = 1,
  limit = 12,
  q = "",
  categorySlug = "",
  tagSlug = "",
  authorId,
  status = "published",
}) {
  const pg = toInt(page, 1),
    lm = Math.min(toInt(limit, 12), 50);

  const cond = { status };

  if (categorySlug) cond["category.slug"] = String(categorySlug).toLowerCase();
  if (tagSlug) cond["tags.slug"] = String(tagSlug).toLowerCase();
  if (authorId && isId(authorId)) cond.author = authorId;

  const qTrim = (q || "").trim();

  // --- Xây query chính ---
  let query = { ...cond };
  let sort = { publishedAt: -1, createdAt: -1 };
  let select = "_id title slug summary publishedAt author coverFile category tags status";

  if (qTrim) {
    // Hỗ trợ: $text (tiêu đề/tóm tắt/nội dung/tag) + regex theo slug (để tìm slug đúng như placeholder)
    const slugRegex = { slug: { $regex: escapeRegExp(qTrim), $options: "i" } };
    query = { ...cond, $or: [{ $text: { $search: qTrim } }, slugRegex] };
    sort = { score: { $meta: "textScore" }, publishedAt: -1 };
    // có thể thêm select score nếu cần debug: select = { ..., score: { $meta: "textScore" } }
  }

  const cursor = Post.find(query)
    .sort(sort)
    .skip((pg - 1) * lm)
    .limit(lm)
    .select(select)
    .populate("author", "_id name avatarUrl role")
    .populate("coverFile", "_id url label bucket")
    .lean();

  const [items, total] = await Promise.all([
    cursor,
    // total phải đếm đúng theo query (bao gồm $text/$or nếu có)
    Post.countDocuments(query),
  ]);

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
      $or: [
        { entityType: "post", entityId: post._id },
        { group: `post:${post._id}` },
      ],
      bucket: { $in: ["images", "videos"] },
    })
      .sort({ order: 1, createdAt: 1 })
      .select("_id url label order isPrimary bucket type")
      .lean();
  }
  return { ...post, gallery };
}

async function create({ title, summary = "", contentHtml = "", authorId, category = {}, tags = [] }) {
  const doc = await Post.create({
    title,
    summary,
    contentHtml,
    author: authorId,
    category: normCategory(category),
    tags: normTags(tags),
    status: "draft",
  });
  await Post.findByIdAndUpdate(doc._id, { $set: { galleryGroup: `post:${doc._id}` } });
  return doc;
}

async function updateById(id, payload = {}) {
  const set = {};
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
  if (payload.status && ["draft", "published", "archived"].includes(payload.status)) {
    set.status = payload.status;
    if (payload.status === "published" && !payload.publishedAt) {
      set.publishedAt = new Date();
    }
  }
  if (payload.publishedAt) set.publishedAt = new Date(payload.publishedAt);

  if (payload.slug) {
    const unique = await Post.ensureUniqueSlug(payload.slug, id);
    set.slug = unique;
  }

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

async function removeById(id) {
  return Post.findByIdAndDelete(id).select("_id");
}

async function incView(postId) {
  await Post.updateOne({ _id: postId }, { $inc: { viewCount: 1 } });
}

module.exports = {
  list,
  getBySlug,
  create,
  updateById,
  setCover,
  removeById,
  incView,
};
