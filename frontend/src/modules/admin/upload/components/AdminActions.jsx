// frontend/src/modules/admin/upload/components/AdminActions.jsx
import { useState } from "react";
import { updateMeta, replaceFile, deleteFile } from "../services/uploads.api";

export default function AdminActions({ file, onChanged }) {
  const [label, setLabel] = useState(file.label || ""); const [busy, setBusy] = useState(false);

  const doUpdate = async () => { setBusy(true); await updateMeta({ id:file._id, label }); setBusy(false); onChanged?.(); };
  const doReplace = async (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    setBusy(true); await replaceFile({ id:file._id, bucket:file.bucket, file:f }); setBusy(false); onChanged?.();
  };
  const doDelete = async () => { if (!confirm("Xoá file này?")) return; setBusy(true); await deleteFile({ id:file._id }); setBusy(false); onChanged?.(); };

  return (
    <div style={{ marginTop:8, display:"flex", gap:8, alignItems:"center" }}>
      <input value={label} onChange={(e)=>setLabel(e.target.value)} placeholder="Nhãn" />
      <button disabled={busy} onClick={doUpdate}>Lưu nhãn</button>
      <label style={{ border:"1px solid #ddd", padding:"4px 8px", borderRadius:8, cursor:"pointer" }}>
        Thay file
        <input type="file" hidden onChange={doReplace} />
      </label>
      <button style={{ color:"red" }} disabled={busy} onClick={doDelete}>Xoá</button>
    </div>
  );
}
