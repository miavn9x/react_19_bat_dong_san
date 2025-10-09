// frontend/src/modules/admin/upload/components/MediaViewer.jsx
// Hiển thị media (image/video/audio) từ URL tĩnh /uploads/**
// - Tự prefix domain qua toFileURL
// - Duy trì tỷ lệ khung hình, bo góc nhẹ, tối ưu kích thước hiển thị
// - Tái sử dụng, hỗ trợ responsive, accessibility và debug lỗi

import { useEffect } from "react";
import { toFileURL } from "../config/api";

export default function MediaViewer({ url, type, alt = "Media preview" }) {
  const src = toFileURL(url);

  // Debug: Log URL and type to console for troubleshooting
  useEffect(() => {
    console.log("MediaViewer Debug:", { url, type, src });
  }, [url, type, src]);

  if (!src || !url) {
    return (
      <div className="flex items-center justify-center w-full aspect-[4/3] bg-gray-100 rounded-xl text-gray-500 text-sm">
        Không có URL media
      </div>
    );
  }

  // Base classes for media elements
  const baseClasses = "w-full h-full object-cover rounded-xl";

  if (type?.startsWith("image/")) {
    return (
      <div className="relative w-full aspect-[4/3]">
        <img
          src={src}
          alt={alt}
          className={baseClasses}
          loading="lazy"
          onError={(e) => {
            console.error("Image load error:", src);
            e.target.style.display = "none";
            e.target.nextSibling.style.display = "flex";
          }}
          onLoad={(e) => {
            console.log("Image loaded successfully:", src);
            e.target.style.display = "block";
            e.target.nextSibling.style.display = "none";
          }}
        />
        <div className="absolute inset-0  items-center justify-center bg-gray-100 rounded-xl text-gray-500 text-sm hidden">
          Lỗi tải ảnh
        </div>
      </div>
    );
  }

  if (type?.startsWith("video/")) {
    return (
      <div className="relative w-full aspect-[4/3]">
        <video
          src={src}
          controls
          className={baseClasses}
          preload="metadata"
          onError={(e) => {
            console.error("Video load error:", src);
            e.target.style.display = "none";
            e.target.nextSibling.style.display = "flex";
          }}
        />
        <div className="absolute inset-0  items-center justify-center bg-gray-100 rounded-xl text-gray-500 text-sm hidden">
          Lỗi tải video
        </div>
      </div>
    );
  }

  if (type?.startsWith("audio/")) {
    return (
      <div className="w-full">
        <audio
          src={src}
          controls
          className="w-full"
          preload="metadata"
          onError={(e) => {
            console.error("Audio load error:", src);
            e.target.style.display = "none";
            e.target.nextSibling.style.display = "flex";
          }}
        />
        <div className=" items-center justify-center w-full bg-gray-100 rounded-xl text-gray-500 text-sm hidden">
          Lỗi tải audio
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center w-full aspect-[4/3] bg-gray-100 rounded-xl">
      <a
        className="text-blue-600 hover:text-blue-700 underline text-sm"
        href={src}
        target="_blank"
        rel="noreferrer"
        aria-label="Mở file trong tab mới"
      >
        Mở file
      </a>
    </div>
  );
}