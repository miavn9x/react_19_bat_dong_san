export default function Home() {
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;

  return (
    <div className="space-y-3">
      <h1 className="text-2xl text-red-600 font-bold">Trang chủ</h1>
      {user ? (
        <p>Xin chào, <b>{user.name || user.email}</b></p>
      ) : (
        <p>Bạn chưa đăng nhập.</p>
      )}
      <p className="text-gray-600">
        Đây là website bất động sản ví dụ. Dùng menu trên để di chuyển.
      </p>
    </div>
  );
}
