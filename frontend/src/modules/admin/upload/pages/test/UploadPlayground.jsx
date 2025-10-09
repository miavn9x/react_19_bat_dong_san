//frontend/src/modules/admin/upload/pages/test/UploadPlayground.jsx
// Trang test nhanh upload (user & admin)
import { useState } from "react";
import UploadDropzone from "../../components/UploadDropzone";
import ProgressBar from "../../components/ProgressBar";
import { useUserUploadMany } from "../../hooks/useUserUploads"; // test nhanh với quyền user
import { useAdminUploadMany } from "../../hooks/useAdminUploads"; // nếu muốn test quyền admin

export default function UploadPlayground() {
  const [bucket, setBucket] = useState("images");
  const [group, setGroup] = useState("post:test");
  const user = useUserUploadMany({ bucket });
  const admin = useAdminUploadMany({ bucket, batchSize: 4 }); // thử queue batch

  return (
    <div style={{ padding: 16 }}>
      <h2>Upload Playground (Test nhanh)</h2>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <select value={bucket} onChange={(e)=>setBucket(e.target.value)}>
          <option value="images">images</option>
          <option value="videos">videos</option>
          <option value="audios">audios</option>
        </select>
        <input placeholder="group" value={group} onChange={(e)=>setGroup(e.target.value)} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <section style={{ border: "1px solid #eee", borderRadius: 12, padding: 12 }}>
          <h3>User Uploader</h3>
          <UploadDropzone multiple accept={bucket === "images" ? "image/*" : bucket === "videos" ? "video/*" : "audio/*"}
            onSelect={async (files) => await user.upload({ files, group, startOrder: 0 })} />
          {user.busy && (<><div>Đang upload (User): {user.progress}%</div><ProgressBar value={user.progress} /></>)}
        </section>

        <section style={{ border: "1px solid #eee", borderRadius: 12, padding: 12 }}>
          <h3>Admin Uploader (batch queue)</h3>
          <UploadDropzone multiple accept={bucket === "images" ? "image/*" : bucket === "videos" ? "video/*" : "audio/*"}
            onSelect={async (files) => await admin.upload({ files, group, startOrder: 0 })} />
          {admin.busy && (<><div>Đang upload (Admin): {admin.progress}%</div><ProgressBar value={admin.progress} /></>)}
        </section>
      </div>
    </div>
  );
}
