import { Link } from "react-router-dom";

export default function Home() {
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const role = user?.role || "user";

  return (
    <div className="space-y-3">
      <h1 className="text-2xl text-red-600 font-bold">Trang chủ</h1>
      {user ? (
        <p>Xin chào, <b>{user.name || user.email}</b> ({role})</p>
      ) : (
        <p>Bạn chưa đăng nhập.</p>
      )}
      <p className="text-gray-600">
        Đây là website bất động sản ví dụ. Dùng menu trên để di chuyển.
      </p>

      {/* Nút chuyển tới các trang test uploads */}
      <div className="flex flex-wrap gap-2 pt-2">
        <Link
          to="/gallery"
          className="px-3 py-2 rounded bg-blue-600 text-white hover:opacity-90"
        >
          Xem Gallery (public)
        </Link>

        <Link
          to="/upload/test"
          className="px-3 py-2 rounded bg-emerald-600 text-white hover:opacity-90"
        >
          Test Upload (cần đăng nhập)
        </Link>

        {/* chỉ hiện nếu là admin */}
        {role === "admin" && (
          <Link
            to="/admin/uploads"
            className="px-3 py-2 rounded bg-purple-600 text-white hover:opacity-90"
          >
            Quản lý Uploads (Admin)
          </Link>
        )}
      </div>
    </div>
  );
}
