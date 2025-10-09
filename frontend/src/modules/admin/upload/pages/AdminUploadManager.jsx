// //frontend/src/modules/admin/upload/pages/AdminUploadManager.jsx
// // Trang quản lý upload trong admin
// // Trang quản lý upload trong admin (CRUD + upload batch có %)
// import { useMemo, useState } from "react";
// import { useAdminCrud, useAdminUploadList, useAdminUploadMany, useUploadLimit } from "../hooks/useAdminUploads";
// import UploadDropzone from "../components/UploadDropzone";
// import ProgressBar from "../components/ProgressBar";
// import MediaViewer from "../components/MediaViewer";

// export default function AdminUploadManager() {
//   const [bucket, setBucket] = useState("images");
//   const [group, setGroup] = useState(""); // ví dụ: post:6612abc
//   const [filters, setFilters] = useState({ bucket: "images" });

//   const { items, total, page, limit, loading, error, reload } =
//     useAdminUploadList({ filters, pageSize: 24 });

//   const { upload, progress, busy, cancel } =
//     useAdminUploadMany({ bucket, batchSize: 6 });

//   const { limit: maxBytes } = useUploadLimit(bucket);

//   const accept = useMemo(
//     () => (bucket === "images" ? "image/*" : bucket === "videos" ? "video/*" : "audio/*"),
//     [bucket]
//   );

//   const onSelect = async (files) => {
//     const labels = files.map(() => ""); // placeholder label theo thứ tự
//     await upload({ files, group, startOrder: 0, labels });
//     reload(1);
//   };

//   return (
//     <div className="p-4 space-y-4">
//       <h2 className="text-xl font-semibold">Admin Upload Manager</h2>

//       <div className="flex flex-wrap items-center gap-3">
//         <select
//           className="border rounded-lg px-3 py-2"
//           value={bucket}
//           onChange={(e) => {
//             setBucket(e.target.value);
//             setFilters((f) => ({ ...f, bucket: e.target.value }));
//           }}
//         >
//           <option value="images">images</option>
//           <option value="videos">videos</option>
//           <option value="audios">audios</option>
//         </select>

//         <input
//           className="border rounded-lg px-3 py-2 w-[280px]"
//           placeholder="Group (vd: post:6612...)"
//           value={group}
//           onChange={(e) => setGroup(e.target.value)}
//         />

//         {typeof maxBytes === "number" && (
//           <span className="text-sm text-gray-600">
//             Giới hạn: {(maxBytes / (1024 * 1024)).toFixed(0)} MB / file
//           </span>
//         )}
//       </div>

//       <UploadDropzone multiple accept={accept} onSelect={onSelect} />

//       {busy && (
//         <div className="space-y-2">
//           <div>Đang upload... {progress}%</div>
//           <ProgressBar value={progress} />
//           <button className="px-3 py-1 rounded-lg border" onClick={cancel}>Hủy</button>
//         </div>
//       )}

//       {error && <p className="text-red-600">{error}</p>}
//       {loading && <p>Đang tải...</p>}

//       <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
//         {items.map((it) => (
//           <div key={it._id} className="border rounded-xl p-3">
//             <MediaViewer url={it.url} type={it.type} />
//             <div className="text-sm mt-2 space-y-1">
//               <div className="font-semibold">{it.originalName}</div>
//               <div className="text-gray-600">{it.bucket} • {it.type}</div>
//               <div className="text-gray-600">
//                 {it.year}-{String(it.month).padStart(2, "0")}-{String(it.day).padStart(2, "0")}
//               </div>
//               {it.group && <div>group: {it.group}</div>}
//               <div>order: {it.order}</div>
//               {it.label && <div>label: {it.label}</div>}
//             </div>

//             <AdminRow file={it} onChanged={() => reload(page)} />
//           </div>
//         ))}
//       </div>

//       <div className="flex items-center gap-2">
//         <span>Tổng: {total}</span>
//         <button
//           className="px-3 py-1 rounded-lg border disabled:opacity-50"
//           disabled={page <= 1}
//           onClick={() => reload(page - 1)}
//         >
//           Trước
//         </button>
//         <button
//           className="px-3 py-1 rounded-lg border disabled:opacity-50"
//           disabled={page * limit >= total}
//           onClick={() => reload(page + 1)}
//         >
//           Sau
//         </button>
//       </div>
//     </div>
//   );
// }

// function AdminRow({ file, onChanged }) {
//   const { update, replace, remove } = useAdminCrud();

//   const [label, setLabel] = useState(file.label || "");
//   const [order, setOrder] = useState(file.order || 0);
//   const [group, setGroup] = useState(file.group || "");

//   const [busy, setBusy] = useState(false);
//   const [p, setP] = useState(0);

//   // Lưu meta (label/group/order)
//   const doUpdate = async () => {
//     setBusy(true);
//     await update({ id: file._id, patch: { label, group, order: Number(order) } });
//     setBusy(false);
//     onChanged?.();
//   };

//   // Thay file
//   const doReplace = async (e) => {
//     const nf = e.target.files?.[0]; if (!nf) return;
//     setBusy(true);
//     await replace({ id: file._id, bucket: file.bucket, file: nf, onProgress: (x) => setP(x) });
//     setBusy(false);
//     setP(0);
//     onChanged?.();
//   };

//   // Xoá file
//   const doDelete = async () => {
//     if (!confirm("Xóa file này?")) return;
//     setBusy(true);
//     await remove({ id: file._id });
//     setBusy(false);
//     onChanged?.();
//   };

//   return (
//     <div className="mt-2 grid grid-cols-[1fr_1fr_1fr_auto_auto] items-center gap-2">
//       <input
//         className="border rounded-lg px-2 py-1"
//         value={label}
//         onChange={(e) => setLabel(e.target.value)}
//         placeholder="label"
//       />
//       <input
//         className="border rounded-lg px-2 py-1"
//         value={group}
//         onChange={(e) => setGroup(e.target.value)}
//         placeholder="group"
//       />
//       <input
//         className="border rounded-lg px-2 py-1"
//         value={order}
//         onChange={(e) => setOrder(e.target.value)}
//         type="number"
//         placeholder="order"
//       />

//       <button
//         className="px-3 py-1 rounded-lg border bg-black text-white"
//         disabled={busy}
//         onClick={doUpdate}
//         title="Lưu meta"
//       >
//         Lưu
//       </button>

//       <label className="px-3 py-1 rounded-lg border cursor-pointer text-center">
//         Thay file
//         <input type="file" hidden onChange={doReplace} />
//       </label>

//       <button className="px-3 py-1 rounded-lg border text-red-600" disabled={busy} onClick={doDelete}>
//         Xóa
//       </button>

//       {p > 0 && (
//         <div className="col-[1/-1]">
//           <ProgressBar value={p} />
//         </div>
//       )}
//     </div>
//   );
// }
//frontend/src/modules/admin/upload/pages/AdminUploadManager.jsx
import { useMemo, useState } from "react";
import { useAdminCrud, useAdminUploadList, useAdminUploadMany, useUploadLimit } from "../hooks/useAdminUploads";
import UploadDropzone from "../components/UploadDropzone";
import ProgressBar from "../components/ProgressBar";
import MediaViewer from "../components/MediaViewer";

export default function AdminUploadManager() {
  const [bucket, setBucket] = useState("images");
  const [group, setGroup] = useState("");
  const [filters, setFilters] = useState({ bucket: "images" });

  const { items, total, page, limit, loading, error, reload } =
    useAdminUploadList({ filters, pageSize: 24 });

  const { upload, progress, busy, cancel } =
    useAdminUploadMany({ bucket, batchSize: 6 });

  const { limit: maxBytes } = useUploadLimit(bucket);

  const accept = useMemo(
    () => (bucket === "images" ? "image/*" : bucket === "videos" ? "video/*" : "audio/*"),
    [bucket]
  );

  const onSelect = async (files) => {
    const labels = files.map(() => "");
    await upload({ files, group, startOrder: 0, labels });
    reload(1);
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold">Admin Upload Manager</h2>

      <div className="flex flex-wrap items-center gap-3">
        <select
          className="border rounded-lg px-3 py-2"
          value={bucket}
          onChange={(e) => {
            setBucket(e.target.value);
            setFilters((f) => ({ ...f, bucket: e.target.value }));
          }}
        >
          <option value="images">images</option>
          <option value="videos">videos</option>
          <option value="audios">audios</option>
        </select>

        <input
          className="border rounded-lg px-3 py-2 w-[280px]"
          placeholder="Group (vd: post:6612...)"
          value={group}
          onChange={(e) => setGroup(e.target.value)}
        />

        {typeof maxBytes === "number" && (
          <span className="text-sm text-gray-600">
            Giới hạn: {(maxBytes / (1024 * 1024)).toFixed(0)} MB / file
          </span>
        )}
      </div>

      <UploadDropzone multiple accept={accept} onSelect={onSelect} />

      {busy && (
        <div className="space-y-2">
          <div>Đang upload... {progress}%</div>
          <ProgressBar value={progress} />
          <button className="px-3 py-1 rounded-lg border" onClick={cancel}>Hủy</button>
        </div>
      )}

      {error && <p className="text-red-600">{error}</p>}
      {loading && <p>Đang tải...</p>}

      <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
        {items.map((it) => (
          <div key={it._id} className="border rounded-xl p-3">
            <MediaViewer url={it.url} type={it.type} />

            <div className="text-sm mt-2 space-y-1 break-words">
              <div className="font-semibold truncate" title={it.originalName}>{it.originalName}</div>
              <div className="text-gray-600">{it.bucket} • {it.type}</div>
              <div className="text-gray-600">
                {it.year}-{String(it.month).padStart(2, "0")}-{String(it.day).padStart(2, "0")}
              </div>
              {it.group && <div className="truncate" title={it.group}>group: {it.group}</div>}
              <div>order: {it.order}</div>
              {it.label && <div className="truncate" title={it.label}>label: {it.label}</div>}
            </div>

            <AdminRow file={it} onChanged={() => reload(page)} />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <span>Tổng: {total}</span>
        <button
          className="px-3 py-1 rounded-lg border disabled:opacity-50"
          disabled={page <= 1}
          onClick={() => reload(page - 1)}
        >
          Trước
        </button>
        <button
          className="px-3 py-1 rounded-lg border disabled:opacity-50"
          disabled={page * limit >= total}
          onClick={() => reload(page + 1)}
        >
          Sau
        </button>
      </div>
    </div>
  );
}

function AdminRow({ file, onChanged }) {
  const { update, replace, remove } = useAdminCrud();

  const [label, setLabel] = useState(file.label || "");
  const [order, setOrder] = useState(file.order || 0);
  const [group, setGroup] = useState(file.group || "");

  const [busy, setBusy] = useState(false);
  const [p, setP] = useState(0);

  const doUpdate = async () => {
    setBusy(true);
    await update({ id: file._id, patch: { label, group, order: Number(order) } });
    setBusy(false);
    onChanged?.();
  };

  const doReplace = async (e) => {
    const nf = e.target.files?.[0]; if (!nf) return;
    setBusy(true);
    await replace({ id: file._id, bucket: file.bucket, file: nf, onProgress: (x) => setP(x) });
    setBusy(false);
    setP(0);
    onChanged?.();
  };

  const doDelete = async () => {
    if (!confirm("Xóa file này?")) return;
    setBusy(true);
    await remove({ id: file._id });
    setBusy(false);
    onChanged?.();
  };

  return (
    <div className="mt-3 space-y-2">
      {/* Hàng inputs */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-2">
        <input
          className="border rounded-lg px-2 py-1 h-9 w-full min-w-0 text-sm"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="label"
        />
        <input
          className="border rounded-lg px-2 py-1 h-9 w-full min-w-0 text-sm"
          value={group}
          onChange={(e) => setGroup(e.target.value)}
          placeholder="group"
        />
        <input
          className="border rounded-lg px-2 py-1 h-9 w-full min-w-0 text-sm"
          value={order}
          onChange={(e) => setOrder(e.target.value)}
          type="number"
          placeholder="order"
        />
      </div>

      {/* Hàng action icon */}
      <div className="flex items-center gap-2">
        {/* Lưu */}
        <button
          type="button"
          title="Lưu meta"
          onClick={doUpdate}
          disabled={busy}
          className="inline-flex items-center justify-center rounded-lg border px-3 h-9 bg-black text-white hover:opacity-90 disabled:opacity-50"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" className="mr-2"><path fill="currentColor" d="M17 3H5a2 2 0 0 0-2 2v14l4-4h10a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2"/></svg>
          <span className="text-sm">Lưu</span>
        </button>

        {/* Thay file */}
        <label
          title="Thay file"
          className="inline-flex items-center justify-center rounded-lg border px-3 h-9 cursor-pointer hover:bg-gray-50"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" className="mr-2"><path fill="currentColor" d="M5 20h14v-2H5v2Zm7-16l-5 5h3v4h4v-4h3l-5-5Z"/></svg>
          <span className="text-sm">Thay file</span>
          <input type="file" hidden onChange={doReplace} />
        </label>

        {/* Xóa */}
        <button
          type="button"
          title="Xóa file"
          onClick={doDelete}
          disabled={busy}
          className="inline-flex items-center justify-center rounded-lg border px-3 h-9 text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" className="mr-2"><path fill="currentColor" d="M6 7h12l-1 14H7L6 7Zm3-3h6l1 2H8l1-2Z"/></svg>
          <span className="text-sm">Xóa</span>
        </button>
      </div>

      {/* Progress full width */}
      {p > 0 && (
        <div className="col-span-full">
          <ProgressBar value={p} />
        </div>
      )}
    </div>
  );
}

