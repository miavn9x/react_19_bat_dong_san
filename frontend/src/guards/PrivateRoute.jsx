// // ==========================================
// // FILE 6: frontend/src/guards/PrivateRoute.jsx
// // ==========================================

//frontend/src/guards/PrivateRoute.jsx
import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}
