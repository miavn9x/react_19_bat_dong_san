export default function UserTable({ rows = [], onChangeRole, onDelete }) {
  return (
    <>
      {/* Mobile: card list */}
      <div className="md:hidden space-y-3">
        {rows.map((u) => (
          <div
            key={u._id}
            className="rounded-xl border bg-white p-3 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-medium text-gray-900 truncate">{u.name}</div>
                <div className="text-xs text-gray-600 truncate" title={u.email}>
                  {u.email}
                </div>
                <div className="mt-1 text-xs text-gray-500">{u.phone || "-"}</div>
                <div className="mt-1 text-xs text-gray-500">{u.address || "-"}</div>
              </div>

              <div className="shrink-0">
                <select
                  value={u.role}
                  onChange={(e) => onChangeRole(u._id, e.target.value)}
                  className="rounded border px-2 py-1 text-xs"
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </div>
            </div>

            <div className="mt-3 flex justify-end">
              <button
                onClick={() => onDelete(u._id)}
                className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs text-white hover:bg-rose-700"
              >
                Xoá
              </button>
            </div>
          </div>
        ))}

        {rows.length === 0 && (
          <div className="rounded-xl border bg-white p-6 text-center text-gray-500">
            Không có dữ liệu
          </div>
        )}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-3 py-2 text-left">Tên</th>
              <th className="px-3 py-2 text-left">Email</th>
              <th className="px-3 py-2 text-left">Điện thoại</th>
              <th className="px-3 py-2 text-left">Địa chỉ</th>
              <th className="px-3 py-2 text-left">Role</th>
              <th className="px-3 py-2 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u._id} className="border-t">
                <td className="px-3 py-2">{u.name}</td>
                <td className="px-3 py-2">{u.email}</td>
                <td className="px-3 py-2">{u.phone || "-"}</td>
                <td className="px-3 py-2">{u.address || "-"}</td>
                <td className="px-3 py-2">
                  <select
                    value={u.role}
                    onChange={(e) => onChangeRole(u._id, e.target.value)}
                    className="rounded border px-2 py-1"
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={() => onDelete(u._id)}
                    className="rounded-lg bg-rose-600 px-3 py-1.5 text-white hover:bg-rose-700"
                  >
                    Xoá
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-center text-gray-500" colSpan={5}>
                  Không có dữ liệu
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
