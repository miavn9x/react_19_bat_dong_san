// src/App.jsx
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";

// Layouts
import MainLayout from "./layouts/MainLayout";
import AdminLayout from "./layouts/AdminLayout";

// Client pages
import Home from "./modules/client/Home/Home";
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

// (giữ trang editor/test cũ nếu bạn dùng)
import SunEditorComponent from "./modules/suneditop/SunEditor";

// Profile & Users
import Profile from "./modules/client/users/pages/Profile";
import UserPublic from "./modules/client/users/pages/UserPublic";
import UsersList from "./modules/admin/users/pages/UsersList";
import AdminUploadManager from "./modules/admin/upload/pages/AdminUploadManager";
import UploadPlayground from "./modules/admin/upload/pages/test/UploadPlayground";
import UserUploadManager from "./modules/admin/upload/pages/UserUploadManager";
import PublicBrowseAll from "./modules/admin/upload/pages/test/PublicBrowseAll";

// ✅ Admin Posts CRUD page
import AdminPostsPage from "./modules/admin/post/pages/AdminPostsPage";
import PostCreatePage from "./modules/admin/post/pages/PostCreatePage";
import PostEditPage from "./modules/admin/post/pages/PostEditPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "gioi-thieu", element: <GioiThieu /> },
      { path: "ban-tin", element: <BanTin /> },
      { path: "bat-dong-san", element: <BatDongSan /> },

      // Test editor cũ
      { path: "test", element: <SunEditorComponent /> },

      // User profile
      { path: "profile", element: <PrivateRoute><Profile /></PrivateRoute> },
      { path: "users/:id", element: <PrivateRoute><UserPublic /></PrivateRoute> },

      // Auth (public)
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },
      { path: "upload/public", element: <PublicBrowseAll /> },

      // Private (client)
      {
        path: "dashboard",
        element: (
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        ),
      },

      // 🔥 User upload manager (đã login)
      {
        path: "upload/user",
        element: (
          <PrivateRoute>
            <UserUploadManager />
          </PrivateRoute>
        ),
      },

      // 🔥 Upload playground (test nhanh cho user/admin đều được – yêu cầu login)
      {
        path: "upload/test",
        element: (
          <PrivateRoute>
            <UploadPlayground />
          </PrivateRoute>
        ),
      },
    ],
  },

  // ADMIN
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
      { index: true, element: <Dashboard /> }, // hoặc AdminDashboard riêng
      { path: "users", element: <div><UsersList />👥 Users Management</div> },

      // ✅ Posts
      { path: "posts", element: <AdminPostsPage /> },
      { path: "posts/new", element: <PostCreatePage /> },       // 👈 Trang tạo
      { path: "posts/:slug/edit", element: <PostEditPage /> },  // 👈 Trang sửa

      { path: "settings", element: <div>⚙️ Settings</div> },
      { path: "search", element: <div>🔎 Kết quả tìm kiếm</div> },
      { path: "uploads", element: <AdminUploadManager /> },
    ],
  },

  // Fallback
  { path: "*", element: <Navigate to="/" replace /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
