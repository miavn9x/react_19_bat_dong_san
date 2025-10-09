// frontend/src/modules/admin/upload/components/MediaViewer.jsx
// Hiển thị media (image/video/audio) từ URL tĩnh /uploads/**
// - Tự prefix domain qua toFileURL
// - Giữ tỷ lệ & bo góc nhẹ
//Components (tái sử dụng)
// Hiển thị ảnh/video/audio theo MIME type
import { toFileURL } from "../config/api";

export default function MediaViewer({ url, type }) {
  const src = toFileURL(url);
  if (!src) return null;

  if (type?.startsWith("image/"))
    return <img src={src} alt="" className="w-full h-[220px] object-cover rounded-xl" />;
  if (type?.startsWith("video/"))
    return <video src={src} controls className="w-full h-[220px] rounded-xl" />;
  if (type?.startsWith("audio/"))
    return <audio src={src} controls className="w-full" />;

  return (
    <a className="text-blue-600 underline" href={src} target="_blank" rel="noreferrer">
      Mở file
    </a>
  );
}
