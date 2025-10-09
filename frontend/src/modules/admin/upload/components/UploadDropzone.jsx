//frontend/src/modules/admin/upload/components/UploadDropzone.jsx
// Dropzone nhiều file, hiển thị accept, dùng lại cho Admin/User
import { useRef, useState } from "react";

export default function UploadDropzone({ multiple = true, accept, onSelect }) {
  const ref = useRef();
  const [hover, setHover] = useState(false);

  const onFiles = (files) => {
    if (!files?.length) return;
    onSelect?.(multiple ? Array.from(files) : [files[0]]);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setHover(true); }}
      onDragLeave={() => setHover(false)}
      onDrop={(e) => { e.preventDefault(); setHover(false); onFiles(e.dataTransfer.files); }}
      onClick={() => ref.current?.click()}
      className={[
        "border-2 border-dashed rounded-xl text-center cursor-pointer p-6 transition-colors",
        hover ? "bg-gray-50 border-gray-400" : "border-gray-300",
      ].join(" ")}
    >
      <input
        ref={ref}
        type="file"
        accept={accept}
        multiple={multiple}
        hidden
        onChange={(e) => onFiles(e.target.files)}
      />
      <div className="font-medium">Kéo thả hoặc bấm để chọn {multiple ? "nhiều" : "một"} file</div>
      {accept && <div className="text-xs text-gray-600 mt-1">Cho phép: {accept}</div>}
    </div>
  );
}
