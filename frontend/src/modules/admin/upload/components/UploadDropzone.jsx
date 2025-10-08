
// frontend/src/modules/admin/upload/components/UploadDropzone.jsx
import { useRef, useState } from "react";

export default function UploadDropzone({ onSelect, accept }) {
  const ref = useRef(); const [hover, setHover] = useState(false);
  const onFiles = (files) => { if (files?.length) onSelect?.(files[0]); };
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setHover(true); }}
      onDragLeave={() => setHover(false)}
      onDrop={(e) => { e.preventDefault(); setHover(false); onFiles(e.dataTransfer.files); }}
      onClick={() => ref.current?.click()}
      style={{ border: "2px dashed #aaa", padding: 20, borderRadius: 12, textAlign: "center", background: hover ? "#f5f5f5" : "transparent", cursor: "pointer" }}
    >
      <input ref={ref} type="file" accept={accept} hidden onChange={(e) => onFiles(e.target.files)} />
      <div>Kéo thả hoặc bấm để chọn file</div>
      {accept && <small>Cho phép: {accept}</small>}
    </div>
  );
}
