import { useCallback } from "react";
import useAdminUsers from "../hooks/useAdminUsers";
import UserTable from "../components/UserTable";

export default function UsersList() {
  const {
    items, total, page, limit, q, setPage, setLimit, setQ,
    loading, error, changeRole, remove, fetchData
  } = useAdminUsers();

  const onSubmitSearch = useCallback((e) => {
    e.preventDefault();
    setPage(1);
    fetchData({ page: 1 });
  }, [setPage, fetchData]);

  const onDelete = async (id) => {
    if (!confirm("Xác nhận xoá người dùng này?")) return;
    try { await remove(id); }
    catch (e) { alert(e?.response?.data?.message || "Xoá thất bại"); }
  };

  const onChangeRole = async (id, role) => {
    try { await changeRole(id, role); }
    catch (e) { alert(e?.response?.data?.message || "Cập nhật role thất bại"); }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">👥 Quản lý người dùng</h1>

      {/* Card chứa toàn bộ nội dung: flex-col + min-h để đẩy footer xuống đáy */}
      <div className="bg-white rounded-xl border shadow-sm p-4 flex flex-col min-h-[85vh]">
        <form onSubmit={onSubmitSearch} className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm theo tên, email, phone"
            className="w-full rounded-lg border px-3 py-2"
          />
          <button className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">
            Tìm
          </button>
        </form>

        {error && (
          <div className="mt-3 rounded border border-rose-200 bg-rose-50 p-3 text-rose-700">
            {error}
          </div>
        )}
        {loading && <div className="mt-3 text-sm text-gray-500">Đang tải...</div>}

        {/* Khu bảng chiếm phần còn lại */}
        <div className="mt-4 flex-1">
          <UserTable rows={items} onChangeRole={onChangeRole} onDelete={onDelete} />
        </div>

        {/* Phân trang: đẩy xuống đáy bằng mt-auto; có viền trên để tách nội dung */}
        <div className="mt-auto pt-4 border-t flex items-center justify-between text-sm text-gray-600">
          <div>Tổng: <b>{total}</b></div>
          <div className="flex items-center gap-2">
            <select
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value, 10))}
              className="rounded border px-2 py-1"
            >
              {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}/trang</option>)}
            </select>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="rounded border px-2 py-1 disabled:opacity-50"
              >Trước</button>
              <span>{page}/{totalPages}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="rounded border px-2 py-1 disabled:opacity-50"
              >Sau</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
