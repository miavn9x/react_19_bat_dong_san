import { useEffect, useMemo, useState } from "react";
import FiltersBar from "../components/FiltersBar";
import MediaViewer from "../components/MediaViewer";
import { FILE_BASE, toFileURL } from "../config/fileBase";
import { listFiles, listFilesPublic } from "../services/uploads.api";

export default function PublicGalleryPage() {
  const authed = !!localStorage.getItem("token");

  const [filters, setFilters] = useState({ bucket: "images" });
  const [state, setState] = useState({ items: [], total: 0, page: 1, limit: 18, loading: false, error: "" });

  const load = async (page = 1) => {
    setState((s) => ({ ...s, loading: true, error: "" }));
    try {
      const fn = authed ? listFiles : listFilesPublic; // ⬅️ chưa login dùng public API
      const data = await fn({ ...filters, page, limit: state.limit });
      setState({ items: data.items, total: data.total, page: data.page, limit: data.limit, loading: false, error: "" });
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: e.message || "Load failed" }));
    }
  };

  useEffect(() => { load(1); /* eslint-disable-line react-hooks/exhaustive-deps */ }, [authed, JSON.stringify(filters)]);

  // Ô nhập tay khi không đăng nhập (tuỳ chọn)
  const [manualUrl, setManualUrl] = useState("");
  const resolvedUrl = useMemo(() => toFileURL(manualUrl), [manualUrl]);
  const resolvedType = useMemo(() => {
    if (!resolvedUrl) return "";
    if (/\.(png|jpe?g|webp|gif|svg)(\?|#|$)/i.test(resolvedUrl)) return "image/png";
    if (/\.(mp4|webm|ogg|mov|mkv)(\?|#|$)/i.test(resolvedUrl))   return "video/mp4";
    if (/\.(mp3|wav|aac|ogg)(\?|#|$)/i.test(resolvedUrl))        return "audio/mpeg";
    return "";
  }, [resolvedUrl]);

  return (
    <div style={{ padding: 16 }}>
      <h2>Gallery – Xem media</h2>
      <p>Không đăng nhập: xem danh sách public và có thể dán URL tĩnh. Đăng nhập: xem danh sách qua API đầy đủ.</p>

      {/* Ô dán URL luôn hiển thị, nhất là cho khách */}
      {!authed && (
        <div style={{ marginBottom: 16 }}>
          <input
            style={{ width: "80%" }}
            placeholder={`${FILE_BASE}/uploads/images/YYYY/MM/DD/file.jpg`}
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
          />
          <div style={{ marginTop: 8, maxWidth: 720 }}>
            <MediaViewer url={resolvedUrl} type={resolvedType} />
          </div>
        </div>
      )}

      <FiltersBar value={filters} onChange={setFilters} />
      {state.loading && <p>Đang tải...</p>}
      {state.error && <p style={{ color: "red" }}>{state.error}</p>}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(260px,1fr))", gap:12 }}>
        {state.items.map((f) => (
          <div key={f._id} style={{ border:"1px solid #eee", borderRadius:12, padding:12 }}>
            {/* url trả về dạng /uploads/... → MediaViewer tự prefix host BE */}
            <MediaViewer url={f.url} type={f.type} />
            <div style={{ fontSize:13, marginTop:6 }}>{f.originalName}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 12 }}>
        <button disabled={state.page <= 1} onClick={() => load(state.page - 1)}>Trước</button>
        <span style={{ margin: "0 8px" }}>Trang {state.page}</span>
        <button disabled={state.page * state.limit >= state.total} onClick={() => load(state.page + 1)}>Sau</button>
      </div>
    </div>
  );
}
