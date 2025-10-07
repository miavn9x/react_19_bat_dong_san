// src/App.jsx
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
// Pages
import Home from "./modules/client/home/Home";
import GioiThieu from "./modules/client/about/GioiThieu";
import BanTin from "./modules/client/post/BanTin";
import BatDongSan from "./modules/client/BatDongSan/BatDongSan";
import Dashboard from "./modules/client/Dashboard/Dashboard";
// Auth UI
import Login from "./modules/auth/pages/login";
import Register from "./modules/auth/pages/register";
// Route bảo vệ
import PrivateRoute from "./guards/PrivateRoute";


const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />, // dùng layout
    children: [
      { index: true, element: <Home /> },
      { path: "gioi-thieu", element: <GioiThieu /> },
      { path: "ban-tin", element: <BanTin /> },
      { path: "bat-dong-san", element: <BatDongSan /> },

      // Auth
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },

      // Private
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
]);

export default function App() {
  return <RouterProvider router={router} />;
}
