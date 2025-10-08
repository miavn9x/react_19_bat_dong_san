// frontend/src/guards/PrivateRoute.jsx
// guard route riêng cho trang cần đăng nhập (dùng trong khu client)
import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}
