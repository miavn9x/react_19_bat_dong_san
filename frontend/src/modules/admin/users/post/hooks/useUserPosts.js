// frontend/src/modules/admin/users/post/hooks/useUserPosts.js
import { useState } from "react";
import { createPost, updatePost, setCover } from "../services/userPosts.service";


export function useUserPostCrud() {
  const [busy, setBusy] = useState(false);
  const [error, setErr] = useState("");

  const create = async (payload) => {
    setBusy(true); setErr("");
    try { return await createPost(payload); }
    catch (e) { setErr(e.message || "Create failed"); throw e; }
    finally { setBusy(false); }
  };

  const update = async (id, patch) => {
    setBusy(true); setErr("");
    try { return await updatePost(id, patch); }
    catch (e) { setErr(e.message || "Update failed"); throw e; }
    finally { setBusy(false); }
  };

  const changeCover = async (postId, fileId) => {
    setBusy(true); setErr("");
    try { return await setCover(postId, fileId); }
    catch (e) { setErr(e.message || "Set cover failed"); throw e; }
    finally { setBusy(false); }
  };

  return { busy, error, create, update, changeCover };
}
