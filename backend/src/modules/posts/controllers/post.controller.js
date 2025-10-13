// backend/src/modules/posts/controllers/post.controller.js
const mongoose = require("mongoose");
const Post = require("../models/post.model");
const postService = require("../services/post.service");
const File = require("../../uploads/models/file.model");

const isId = (id) => mongoose.isValidObjectId(id);

/** GET /api/posts */
async function list(req, res) {
  try {
    const { page, limit, q, category, tag, author, status } = req.query;
    const data = await postService.list({
      page, limit, q,
      categorySlug: category,
      tagSlug: tag,
      authorId: author,
      status: status || "published",
    });
    res.json(data);
  } catch (e) {
    console.error("[posts.list]", e);
    res.status(500).json({ message: "Server error" });
  }
}

/** GET /api/posts/:slug */
async function detail(req, res) {
  try {
    const { slug } = req.params;
    const includeGallery = (req.query.include || "").includes("gallery");
    const post = await postService.getBySlug(slug, { includeGallery });
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post);
  } catch (e) {
    console.error("[posts.detail]", e);
    res.status(500).json({ message: "Server error" });
  }
}

/** POST /api/posts (admin) */
async function create(req, res) {
  try {
    const { title, summary, contentHtml, category, tags } = req.body;
    if (!title) return res.status(400).json({ message: "Thiếu tiêu đề" });

    const doc = await postService.create({
      title, summary, contentHtml,
      authorId: req.userId,
      category, tags,
    });
    res.status(201).json(doc);
  } catch (e) {
    console.error("[posts.create]", e);
    res.status(500).json({ message: "Server error" });
  }
}

/** PATCH /api/posts/:id (admin) */
async function update(req, res) {
  try {
    const { id } = req.params;
    if (!isId(id)) return res.status(400).json({ message: "Invalid id" });
    const updated = await postService.updateById(id, req.body || {});
    if (!updated) return res.status(404).json({ message: "Post not found" });
    res.json(updated);
  } catch (e) {
    console.error("[posts.update]", e);
    res.status(500).json({ message: "Server error" });
  }
}

/** PATCH /api/posts/:id/cover (admin) */
async function setCover(req, res) {
  try {
    const { id } = req.params;
    const { fileId } = req.body;
    if (!isId(id) || !isId(fileId)) return res.status(400).json({ message: "Invalid id" });

    // Tuỳ chọn: kiểm tra file có tồn tại
    const file = await File.findById(fileId).select("_id bucket");
    if (!file) return res.status(404).json({ message: "File not found" });

    const doc = await postService.setCover(id, fileId);
    if (!doc) return res.status(404).json({ message: "Post not found" });
    res.json(doc);
  } catch (e) {
    console.error("[posts.setCover]", e);
    res.status(500).json({ message: "Server error" });
  }
}

/** DELETE /api/posts/:id (admin) */
async function remove(req, res) {
  try {
    const { id } = req.params;
    if (!isId(id)) return res.status(400).json({ message: "Invalid id" });
    const r = await postService.removeById(id);
    if (!r) return res.status(404).json({ message: "Post not found" });
    res.json({ ok: true, id });
  } catch (e) {
    console.error("[posts.remove]", e);
    res.status(500).json({ message: "Server error" });
  }
}

/** GET /api/posts/:id/gallery (public) — tiện ích lấy gallery */
async function gallery(req, res) {
  try {
    const { id } = req.params;
    if (!isId(id)) return res.status(400).json({ message: "Invalid id" });
    const files = await File.find({
      $or: [{ entityType: "post", entityId: id }, { group: `post:${id}` }],
    })
      .sort({ order: 1, createdAt: 1 })
      .select("_id url label order isPrimary bucket type")
      .lean();
    res.json({ items: files, count: files.length });
  } catch (e) {
    console.error("[posts.gallery]", e);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  list,
  detail,
  create,
  update,
  setCover,
  remove,
  gallery,
};
