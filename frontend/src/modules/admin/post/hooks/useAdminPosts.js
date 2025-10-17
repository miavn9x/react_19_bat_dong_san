// frontend/src/modules/admin/post/hooks/useAdminPosts.js
import { useCallback, useEffect, useState } from "react";
import { listPosts, createPost, updatePost, deletePost, setCover, moderatePost } from "../services/adminPosts.service";

/** Bỏ dấu & chuẩn hoá để so khớp không dấu */
function normalizeVN(s = "") {
  try {
    return String(s)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase()
      .trim();
  } catch {
    return (s || "").toLowerCase().trim();
  }
}

/** toSlug đơn giản phía FE */
function toSlugFE(s = "") {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** parseSearchQuery / matchPostByQuery giữ nguyên như bạn đã có */
function parseSearchQuery(qRaw = "") {
  const out = { qPlain: "", tokens: {} };
  const src = String(qRaw || "").trim();
  if (!src) return out;
  const parts = src.split(/\s+/);
  const free = [];
  for (const p of parts) {
    const m = /^([a-zA-Z]+):(.*)$/.exec(p);
    if (m) {
      const k = m[1].toLowerCase();
      const v = (m[2] || "").trim();
      if (v) out.tokens[k] = v;
    } else free.push(p);
  }
  out.qPlain = free.join(" ").trim();
  return out;
}

function matchPostByQuery(post, qRaw = "") {
  const { qPlain, tokens } = parseSearchQuery(qRaw);
  const hayAll = [
    post?.title || "",
    post?.slug || "",
    post?.author?.name || "",
    post?.summary || "",
    (post?.tags || []).map((t) => t?.name || "").join(" "),
    post?.category?.name || "",
    post?.category?.slug || "",
  ].join(" | ");
  const normHay = normalizeVN(hayAll);
  const tokensFree = normalizeVN(qPlain).split(/\s+/).filter(Boolean);
  const freeOK = tokensFree.every((t) => normHay.includes(t));
  if (!freeOK) return false;

  if (tokens.tag) {
    const want = toSlugFE(tokens.tag);
    const has = (post?.tags || []).some(
      (t) => toSlugFE(t?.name || "") === want || String(t?.slug || "").toLowerCase() === want
    );
    if (!has) return false;
  }
  const catTok = tokens.category || tokens.cat;
  if (catTok) {
    const want = toSlugFE(catTok);
    const ok =
      String(post?.category?.slug || "").toLowerCase() === want ||
      toSlugFE(post?.category?.name || "") === want;
    if (!ok) return false;
  }
  if (tokens.author) {
    const val = tokens.author.trim();
    const isHex24 = /^[a-f0-9]{24}$/i.test(val);
    if (isHex24) {
      if (String(post?.author?._id || "") !== val) return false;
    } else {
      const normAuthor = normalizeVN(post?.author?.name || "");
      const normWant = normalizeVN(val);
      if (!normAuthor.includes(normWant)) return false;
    }
  }
  if (tokens.slug) {
    const want = tokens.slug.toLowerCase();
    if (!String(post?.slug || "").toLowerCase().includes(want)) return false;
  }
  if (tokens.id) {
    if (String(post?._id || "") !== tokens.id.trim()) return false;
  }
  return true;
}

export function usePostList({ status = "draft", pageSize = 12, filters = {} } = {}) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(pageSize);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(
    async (p = 1) => {
      setLoading(true);
      setError("");
      try {
        const qRaw = filters?.q || "";
        const { qPlain, tokens } = parseSearchQuery(qRaw);

        const params = {
          page: p,
          limit: pageSize,
          status,
          owner: filters?.owner || "",
          q: qPlain,
          category: tokens.category ? toSlugFE(tokens.category) : tokens.cat ? toSlugFE(tokens.cat) : "",
          tag: tokens.tag ? toSlugFE(tokens.tag) : "",
          author: tokens.author && /^[a-f0-9]{24}$/i.test(tokens.author) ? tokens.author : "",
        };

        const hasHardTokens =
          (!!tokens.author && !/^[a-f0-9]{24}$/i.test(tokens.author)) || !!tokens.slug || !!tokens.id;
        if (hasHardTokens && !qPlain) params.q = "";

        const data = await listPosts(params);
        let list = data.items || [];

        if (filters?.owner === "admin") {
          list = list.filter((it) => (it.author?.role || "").toLowerCase() === "admin");
        } else if (filters?.owner === "user") {
          list = list.filter((it) => (it.author?.role || "").toLowerCase() !== "admin");
        }

        if (qRaw) list = list.filter((it) => matchPostByQuery(it, qRaw));

        setItems(list);
        const serverTotal = Number(data.total || 0);
        const showTotal = qRaw || filters?.owner ? list.length : serverTotal || list.length;
        setTotal(showTotal);
        setPage(data.page || p);
        setLimit(data.limit || pageSize);
      } catch (e) {
        setError(e.message || "Load failed");
      } finally {
        setLoading(false);
      }
    },
    [status, pageSize, filters]
  );

  useEffect(() => { load(1); }, [load]);

  return { items, total, page, limit, loading, error, reload: load, setPage };
}

export function usePostCrud() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const create = async (payload) => {
    setBusy(true); setError("");
    try { return await createPost(payload); }
    catch (e) { setError(e.message || "Create failed"); throw e; }
    finally { setBusy(false); }
  };

  const update = async (id, patch) => {
    setBusy(true); setError("");
    try { return await updatePost(id, patch); }
    catch (e) { setError(e.message || "Update failed"); throw e; }
    finally { setBusy(false); }
  };

  const remove = async (id) => {
    setBusy(true); setError("");
    try { return await deletePost(id); }
    catch (e) { setError(e.message || "Delete failed"); throw e; }
    finally { setBusy(false); }
  };

  const changeCover = async (postId, fileId) => {
    setBusy(true); setError("");
    try { return await setCover(postId, fileId); }
    catch (e) { setError(e.message || "Set cover failed"); throw e; }
    finally { setBusy(false); }
  };

  /** ✅ NEW: đổi trạng thái cho đúng nghiệp vụ
   * - published:
   *     - listing  -> moderate(approve)
   *     - article  -> update(status=published)
   * - archived: cả hai -> update(status=archived)
   * - draft: (nếu cần) -> update(status=draft)
   */
  const changeStatus = async (post, nextStatus, { note = "" } = {}) => {
    if (!post?._id) throw new Error("Missing post id");
    setBusy(true); setError("");
    try {
      if (nextStatus === "published") {
        if (post.kind === "listing") {
          // duyệt listing qua moderate
          return await moderatePost(post._id, { action: "approve", note });
        } else {
          // article
          return await updatePost(post._id, { status: "published" });
        }
      }
      if (nextStatus === "archived") {
        return await updatePost(post._id, { status: "archived" });
      }
      if (nextStatus === "draft") {
        return await updatePost(post._id, { status: "draft" });
      }
      throw new Error("Trạng thái không hỗ trợ");
    } catch (e) {
      setError(e.message || "Change status failed");
      throw e;
    } finally {
      setBusy(false);
    }
  };

  return { busy, error, create, update, remove, changeCover, changeStatus };
}
