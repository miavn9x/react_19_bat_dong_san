// frontend/src/modules/admin/upload/pages/UserUploadTestPage.jsx
import { useState } from "react";
import useUploadFile from "../hooks/useUploadFile";
import UploadDropzone from "../components/UploadDropzone";
import MediaViewer from "../components/MediaViewer";

export default function UserUploadTestPage() {
  const { upload, loading, error } = useUploadFile();
  const [bucket, setBucket] = useState("images");
  const [last, setLast] = useState(null);

  const onSelect = async (file) => {
    const doc = await upload({ bucket, file });
    setLast(doc);
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>User Upload – Test</h2>
      <div style={{ marginBottom: 8 }}>
        <label>Bucket: </label>
        <select value={bucket} onChange={(e) => setBucket(e.target.value)}>
          <option value="images">images</option>
          <option value="videos">videos</option>
          <option value="audios">audios</option>
        </select>
      </div>

      <UploadDropzone onSelect={onSelect} accept={
        bucket === "images" ? "image/*" : bucket === "videos" ? "video/*" : "audio/*"
      } />
      {loading && <p>Đang upload...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {last && (
        <div style={{ marginTop: 16 }}>
          <h4>Uploaded:</h4>
          <code>{last.url}</code>
          <div style={{ maxWidth: 720, marginTop: 8 }}>
            <MediaViewer url={last.url} type={last.type} />
          </div>
        </div>
      )}
    </div>
  );
}
