import { useCallback, useEffect, useState } from "react";
import { getMe, updateMe } from "../services/user";

export default function useProfile() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchMe = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getMe();
      setMe(data);
      localStorage.setItem("user", JSON.stringify(data)); // đồng bộ guard
    } catch (e) {
      setError(e?.response?.data?.message || "Không tải được hồ sơ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  const save = useCallback(async (patch) => {
    setSaving(true);
    setError("");
    try {
      const data = await updateMe(patch);
      setMe(data);
      localStorage.setItem("user", JSON.stringify(data));
      return data;
    } catch (e) {
      const msg = e?.response?.data?.message || "Lưu thất bại";
      setError(msg);
      throw new Error(msg);
    } finally {
      setSaving(false);
    }
  }, []);

  return { me, loading, error, fetchMe, save, saving };
}
