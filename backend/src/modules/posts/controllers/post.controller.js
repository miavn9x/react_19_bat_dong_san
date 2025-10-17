// backend/src/modules/posts/controllers/post.controller.js
const mongoose = require("mongoose");
const Post = require("../models/post.model");
const postService = require("../services/post.service");
const File = require("../../uploads/models/file.model");
const quota = require("../../quota/services/quota.service"); // ✅ mới

const isId = (id) => mongoose.isValidObjectId(id);

/** GET /api/posts */
async function list(req, res) {
  try {
    const {
      page, limit, q, category, tag, author, status,
      kind, city, district, propertyType, priceMin, priceMax, areaMin, areaMax, moderation,
    } = req.query;

    const data = await postService.list({
      page, limit, q,
      categorySlug: category,
      tagSlug: tag,
      authorId: author,
      status: status || "published",
      kind, city, district, propertyType, priceMin, priceMax, areaMin, areaMax, moderation,
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

/** POST /api/posts (user/admin) */
async function create(req, res) {
  try {
    const { title, summary, contentHtml, category, tags, kind = "article", listing } = req.body;
    if (!title) return res.status(400).json({ message: "Thiếu tiêu đề" });

    // Nếu là listing -> kiểm tra/quy đổi hạn mức
    let consumptionId = null;
    if (kind === "listing") {
      // cấp trial nếu chưa có
      await quota.grantTrialIfNeeded(req.userId);
      // consume 1 suất, nếu hết hạn mức -> 402 Payment Required
      const consume = await quota.consumeOneOrThrow(req.userId, { reason: "create_listing" });
      consumptionId = consume?._id;
    }

    const doc = await postService.create({
      kind, title, summary, contentHtml, authorId: req.userId, category, tags, listing,
    });

    if (consumptionId) {
      await Post.findByIdAndUpdate(doc._id, { $set: { quotaConsumptionId: consumptionId } });
    }

    res.status(201).json(doc);
  } catch (e) {
    if (e && e.code === "NO_CREDIT") return res.status(402).json({ message: e.message });
    console.error("[posts.create]", e);
    res.status(500).json({ message: "Server error" });
  }
}

/** PATCH /api/posts/:id (admin/user = tác giả) */
async function update(req, res) {
  try {
    const { id } = req.params;
    if (!isId(id)) return res.status(400).json({ message: "Invalid id" });

    // (tuỳ chọn) chỉ cho tác giả hoặc admin
    if (String(req.role) !== "admin") {
      const owns = await Post.findOne({ _id: id, author: req.userId }).select("_id").lean();
      if (!owns) return res.status(403).json({ message: "Không có quyền sửa bài này" });
    }

    const updated = await postService.updateById(id, req.body || {});
    if (!updated) return res.status(404).json({ message: "Post not found" });
    res.json(updated);
  } catch (e) {
    console.error("[posts.update]", e);
    res.status(500).json({ message: "Server error" });
  }
}

/** PATCH /api/posts/:id/cover (admin hoặc tác giả) */
async function setCover(req, res) {
  try {
    const { id } = req.params;
    const { fileId } = req.body;
    if (!isId(id) || !isId(fileId)) return res.status(400).json({ message: "Invalid id" });

    // Tuỳ chọn: kiểm tra quyền sở hữu
    const post = await Post.findById(id).select("_id author").lean();
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (String(req.role) !== "admin" && String(post.author) !== String(req.userId)) {
      return res.status(403).json({ message: "Không có quyền" });
    }

    const file = await File.findById(fileId).select("_id bucket");
    if (!file) return res.status(404).json({ message: "File not found" });

    const doc = await postService.setCover(id, fileId);
    res.json(doc);
  } catch (e) {
    console.error("[posts.setCover]", e);
    res.status(500).json({ message: "Server error" });
  }
}

/** DELETE /api/posts/:id (admin hoặc tác giả) */
async function remove(req, res) {
  try {
    const { id } = req.params;
    if (!isId(id)) return res.status(400).json({ message: "Invalid id" });

    const post = await Post.findById(id).select("_id author moderation quotaConsumptionId").lean();
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (String(req.role) !== "admin" && String(post.author) !== String(req.userId)) {
      return res.status(403).json({ message: "Không có quyền" });
    }

    const r = await postService.removeById(id);

    // Nếu là listing và đang pending -> (tuỳ chính sách) có thể hoàn hạn mức
    if (post.moderation?.status === "pending" && post.quotaConsumptionId) {
      try { await quota.refundByConsumptionId(post.quotaConsumptionId, "delete_pending_listing"); } catch (_) {}
    }

    res.json({ ok: true, id: r?._id || id });
  } catch (e) {
    console.error("[posts.remove]", e);
    res.status(500).json({ message: "Server error" });
  }
}

/** GET /api/posts/:id/gallery (public) */
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

/** PATCH /api/posts/:id/moderate (admin) */
async function moderate(req, res) {
  try {
    const { id } = req.params;
    const { action = "", note = "" } = req.body || {};
    if (!isId(id)) return res.status(400).json({ message: "Invalid id" });

    const approved = action === "approve";
    const doc = await postService.moderate(id, { approved, note, adminId: req.userId });
    if (!doc) return res.status(404).json({ message: "Post not found" });

    // Refund credit nếu reject
    if (!approved && doc.quotaConsumptionId) {
      try { await quota.refundByConsumptionId(doc.quotaConsumptionId, "reject_listing"); } catch (e) { console.error(e); }
    }

    res.json(doc);
  } catch (e) {
    console.error("[posts.moderate]", e);
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
  moderate,
};
