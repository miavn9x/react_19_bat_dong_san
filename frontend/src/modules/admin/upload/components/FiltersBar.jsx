// frontend/src/modules/admin/upload/components/FiltersBar.jsx
import { useEffect, useState } from "react";

export default function FiltersBar({ value, onChange, showBucket = true }) {
  const [v, setV] = useState(value || { bucket: "" });

  // ✅ deps rõ ràng, không dùng biểu thức phức tạp
  useEffect(() => {
    setV(value || {});
  }, [value]);

  const set = (k, val) => {
    const next = { ...v, [k]: val };
    setV(next);
    onChange?.(next);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 8, marginBottom: 12 }}>
      {showBucket && (
        <select value={v.bucket || ""} onChange={(e) => set("bucket", e.target.value)}>
          <option value="">Tất cả bucket</option>
          <option value="images">images</option>
          <option value="videos">videos</option>
          <option value="audios">audios</option>
        </select>
      )}
      <input placeholder="Năm YYYY"  value={v.year  || ""} onChange={(e) => set("year",  e.target.value)} />
      <input placeholder="Tháng MM"  value={v.month || ""} onChange={(e) => set("month", e.target.value)} />
      <input placeholder="Ngày DD"   value={v.day   || ""} onChange={(e) => set("day",   e.target.value)} />
      <input placeholder="Tìm theo tên" value={v.q || ""} onChange={(e) => set("q", e.target.value)} />
      <button onClick={() => onChange?.(v)}>Lọc</button>
    </div>
  );
}
