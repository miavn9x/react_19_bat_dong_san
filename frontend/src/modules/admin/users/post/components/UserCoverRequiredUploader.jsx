// frontend/src/modules/admin/post/components/CoverRequiredUploader.jsx
import { useEffect, useRef, useState } from "react";
import { useUserUploadMany, useUserUploadList } from "../../../admin/upload/hooks/useUserUploads";

export default function UserCoverRequiredUploader({ onChange, group = "" }) {
  const inputRef = useRef(null);
  const [fileDoc, setFileDoc] = useState(null);
  const { upload, progress, busy, error } = useUserUploadMany({ bucket: "images", batchSize: 1 });
  // Load lại list (nếu bạn muốn hiển thị ảnh đã up của group)
  useUserUploadList({ filters: { bucket: "images", group }, pageSize: 10 });

  useEffect(() => { onChange?.(fileDoc); }, [fileDoc, onChange]);

  const onPick = async (e) => {
    const files = e.target.files;
    if (!files || !files.length) return;
    // Up 1 file (ghi đè bìa cũ)
    const items = await upload({ files, group, startOrder: 0 });
    if (items && items[0]) setFileDoc(items[0]);
    // reset input để chọn lại được
    e.target.value = "";
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="px-3 py-2 rounded-lg border hover:bg-gray-50"
          disabled={busy}
        >
          {fileDoc ? "Đổi ảnh bìa" : "Chọn ảnh bìa"}
        </button>
        {busy && <div className="text-sm text-gray-500">Đang upload… {progress}%</div>}
        {error && <div className="text-sm text-rose-600">{error}</div>}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.gif,.webp"
        className="hidden"
        onChange={onPick}
      />

      {fileDoc ? (
        <div className="rounded-lg overflow-hidden border w-64">
          {/* fileDoc.url là /uploads/... đã trả về từ BE */}
          <img src={fileDoc.url} alt="cover" className="w-full h-40 object-cover" />
        </div>
      ) : (
        <div className="text-xs text-gray-500">Yêu cầu 1 ảnh bìa (jpg/png/webp)…</div>
      )}
    </div>
  );
}
