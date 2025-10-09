//frontend/src/modules/admin/upload/pages/serUploadManager.jsx
// Trang quản lý upload cho user (đã login), upload nhiều + % tiến trình
import { useMemo, useState } from "react";
import { useUserUploadList, useUserUploadMany, useUploadLimit } from "../hooks/useUserUploads";
import UploadDropzone from "../components/UploadDropzone";
import ProgressBar from "../components/ProgressBar";
import MediaViewer from "../components/MediaViewer";

export default function UserUploadManager() {
  const [bucket, setBucket] = useState("images");
  const [group, setGroup] = useState("");
  const [filters, setFilters] = useState({ bucket: "images" });

  const { items, total, page, limit, loading, error, reload } =
    useUserUploadList({ filters, pageSize: 18 });

  const { upload, progress, busy, cancel } =
    useUserUploadMany({ bucket });

  const { limit: maxBytes } = useUploadLimit(bucket);

  const accept = useMemo(
    () => (bucket === "images" ? "image/*" : bucket === "videos" ? "video/*" : "audio/*"),
    [bucket]
  );

  const onSelect = async (files) => {
    await upload({ files, group, startOrder: 0 });
    reload(1);
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-semibold">User Upload Manager</h2>

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
        {items.map((f) => (
          <div key={f._id} className="border rounded-xl p-3">
            <MediaViewer url={f.url} type={f.type} />
            <div className="text-sm mt-2 space-y-1">
              <b>{f.originalName}</b>
              {f.group && <div>group: {f.group}</div>}
              <div>order: {f.order}</div>
            </div>
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
