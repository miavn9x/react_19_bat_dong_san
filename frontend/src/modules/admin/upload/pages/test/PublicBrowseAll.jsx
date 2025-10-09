// frontend/src/modules/admin/upload/pages/test/PublicBrowseAll.jsx
import { useCallback, useEffect, useState } from "react";
import { listFiles } from "../../services/adminUploads.service";
import MediaViewer from "../../components/MediaViewer";

/** Trang public: xem media không cần đăng nhập */
export default function PublicBrowseAll() {
  const [bucket, setBucket] = useState("");
  const [q, setQ] = useState("");

  const [state, setState] = useState({
    items: [],
    total: 0,
    page: 1,
    limit: 24,
    loading: false,
    error: "",
  });

  // Load list (memo hoá để đúng deps cho useEffect/pagination)
  const load = useCallback(
    async (page = 1) => {
      setState((s) => ({ ...s, loading: true, error: "" }));
      try {
        const data = await listFiles({ bucket, q, page, limit: 24 });
        setState({
          items: data.items,
          total: data.total,
          page: data.page,
          limit: data.limit,
          loading: false,
          error: "",
        });
      } catch (e) {
        setState((s) => ({ ...s, loading: false, error: e.message || "Load failed" }));
      }
    },
    [bucket, q]
  );

  // Tự load khi thay đổi bộ lọc
  useEffect(() => {
    load(1);
  }, [load]);

  const { items, total, page, limit, loading, error } = state;

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold">Public Browse (No Auth)</h2>

      <div className="flex items-center gap-3">
        <select
          className="border rounded-lg px-3 py-2"
          value={bucket}
          onChange={(e) => setBucket(e.target.value)}
        >
          <option value="">Tất cả</option>
          <option value="images">images</option>
          <option value="videos">videos</option>
          <option value="audios">audios</option>
        </select>

        <input
          className="border rounded-lg px-3 py-2"
          placeholder="Tìm theo tên"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {loading && <p>Đang tải...</p>}
      {error && <p className="text-red-600">{error}</p>}

      <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
        {items.map((f) => (
          <div key={f._id} className="border rounded-xl p-3">
            <MediaViewer url={f.url} type={f.type} />
            <div className="text-sm mt-2 space-y-1">
              <div className="font-semibold">{f.originalName}</div>
              <div className="text-gray-600">
                {f.bucket} • {f.type}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <span>Tổng: {total}</span>
        <button
          className="px-3 py-1 rounded-lg border disabled:opacity-50"
          disabled={page <= 1}
          onClick={() => load(page - 1)}
        >
          Trước
        </button>
        <button
          className="px-3 py-1 rounded-lg border disabled:opacity-50"
          disabled={page * limit >= total}
          onClick={() => load(page + 1)}
        >
          Sau
        </button>
      </div>
    </div>
  );
}
