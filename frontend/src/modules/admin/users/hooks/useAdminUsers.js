import { useCallback, useEffect, useState } from "react";
import { listUsers, updateUserRole, deleteUser } from "../services/adminUsers";

export default function useAdminUsers() {
  const [items, setItems]   = useState([]);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(1);
  const [limit, setLimit]   = useState(10);
  const [q, setQ]           = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const fetchData = useCallback(async (opt = {}) => {
    setLoading(true);
    setError("");
    try {
      const params = { page, limit, q, ...opt };
      const res = await listUsers(params);
      setItems(res.items || []);
      setTotal(res.total || 0);
      setPage(res.page || 1);
      setLimit(res.limit || limit);
    } catch (e) {
      setError(e?.response?.data?.message || "Không tải được danh sách người dùng");
    } finally {
      setLoading(false);
    }
  }, [page, limit, q]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const changeRole = useCallback(async (id, role) => {
    await updateUserRole(id, role);
    await fetchData();
  }, [fetchData]);

  const remove = useCallback(async (id) => {
    await deleteUser(id);
    await fetchData();
  }, [fetchData]);

  return {
    items, total, page, limit, q,
    setPage, setLimit, setQ,
    loading, error,
    fetchData, changeRole, remove
  };
}
