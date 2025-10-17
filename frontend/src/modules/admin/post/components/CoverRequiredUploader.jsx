// frontend/src/modules/admin/post/components/CoverRequiredUploader.jsx
import { useMemo, useState } from "react";
import UploadDropzone from "../../upload/components/UploadDropzone";
import { useAdminUploadMany } from "../../upload/hooks/useAdminUploads";
import { deleteFile } from "../../upload/services/adminUploads.service";
import { toFileURL } from "../../upload/config/api";

function makeTempGroup() {
  const n = Math.random().toString(36).slice(2, 8);
  const t = Date.now().toString(36);
  return `temp:post-cover:${t}-${n}`;
}

/**
 * - Bắt buộc 1 ảnh bìa trước khi tạo bài viết.
 * - Upload 1 hình -> onChange(fileDoc)
 * - Thay ảnh: xoá ảnh cũ rồi upload ảnh mới.
 */
export default function CoverRequiredUploader({ onChange, initialFile = null }) {
  const [tempGroup] = useState(() => makeTempGroup());
  const [fileDoc, setFileDoc] = useState(initialFile);
  const { upload, progress, busy } = useAdminUploadMany({ bucket: "images", batchSize: 1 });

  const previewSrc = useMemo(() => (fileDoc?.url ? toFileURL(fileDoc.url) : ""), [fileDoc]);

  const handleUploadOne = async (file) => {
    // Có ảnh cũ => xoá trước
    if (fileDoc?._id) {
      try { await deleteFile({ id: fileDoc._id }); } catch (e) { void e; }
      setFileDoc(null);
      onChange?.(null);
    }

    const resp = await upload({
      files: [file],
      bucket: "images",
      group: tempGroup,
      startOrder: 0,
    });

    const created = Array.isArray(resp) ? resp[0] : resp?.items?.[0];
    if (created?._id) {
      setFileDoc(created);
      onChange?.(created);
    }
  };

  const handleRemove = async () => {
    if (!fileDoc?._id) return;
    try { await deleteFile({ id: fileDoc._id }); } catch (e) { void e; }
    setFileDoc(null);
    onChange?.(null);
  };

  return (
    <div className="space-y-3">
      {!fileDoc && (
        <UploadDropzone
          multiple={false}
          accept="image/*"
          onSelect={async (files) => {
            const f = files?.[0];
            if (f) await handleUploadOne(f);
          }}
        />
      )}

      {busy && <div className="text-sm text-gray-600">Đang tải... {progress}%</div>}

      {fileDoc && (
        <div className="flex items-center gap-3">
          <img src={previewSrc} alt="Ảnh bìa" className="h-24 w-32 object-cover rounded-xl border" />
          <div className="space-x-2">
            <label className="px-3 py-1.5 rounded-lg border hover:bg-gray-50 cursor-pointer">
              Thay ảnh
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) await handleUploadOne(f);
                  e.target.value = "";
                }}
              />
            </label>
            <button
              className="px-3 py-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700"
              onClick={handleRemove}
            >
              Xoá ảnh
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
