// src/App.jsx
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
// Pages
import Home from "./pages/Home";
import GioiThieu from "./pages/about/GioiThieu";
import BanTin from "./pages/post/BanTin";
import BatDongSan from "./pages/BatDongSan/BatDongSan";
import Dashboard from "./pages/Dashboard/Dashboard";

// Auth UI
import Login from "./auth/login/Login";  
import Register from "./auth/register/Register";

// Route bảo vệ
import PrivateRoute from "./routes/PrivateRoute";

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
