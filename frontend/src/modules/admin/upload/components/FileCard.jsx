// frontend/src/modules/admin/upload/components/FileCard.jsx
import MediaViewer from "./MediaViewer";

export default function FileCard({ file, footer }) {
  return (
    <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 12 }}>
      <MediaViewer url={file.url} type={file.type} />
      <div style={{ marginTop: 8, fontSize: 13 }}>
        <b>{file.originalName}</b>
        <div>{file.bucket} • {file.type}</div>
        <div>{file.year}-{String(file.month).padStart(2,"0")}-{String(file.day).padStart(2,"0")}</div>
        {file.label && <div>Nhãn: {file.label}</div>}
      </div>
      {footer}
    </div>
  );
}
