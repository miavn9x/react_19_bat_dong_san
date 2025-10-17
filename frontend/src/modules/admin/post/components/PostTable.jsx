// frontend/src/modules/admin/post/components/PostTable.jsx
import { toFileURL } from "../../upload/config/api";

function StatusBadge({ value }) {
  const mapBg = {
    draft: "bg-gray-100 text-gray-700",
    published: "bg-green-100 text-green-700",
    archived: "bg-yellow-100 text-yellow-800",
  };
  const mapLabel = {
    draft: "Chưa duyệt",
    published: "Đã duyệt",
    archived: "Ẩn",
  };
  const cls = mapBg[value] || "bg-gray-100 text-gray-700";
  const label = mapLabel[value] || "Không rõ";
  return <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{label}</span>;
}

function fmtDate(s) { if (!s) return ""; const d = new Date(s); return d.toLocaleString(); }

function Highlight({ text = "", query = "" }) {
  if (!query) return <>{text}</>;
  const q = query.trim();
  if (!q) return <>{text}</>;
  const norm = (s) =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
  const t = String(text);
  const nt = norm(t);
  const nq = norm(q);
  const idx = nt.indexOf(nq);
  if (idx === -1) return <>{text}</>;
  const head = t.slice(0, idx);
  const mid = t.slice(idx, idx + q.length);
  const tail = t.slice(idx + q.length);
  return (
    <>
      {head}
      <mark className="bg-yellow-200">{mid}</mark>
      {tail}
    </>
  );
}

export default function PostTable({
  rows = [],
  page = 1,
  total = 0,
  limit = 12,
  onEdit,
  onDelete,
  onSetCover,
  onChangeStatus,
  query = "",
}) {
  const pages = Math.max(1, Math.ceil((total || 0) / (limit || 1)));

  const canApprove = (p) => p.status !== "published";
  const canArchive = (p) => p.status === "published"; // ✅ chỉ ẩn khi đã public

  return (
    <div className="space-y-3">
      {/* MOBILE */}
      <div className="grid gap-3 md:hidden">
        {rows.map((p) => (
          <article key={p._id} className="rounded-xl border bg-white p-3">
            <div className="flex items-start gap-3">
              <div className="shrink-0">
                {p.coverFile?.url ? (
                  <img src={toFileURL(p.coverFile.url)} alt="cover" className="h-20 w-28 object-cover rounded-lg border" />
                ) : (
                  <div className="h-20 w-28 rounded-lg bg-gray-100 border" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium text-sm leading-5 line-clamp-2">
                    <Highlight text={p.title} query={query} />
                  </h3>
                  <StatusBadge value={p.status} />
                </div>
                <div className="mt-1 text-[11px] text-gray-500 break-all">/<Highlight text={p.slug} query={query} /></div>
                <div className="mt-1 text-xs text-gray-600 flex flex-wrap gap-x-3 gap-y-1">
                  <span><b>Tác giả:</b> <Highlight text={p.author?.name || "—"} query={query} /></span>
                  <span className="opacity-60">•</span>
                  <span><b>Xuất bản:</b> {fmtDate(p.publishedAt) || "—"}</span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button className="px-2.5 py-1.5 rounded-lg border bg-white text-xs hover:bg-gray-50" onClick={() => onSetCover?.(p)}>
                    Sửa ảnh bìa
                  </button>
                  <button className="px-2.5 py-1.5 rounded-lg bg-indigo-600 text-white text-xs hover:bg-indigo-700" onClick={() => onEdit?.(p)}>
                    Sửa nội dung
                  </button>
                  {canApprove(p) && (
                    <button
                      className="px-2.5 py-1.5 rounded-lg bg-green-600 text-white text-xs hover:bg-green-700"
                      onClick={() => onChangeStatus?.(p, "published")}
                      title="Đánh dấu là ĐÃ DUYỆT"
                    >
                      Duyệt
                    </button>
                  )}
                  {canArchive(p) && (
                    <button
                      className="px-2.5 py-1.5 rounded-lg bg-yellow-600 text-white text-xs hover:bg-yellow-700"
                      onClick={() => onChangeStatus?.(p, "archived")}
                      title="Ẩn khỏi công khai"
                    >
                      Ẩn
                    </button>
                  )}
                  <button className="px-2.5 py-1.5 rounded-lg bg-red-600 text-white text-xs hover:bg-red-700" onClick={() => onDelete?.(p)}>
                    Xoá
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
        {rows.length === 0 && <div className="rounded-xl border bg-white p-6 text-center text-gray-500">Không có dữ liệu</div>}
      </div>

      {/* DESKTOP */}
      <div className="hidden md:block overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 sticky top-0 z-10">
            <tr>
              <th className="px-3 py-2 text-left">Tiêu đề</th>
              <th className="px-3 py-2 text-left">Ảnh</th>
              <th className="px-3 py-2 text-left">Trạng thái</th>
              <th className="px-3 py-2 text-left">Xuất bản</th>
              <th className="px-3 py-2 text-left">Tác giả</th>
              <th className="px-3 py-2 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p._id} className="border-t">
                <td className="px-3 py-2 align-top">
                  <div className="font-medium line-clamp-2"><Highlight text={p.title} query={query} /></div>
                  <div className="text-xs text-gray-500 break-all">/<Highlight text={p.slug} query={query} /></div>
                </td>
                <td className="px-3 py-2 align-top">
                  {p.coverFile?.url ? (
                    <img src={toFileURL(p.coverFile.url)} alt="cover" className="w-16 h-12 object-cover rounded border" />
                  ) : (
                    <div className="w-16 h-12 bg-gray-100 rounded border" />
                  )}
                </td>
                <td className="px-3 py-2 align-top"><StatusBadge value={p.status} /></td>
                <td className="px-3 py-2 align-top">{fmtDate(p.publishedAt)}</td>
                <td className="px-3 py-2 align-top"><Highlight text={p.author?.name || "—"} query={query} /></td>
                <td className="px-3 py-2 text-right align-top">
                  <div className="inline-flex flex-wrap gap-2">
                    <button className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200" onClick={() => onSetCover?.(p)}>Sửa ảnh bìa</button>
                    <button className="px-2 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700" onClick={() => onEdit?.(p)}>Sửa nội dung</button>
                    {canApprove(p) && (
                      <button className="px-2 py-1 rounded bg-green-600 text-white hover:bg-green-700" onClick={() => onChangeStatus?.(p, "published")}>
                        Duyệt
                      </button>
                    )}
                    {canArchive(p) && (
                      <button className="px-2 py-1 rounded bg-yellow-600 text-white hover:bg-yellow-700" onClick={() => onChangeStatus?.(p, "archived")}>
                        Ẩn
                      </button>
                    )}
                    <button className="px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700" onClick={() => onDelete?.(p)}>Xoá</button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-500">Không có dữ liệu</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-1 sm:px-2 text-xs sm:text-sm text-gray-600">
        <div>Tổng: {total}</div>
        <div>Trang {page} / {pages}</div>
      </div>
    </div>
  );
}
