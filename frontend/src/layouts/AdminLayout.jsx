// frontend/src/layouts/AdminLayout.jsx
// Layout dành cho admin (admin mới truy cập được)
// Bao gồm sidebar, topbar, footer (tuỳ chọn)
import { useEffect, useState } from "react";
import { NavLink, Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { logout as doLogout, AUTH_EVENT } from "../modules/auth/services/auth";

function SidebarLink({ to, children, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition",
          isActive
            ? "bg-indigo-50 text-indigo-700"
            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
        ].join(" ")
      }
    >
      {children}
    </NavLink>
  );
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(() => {
    try {
      const u = localStorage.getItem("user");
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [q, setQ] = useState("");

  // Đồng bộ user khi login/logout (AUTH_EVENT)
  useEffect(() => {
    const syncUser = () => {
      try {
        const u = localStorage.getItem("user");
        setUser(u ? JSON.parse(u) : null);
      } catch {
        setUser(null);
      }
    };
    window.addEventListener(AUTH_EVENT, syncUser);
    return () => window.removeEventListener(AUTH_EVENT, syncUser);
  }, []);

  // Đóng sidebar khi đổi route
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Khoá scroll nền khi mở sidebar (mobile) + ESC để đóng
  useEffect(() => {
    document.body.classList.toggle("overflow-hidden", sidebarOpen);
    const onKey = (e) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("overflow-hidden");
      window.removeEventListener("keydown", onKey);
    };
  }, [sidebarOpen]);

  // ✅ Mặc định cuộn lên đầu trang khi chuyển trang
  useEffect(() => {
    // Tắt khôi phục vị trí scroll mặc định của trình duyệt để chủ động điều khiển
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    // Cuộn window
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    // Phòng trường hợp một số trình duyệt dùng documentElement/body
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    // Nếu vùng cuộn chính là thẻ <main>, reset luôn
    const mainEl = document.querySelector("main");
    if (mainEl) mainEl.scrollTop = 0;
  }, [location.pathname, location.search]);

  const handleLogout = () => {
    doLogout();
    navigate("/login", { replace: true });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const keyword = q.trim();
    if (!keyword) return;
    navigate(`/admin/search?q=${encodeURIComponent(keyword)}`);
  };

  const initial = (user?.name || user?.email || "?").trim().charAt(0).toUpperCase();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top bar */}
      <header className="border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70">
        <div className="mx-auto container px-4">
          <div className="h-16 flex items-center gap-3">
            {/* Sidebar toggle (mobile) */}
            <button
              aria-label="Mở menu"
              className="md:hidden inline-flex items-center rounded-md border px-3 py-2 text-sm bg-white hover:bg-gray-50"
              onClick={() => setSidebarOpen(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
                viewBox="0 0 24 24" stroke="currentColor">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Brand (ẩn trên mobile để nhường chỗ search) */}
            <Link to="/admin" className="hidden md:flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-indigo-600 grid place-items-center text-white font-bold">AD</div>
              <span className="text-lg font-extrabold text-gray-900 tracking-tight">Admin</span>
            </Link>

            {/* Search (center) */}
            <form onSubmit={handleSearch} className="mx-auto w-full max-w-xl">
              <div className="relative">
                <input
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Tìm kiếm (users, posts, ...)"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pl-9 text-sm shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500"
                />
                <span className="absolute inset-y-0 left-2 grid place-items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      d="M21 21l-4.35-4.35M10 18a8 8 0 110-16 8 8 0 010 16z" />
                  </svg>
                </span>
              </div>
            </form>

            {/* Right actions */}
            <div className="ml-auto flex items-center gap-2">
              {/* User bubble */}
              <div className="inline-flex items-center gap-3 rounded-full border px-2 py-[1px] bg-white hover:bg-gray-50">
                <div className="h-8 w-8 rounded-full grid place-items-center bg-gray-100 text-gray-700 font-semibold overflow-hidden">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="avatar" className="h-full w-full object-cover" />
                  ) : user ? (
                    initial
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5"
                      viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        d="M15.75 7.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        d="M4.5 19.5a7.5 7.5 0 0115 0" />
                    </svg>
                  )}
                </div>
                {user && (
                  <span className="hidden md:block text-sm font-medium text-gray-900 max-w-[160px] truncate">
                    {user.name || user.email}
                  </span>
                )}
              </div>

              <button
                onClick={handleLogout}
                className="inline-flex items-center justify-center rounded-lg bg-rose-600 px-2 py-1 text-sm font-medium text-white shadow hover:bg-rose-700 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Overlay (mobile) */}
      <div
        className={[
          "fixed inset-0 z-40 bg-black/40 transition-opacity md:hidden",
          sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        ].join(" ")}
        onClick={() => setSidebarOpen(false)}
      />

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside
          className={[
            "fixed md:static z-50 inset-y-0 left-0 w-72 bg-white border-r shadow-xl md:shadow-none",
            "transform transition-transform duration-300 ease-out",
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          ].join(" ")}
        >
          <div className="h-16 border-b px-4 flex items-center justify-between md:hidden">
            <span className="font-semibold">Danh mục</span>
            <button
              aria-label="Đóng menu"
              className="inline-flex items-center rounded-md border px-3 py-2 text-sm bg-white hover:bg-gray-50"
              onClick={() => setSidebarOpen(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5"
                viewBox="0 0 20 20" fill="currentColor">
                <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 011.414 
                  1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 
                  1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 
                  10 4.293 5.707a1 1 0 010-1.414z" />
              </svg>
            </button>
          </div>

          <nav className="p-3 space-y-1">
            <SidebarLink to="/" end>
              <span className="inline-flex items-center justify-center h-4 w-4 mr-2 text-gray-600" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    d="M3 9.75L12 3l9 6.75M4.5 10.5V19a1.5 1.5 0 001.5 1.5h3v-6h6v6h3A1.5 1.5 0 0020.5 19V10.5" />
                </svg>
              </span>
              Trang chủ
            </SidebarLink>

            <SidebarLink to="/admin" end>📊 Dashboard</SidebarLink>
            <SidebarLink to="/admin/users">👥 Quản lý người dùng</SidebarLink>
            <SidebarLink to="/admin/posts">📰 Quản lý bài đăng</SidebarLink>
            <SidebarLink to="/admin/uploads">📁 Thư viện media</SidebarLink>
            <SidebarLink to="/admin/settings">⚙️ Cấu hình</SidebarLink>
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1">
          <div className="mx-auto w-full px-4">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Footer (tuỳ chọn) */}
      {/* <footer className="border-t bg-white py-4 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} Admin Console
      </footer> */}
    </div>
  );
}
