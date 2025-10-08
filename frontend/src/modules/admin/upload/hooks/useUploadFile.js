// frontend/src/modules/admin/upload/hooks/useUploadFile.js
import { useState } from "react";
import { uploadFile } from "../services/uploads.api";

export default function useUploadFile() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const run = async ({ bucket, file, label }) => {
    setLoading(true); setError("");
    try {
      return await uploadFile({ bucket, file, label });
    } catch (e) {
      setError(e.message || "Upload failed");
      throw e;
    } finally { setLoading(false); }
  };

  return { upload: run, loading, error };
}
