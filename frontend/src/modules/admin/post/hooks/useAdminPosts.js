
// // frontend/src/modules/admin/post/hooks/useAdminPosts.js


import { useCallback, useEffect, useState } from "react";
import { listPosts, createPost, updatePost, deletePost, setCover } from "../services/adminPosts.service";

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

/** toSlug đơn giản phía FE (không cần 100% giống BE, chỉ để build tag/category slug gửi BE) */
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

/** Parse query dạng:
 *  - token: value (không cần quote), ví dụ: tag:seo  category:tin-tuc  author:6520fa...  slug:w-four-tech
 *  - phần còn lại là free text (qPlain)
 */
function parseSearchQuery(qRaw = "") {
  const out = {
    qPlain: "",
    tokens: {}, // { tag: "seo", category: "tin-tuc", author: "hex24", slug: "abc", id: "hex24" ... }
  };
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
    } else {
      free.push(p);
    }
  }
  out.qPlain = free.join(" ").trim();
  return out;
}

/** Kiểm tra 1 post có khớp query (hỗ trợ tokens) */
function matchPostByQuery(post, qRaw = "") {
  const { qPlain, tokens } = parseSearchQuery(qRaw);

  // Tập dữ liệu để tìm kiếm "free text"
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
  const tokensFree = normalizeVN(qPlain)
    .split(/\s+/)
    .filter(Boolean);

  // AND tất cả token tự do
  const freeOK = tokensFree.every((t) => normHay.includes(t));
  if (!freeOK) return false;

  // Field tokens
  // tag:
  if (tokens.tag) {
    const want = toSlugFE(tokens.tag);
    const has = (post?.tags || []).some(
      (t) => toSlugFE(t?.name || "") === want || String(t?.slug || "").toLowerCase() === want
    );
    if (!has) return false;
  }
  // category: / cat:
  const catTok = tokens.category || tokens.cat;
  if (catTok) {
    const want = toSlugFE(catTok);
    const ok =
      String(post?.category?.slug || "").toLowerCase() === want ||
      toSlugFE(post?.category?.name || "") === want;
    if (!ok) return false;
  }
  // author: (by name nếu không phải ObjectId)
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
  // slug:
  if (tokens.slug) {
    const want = tokens.slug.toLowerCase();
    if (!String(post?.slug || "").toLowerCase().includes(want)) return false;
  }
  // id:
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

        // Xây params cho BE
        const params = {
          page: p,
          limit: pageSize,
          status,
          owner: filters?.owner || "",
          q: qPlain, // free text cho $text + slug regex
          category: tokens.category ? toSlugFE(tokens.category) : tokens.cat ? toSlugFE(tokens.cat) : "",
          tag: tokens.tag ? toSlugFE(tokens.tag) : "",
          // author: chỉ gửi khi là ObjectId — BE mới hiểu
          author: tokens.author && /^[a-f0-9]{24}$/i.test(tokens.author) ? tokens.author : "",
        };

        // Nếu query chỉ toàn field-tokens khó hỗ trợ ở BE (vd author theo tên),
        // có thể bỏ q gửi BE để không lọc sớm.
        const hasHardTokens =
          (!!tokens.author && !/^[a-f0-9]{24}$/i.test(tokens.author)) || !!tokens.slug || !!tokens.id;
        if (hasHardTokens && !qPlain) {
          params.q = ""; // trả full theo status/owner/… rồi FE lọc
        }

        const data = await listPosts(params);

        let list = data.items || [];

        // Fallback FE nếu BE chưa hỗ trợ owner
        if (filters?.owner === "admin") {
          list = list.filter((it) => (it.author?.role || "").toLowerCase() === "admin");
        } else if (filters?.owner === "user") {
          list = list.filter((it) => (it.author?.role || "").toLowerCase() !== "admin");
        }

        // ✅ Fallback FE: lọc theo free text + field tokens (author name, v.v.)
        if (qRaw) {
          list = list.filter((it) => matchPostByQuery(it, qRaw));
        }

        setItems(list);

        // total: nếu có q/owner (lọc FE) thì dùng độ dài sau lọc; còn lại dùng serverTotal
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

  useEffect(() => {
    load(1);
  }, [load]);

  return { items, total, page, limit, loading, error, reload: load, setPage };
}

export function usePostCrud() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const create = async (payload) => {
    setBusy(true);
    setError("");
    try {
      return await createPost(payload);
    } catch (e) {
      setError(e.message || "Create failed");
      throw e;
    } finally {
      setBusy(false);
    }
  };

  const update = async (id, patch) => {
    setBusy(true);
    setError("");
    try {
      return await updatePost(id, patch);
    } catch (e) {
      setError(e.message || "Update failed");
      throw e;
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    setBusy(true);
    setError("");
    try {
      return await deletePost(id);
    } catch (e) {
      setError(e.message || "Delete failed");
      throw e;
    } finally {
      setBusy(false);
    }
  };

  const changeCover = async (postId, fileId) => {
    setBusy(true);
    setError("");
    try {
      return await setCover(postId, fileId);
    } catch (e) {
      setError(e.message || "Set cover failed");
      throw e;
    } finally {
      setBusy(false);
    }
  };

  return { busy, error, create, update, remove, changeCover };
}
