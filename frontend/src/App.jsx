// // // src/App.jsx

// import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";

// // Layouts
// import MainLayout from "./layouts/MainLayout";
// import AdminLayout from "./layouts/AdminLayout";

// // Client pages
// import Home from "./modules/client/home/Home";
// import GioiThieu from "./modules/client/about/GioiThieu";
// import BanTin from "./modules/client/post/BanTin";
// import BatDongSan from "./modules/client/BatDongSan/BatDongSan";
// import Dashboard from "./modules/client/Dashboard/Dashboard";

// // Auth UI
// import Login from "./modules/auth/pages/login";
// import Register from "./modules/auth/pages/register";

// // Guards
// import PrivateRoute from "./guards/PrivateRoute";
// import RoleRoute from "./guards/RoleRoute";
// import SunEditorComponent from "./modules/suneditop/SunEditor";
// import Profile from "./modules/client/users/pages/Profile";
// import UserPublic from "./modules/client/users/pages/UserPublic";
// import UsersList from "./modules/admin/users/pages/UsersList";

// const router = createBrowserRouter([
//   {
//     path: "/",
//     element: <MainLayout />,
//     children: [
//       { index: true, element: <Home /> },
//       { path: "gioi-thieu", element: <GioiThieu /> },
//       { path: "ban-tin", element: <BanTin /> },
//       { path: "bat-dong-san", element: <BatDongSan /> },
//             { path: "test", element: <SunEditorComponent /> },
//             { path: "profile", element: <PrivateRoute><Profile /></PrivateRoute> },
//     { path: "users/:id", element: <PrivateRoute><UserPublic /></PrivateRoute> },


//       // Auth (public)
//       { path: "login", element: <Login /> },
//       { path: "register", element: <Register /> },

//       // Private (client)
//       {
//         path: "dashboard",
//         element: (
//           <PrivateRoute>
//             <Dashboard />
//           </PrivateRoute>
//         ),
//       },
//     ],
//   },

//   // ADMIN
//   {
//     path: "/admin",
//     element: (
//       <PrivateRoute>
//         <RoleRoute allow={["admin"]}>
//           <AdminLayout />
//         </RoleRoute>
//       </PrivateRoute>
//     ),
//     children: [
//       { index: true, element: <Dashboard /> }, // hoặc AdminDashboard riêng
//       { path: "users", element: <div><UsersList />👥 Users Management</div> },
//       { path: "posts", element: <div>📰 Posts Management</div> },
//       { path: "settings", element: <div>⚙️ Settings</div> },
//       { path: "search", element: <div>🔎 Kết quả tìm kiếm</div> },
//     ],
//   },

//   // Fallback
//   { path: "*", element: <Navigate to="/" replace /> },
// ]);

// export default function App() {
//   return <RouterProvider router={router} />;
// }
// src/App.jsx
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

// Extra (editor, profile)
import SunEditorComponent from "./modules/suneditop/SunEditor"; // giữ đúng tên thư mục bạn đang dùng
import Profile from "./modules/client/users/pages/Profile";
import UserPublic from "./modules/client/users/pages/UserPublic";
import UsersList from "./modules/admin/users/pages/UsersList";

// (Tùy bạn đã làm trang quản trị người dùng)
// import UsersList from "./modules/admin/users/pages/UsersList";

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

      // demo editor / tính năng bổ sung
      { path: "test", element: <SunEditorComponent /> },

      // hồ sơ (chỉ khi đăng nhập)
      { path: "profile", element: <PrivateRoute><Profile /></PrivateRoute> },//lấy thông tin user hiện thi
      { path: "users/:id", element: <PrivateRoute><UserPublic /></PrivateRoute> },// thay đôi thông tin user theo id

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
      // index của admin — bạn có thể thay bằng trang AdminDashboard riêng
      { index: true, element: <Dashboard /> },

      // Quản lý người dùng (nếu đã có UsersList thì dùng component đó)
      // { path: "users", element: <UsersList /> },
      { path: "users", element: <div><UsersList /></div> },

      // Các mục khác
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
