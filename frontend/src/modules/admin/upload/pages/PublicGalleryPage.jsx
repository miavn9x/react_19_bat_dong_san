// // frontend/src/modules/admin/upload/pages/PublicGalleryPage.jsx
// import { useEffect, useMemo, useState } from "react";
// import useUploads from "../hooks/useUploads";
// import FiltersBar from "../components/FiltersBar";
// import MediaViewer from "../components/MediaViewer";
// import { FILE_BASE, toFileURL } from "../config/fileBase";

// export default function PublicGalleryPage() {
//   const token = localStorage.getItem("token");
//   const authed = !!token;

//   // Bộ lọc cho chế độ có đăng nhập
//   const [filters, setFilters] = useState({ bucket: "images" });
//   const { items, loading, error, reload } = useUploads({ filters, pageSize: 18 });

//   // Ô nhập tay khi không đăng nhập
//   const [manualUrl, setManualUrl] = useState("");

//   // Khi có đăng nhập -> nạp danh sách
//   useEffect(() => {
//     if (authed) reload(1);
//   }, [authed, reload]);

//   // URL đã được chuẩn hoá (prefix BE nếu là /uploads/...)
//   const resolvedUrl = useMemo(() => toFileURL(manualUrl), [manualUrl]);

//   // Đoán MIME từ URL đã chuẩn hoá
//   const resolvedType = useMemo(() => {
//     if (!resolvedUrl) return "";
//     if (/\.(png|jpe?g|webp|gif|svg)(\?|#|$)/i.test(resolvedUrl)) return "image/png";
//     if (/\.(mp4|webm|ogg|mov|mkv)(\?|#|$)/i.test(resolvedUrl))   return "video/mp4";
//     if (/\.(mp3|wav|aac|ogg)(\?|#|$)/i.test(resolvedUrl))        return "audio/mpeg";
//     return "";
//   }, [resolvedUrl]);

//   return (
//     <div style={{ padding: 16 }}>
//       <h2>Gallery – Xem media</h2>
//       <p>Không đăng nhập: dán URL tĩnh để xem. Đăng nhập: xem danh sách qua API.</p>

//       {/* Chế độ KHÔNG đăng nhập: chỉ hiển thị input + viewer */}
//       {!authed ? (
//         <div style={{ marginBottom: 16 }}>
//           <input
//             style={{ width: "80%" }}
//             placeholder={`${FILE_BASE}/uploads/images/YYYY/MM/DD/file.jpg`}
//             value={manualUrl}
//             onChange={(e) => setManualUrl(e.target.value)}
//           />
//           <div style={{ marginTop: 8, maxWidth: 720 }}>
//             <MediaViewer url={resolvedUrl} type={resolvedType} />
//           </div>
//         </div>
//       ) : (
//         // Chế độ CÓ đăng nhập: lọc + danh sách từ API
//         <>
//           <FiltersBar value={filters} onChange={setFilters} />
//           {loading && <p>Đang tải...</p>}
//           {/* Ẩn lỗi 401 khi chưa authed; ở đây đã authed nên cứ hiện */}
//           {error && <p style={{ color: "red" }}>{error}</p>}
//           <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px,1fr))", gap: 12 }}>
//             {items.map((f) => (
//               <div key={f._id} style={{ border: "1px solid #eee", borderRadius: 12, padding: 12 }}>
//                 {/* MediaViewer tự prefix host BE cho f.url dạng /uploads/... */}
//                 <MediaViewer url={f.url} type={f.type} />
//                 <div style={{ fontSize: 13, marginTop: 6 }}>{f.originalName}</div>
//               </div>
//             ))}
//           </div>
//         </>
//       )}
//     </div>
//   );
// }
// frontend/src/modules/admin/upload/pages/PublicGalleryPage.jsx
import { useEffect, useState } from "react";
import useUploads from "../hooks/useUploads";
import FiltersBar from "../components/FiltersBar";
import MediaViewer from "../components/MediaViewer";
import { FILE_BASE, toFileURL } from "../config/fileBase";

export default function PublicGalleryPage() {
  const token = localStorage.getItem("token");
  const authed = !!token;

  const [filters, setFilters] = useState({ bucket: "images" });
  const { items, loading, error, reload } = useUploads({ filters, pageSize: 18 });

  const [manualUrl, setManualUrl] = useState("");

  useEffect(() => { if (authed) reload(1); }, [authed, reload]);

  return (
    <div style={{ padding: 16 }}>
      <h2>Gallery – Xem media</h2>
      <p>Không đăng nhập: dán URL tĩnh để xem. Đăng nhập: xem danh sách qua API.</p>

      {!authed ? (
        <div style={{ marginBottom: 16 }}>
          <input
            style={{ width: "80%" }}
            placeholder={`${FILE_BASE}/uploads/images/YYYY/MM/DD/file.jpg`}
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
          />
          <div style={{ marginTop: 8, maxWidth: 720 }}>
            <MediaViewer
              url={toFileURL(manualUrl)}   // ⬅️ luôn thành URL tuyệt đối
              type={
                manualUrl.match(/\.(png|jpe?g|webp|gif|svg)$/i) ? "image/png" :
                manualUrl.match(/\.(mp4|webm|ogg|mov|mkv)$/i) ? "video/mp4" :
                manualUrl.match(/\.(mp3|wav|aac|ogg)$/i) ? "audio/mpeg" : ""
              }
            />
          </div>
        </div>
      ) : (
        <>
          <FiltersBar value={filters} onChange={setFilters} />
          {loading && <p>Đang tải...</p>}
          {error && <p style={{ color: "red" }}>{error}</p>}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(260px,1fr))", gap:12 }}>
            {items.map((f) => (
              <div key={f._id} style={{ border:"1px solid #eee", borderRadius:12, padding:12 }}>
                <MediaViewer url={f.url} type={f.type} /> {/* MediaViewer tự prefix */}
                <div style={{ fontSize:13, marginTop:6 }}>{f.originalName}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
