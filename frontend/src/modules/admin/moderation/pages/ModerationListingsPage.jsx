import { useMemo, useState } from "react";
import useModerationListings from "../hooks/useModerationListings";

export default function ModerationListingsPage() {
  const { items, loading, err, onApprove, onReject, helpers } = useModerationListings();
  const [q, setQ] = useState("");

  const view = useMemo(() => helpers.search(items, q), [items, q, helpers]);

  const rejectWithNote = async (id) => {
    const note = window.prompt("Nhập lý do từ chối (tuỳ chọn):", "");
    await onReject(id, note || "");
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <h1 className="text-xl font-semibold">Duyệt tin BĐS</h1>
        {loading && <div className="text-sm text-gray-500">Đang tải…</div>}
      </div>
      {err && <div className="text-sm text-rose-600">{err}</div>}

      <div className="flex items-center gap-2">
        <div className="relative">
          <input
            value={q}
            onChange={(e)=>setQ(e.target.value)}
            placeholder="Tìm theo tiêu đề/slug/tác giả…"
            className="rounded-lg border px-3 py-2 pl-9 text-sm bg-white"
          />
          <span className="absolute inset-y-0 left-2 grid place-items-center">
            <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" d="M21 21l-4.35-4.35M10 18a8 8 0 110-16 8 8 0 010 16z"/></svg>
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-3 py-2 text-left">Tiêu đề</th>
              <th className="px-3 py-2 text-left">Tác giả</th>
              <th className="px-3 py-2 text-left">Giá/Diện tích</th>
              <th className="px-3 py-2 text-left">Khu vực</th>
              <th className="px-3 py-2 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {view.map(p => (
              <tr key={p._id} className="border-t">
                <td className="px-3 py-2">
                  <div className="font-medium line-clamp-2">{p.title}</div>
                  <div className="text-xs text-gray-500">/{p.slug}</div>
                </td>
                <td className="px-3 py-2">{p.author?.name || "—"}</td>
                <td className="px-3 py-2">
                  {(p.listing?.price || 0).toLocaleString("vi-VN")} {p.listing?.currency || "VND"}
                  {" · "}
                  {p.listing?.area || 0} m²
                </td>
                <td className="px-3 py-2">
                  {[p.listing?.ward, p.listing?.district, p.listing?.city].filter(Boolean).join(", ")}
                </td>
                <td className="px-3 py-2 text-right space-x-2">
                  <button onClick={() => onApprove(p._id)}
                          className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-1 text-white hover:bg-emerald-700">
                    Duyệt
                  </button>
                  <button onClick={() => rejectWithNote(p._id)}
                          className="inline-flex items-center rounded-lg bg-rose-600 px-3 py-1 text-white hover:bg-rose-700">
                    Từ chối
                  </button>
                </td>
              </tr>
            ))}
            {view.length === 0 && !loading && (
              <tr><td colSpan={5} className="px-3 py-6 text-center text-gray-500">Không có tin chờ duyệt</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
