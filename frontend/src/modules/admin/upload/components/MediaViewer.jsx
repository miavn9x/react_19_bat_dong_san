// frontend/src/modules/admin/upload/components/MediaViewer.jsx
import { toFileURL } from "../config/fileBase";

export default function MediaViewer({ url, type }) {
  const src = toFileURL(url);
  if (!src) return null;

  if (type?.startsWith("image/"))
    return <img src={src} alt="" style={{ width: "100%", height: 220, objectFit: "cover", borderRadius: 12 }} />;
  if (type?.startsWith("video/"))
    return <video src={src} controls style={{ width: "100%", height: 220, borderRadius: 12 }} />;
  if (type?.startsWith("audio/"))
    return <audio src={src} controls style={{ width: "100%" }} />;
  return <a href={src} target="_blank" rel="noreferrer">Mở file</a>;
}
