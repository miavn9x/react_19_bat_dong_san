import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";

// Layouts
import MainLayout from "./layouts/MainLayout";
import AdminLayout from "./layouts/AdminLayout";

// Client pages
import Home from "./modules/client/home/Home";
import GioiThieu from "./modules/client/about/GioiThieu";
import BanTin from "./modules/client/post/BanTin";
import BatDongSan from "./modules/client/BatDongSan/BatDongSan";
import Dashboard from "./modules/client/Dashboard/Dashboard";

// Auth UI
import Login from "./modules/auth/pages/login";
import Register from "./modules/auth/pages/register";

// Guards
import PrivateRoute from "./guards/PrivateRoute";
import RoleRoute from "./guards/RoleRoute";

// Extra
import SunEditorComponent from "./modules/suneditop/SunEditor";
import Profile from "./modules/client/users/pages/Profile";
import UserPublic from "./modules/client/users/pages/UserPublic";
import UsersList from "./modules/admin/users/pages/UsersList";

// ⬇️⬇️ THÊM 3 TRANG UPLOAD
import AdminUploadsPage from "./modules/admin/upload/pages/AdminUploadsPage";
import PublicGalleryPage from "./modules/admin/upload/pages/PublicGalleryPage";
import UserUploadTestPage from "./modules/admin/upload/pages/UserUploadTestPage";

const router = createBrowserRouter([
  // --------- KHU CLIENT ----------
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "gioi-thieu", element: <GioiThieu /> },
      { path: "ban-tin", element: <BanTin /> },
      { path: "bat-dong-san", element: <BatDongSan /> },

      // demo editor
      { path: "test", element: <SunEditorComponent /> },

      // hồ sơ (chỉ khi đăng nhập)
      { path: "profile", element: <PrivateRoute><Profile /></PrivateRoute> },
      { path: "users/:id", element: <PrivateRoute><UserPublic /></PrivateRoute> },

      // Auth (public)
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },

      // Dashboard client (cần đăng nhập)
      {
        path: "dashboard",
        element: (
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        ),
      },

      // ⬇️⬇️ TRANG TEST UPLOAD Ở KHU CLIENT
      // (#2) Gallery: xem ảnh/video/mp3 — KHÔNG cần đăng nhập (nếu chỉ dán URL tĩnh) và có chế độ có đăng nhập
      { path: "gallery", element: <PublicGalleryPage /> },

      // (#3) Test upload cho user — CẦN đăng nhập
      {
        path: "upload/test",
        element: (
          <PrivateRoute>
            <UserUploadTestPage />
          </PrivateRoute>
        ),
      },
    ],
  },

  // --------- KHU ADMIN ----------
  {
    path: "/admin",
    element: (
      <PrivateRoute>
        <RoleRoute allow={["admin"]}>
          <AdminLayout />
        </RoleRoute>
      </PrivateRoute>
    ),
    children: [
      { index: true, element: <Dashboard /> },

      { path: "users", element: <div><UsersList /></div> },

      // ⬇️⬇️ (#1) Trang quản lý uploads cho admin (CRUD đầy đủ)
      { path: "uploads", element: <AdminUploadsPage /> },

      { path: "posts", element: <div>📰 Posts Management</div> },
      { path: "settings", element: <div>⚙️ Settings</div> },
      { path: "search", element: <div>🔎 Kết quả tìm kiếm</div> },
    ],
  },

  // --------- Fallback ----------
  { path: "*", element: <Navigate to="/" replace /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
