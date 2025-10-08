// frontend/src/modules/admin/upload/pages/AdminUploadsPage.jsx
import { useState } from "react";
import useUploads from "../hooks/useUploads";
import useUploadFile from "../hooks/useUploadFile";
import FiltersBar from "../components/FiltersBar";
import UploadDropzone from "../components/UploadDropzone";
import FileCard from "../components/FileCard";
import AdminActions from "../components/AdminActions";

export default function AdminUploadsPage() {
  const [filters, setFilters] = useState({ bucket: "images" });
  const { items, total, page, limit, loading, error, reload } = useUploads({ filters, pageSize: 24 });
  const { upload, loading: uploading } = useUploadFile();

  const onSelect = async (file) => {
    const bucket = filters.bucket || "images";
    await upload({ bucket, file });
    reload(1);
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Uploads Admin – Quản lý & CRUD</h2>
      <FiltersBar value={filters} onChange={setFilters} />
      <UploadDropzone onSelect={onSelect} accept={
        filters.bucket === "images" ? "image/*" : filters.bucket === "videos" ? "video/*" : "audio/*"
      } />
      {uploading && <p>Đang upload...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {loading && <p>Đang tải...</p>}

      <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
        {items.map((f) => (
          <FileCard key={f._id} file={f} footer={<AdminActions file={f} onChanged={() => reload(page)} />} />
        ))}
      </div>

      <div style={{ marginTop: 12 }}>
        <span>Tổng: {total}</span>
        <button disabled={page <= 1} onClick={() => reload(page - 1)} style={{ marginLeft: 8 }}>Trước</button>
        <button disabled={page * limit >= total} onClick={() => reload(page + 1)} style={{ marginLeft: 8 }}>Sau</button>
      </div>
    </div>
  );
}
