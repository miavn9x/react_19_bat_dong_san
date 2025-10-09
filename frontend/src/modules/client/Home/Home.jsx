//frontend/src/modules/client/Home/Home.jsx
// frontend/src/modules/client/Home/Home.jsx
import { Link } from "react-router-dom";

export default function Home() {
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const role = user?.role;

  return (
    <div className="space-y-3">
      <h1 className="text-2xl text-red-600 font-bold">Trang chủ</h1>

      {user ? (
        <p>
          Xin chào, <b>{user.name || user.email}</b> {role && <i>({role})</i>}
        </p>
      ) : (
        <p>Bạn chưa đăng nhập.</p>
      )}

      <p className="text-gray-600">
        Đây là website bất động sản ví dụ. Dùng menu trên để di chuyển.
      </p>

      {/* Liên kết test upload */}
      <div className="mt-4 space-x-3">
        <Link className="underline text-blue-600" to="/upload/user">
          ➤ Test Upload (User)
        </Link>
        <Link className="underline text-blue-600" to="/upload/test">
          ➤ Upload Playground (User/Admin)
        </Link>
        {role === "admin" && (
          <Link className="underline text-blue-600" to="/admin/uploads">
            ➤ Admin Upload Manager (CRUD)
          </Link>
        )}
        <Link className="underline text-blue-600" to="/upload/public">
  ➤ Public Browse (No Auth)
</Link>

      </div>
    </div>
  );
}
