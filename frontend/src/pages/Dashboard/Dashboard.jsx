// src/pages/Dashboard.jsx (private)
export default function Dashboard() {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold">Dashboard (Protected)</h2>
      <p className="text-gray-600">Nội dung chỉ xem được khi đã đăng nhập.</p>
    </div>
  );
}
