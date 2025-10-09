//frontend/src/modules/admin/upload/components/ProgressBar.jsx
// Thanh tiến trình đơn giản
export default function ProgressBar({ value = 0 }) {
  const v = Math.min(100, Math.max(0, value));
  return (
    <div className="w-full bg-gray-200 rounded-lg h-2">
      <div
        className="h-full rounded-lg transition-[width] duration-200 ease-linear"
        style={{ width: `${v}%`, background: "oklch(62% 0.11 146)" /* xanh đẹp */ }}
      />
    </div>
  );
}
