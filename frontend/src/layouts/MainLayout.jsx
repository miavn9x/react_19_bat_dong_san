// frontend/src/layouts/MainLayout.jsx
// Layout chính cho phần client (khách và user đã đăng nhập)
// Bao gồm header, footer, nav, mobile drawer
//
import { useEffect, useRef, useState } from "react";
import {
  NavLink,
  Outlet,
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { logout as doLogout } from "../modules/auth/services/auth";
import { AUTH_EVENT } from "../modules/auth/services/auth";

function NavItem({ to, end, children, onClick }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        [
          "relative px-4 py-2.5 text-sm font-medium rounded-md transition-colors duration-200",
          isActive
            ? "text-indigo-600 font-semibold"
            : "text-gray-600 hover:text-indigo-600 hover:bg-gray-100/50",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          <span>{children}</span>
          <span
            className={[
              "absolute inset-x-4 bottom-0 h-0.5 bg-indigo-600 transition-transform duration-200",
              isActive ? "scale-x-100" : "scale-x-0",
            ].join(" ")}
          />
        </>
      )}
    </NavLink>
  );
}

export default function MainLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState(() => {
    try {
      const u = localStorage.getItem("user");
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  });

  const navigate = useNavigate();
  const location = useLocation();
  const accountRef = useRef(null);

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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
    setAccountOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.classList.toggle("overflow-hidden", drawerOpen);
    const onKey = (e) => e.key === "Escape" && (setDrawerOpen(false), setAccountOpen(false));
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("overflow-hidden");
      window.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const handleLogout = () => {
    doLogout();
    setUser(null);
    navigate("/");
  };

  const initial = (user?.name || user?.email || "?").trim().charAt(0).toUpperCase();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header
        className={[
          " w-full border-b border-gray-200 bg-white/90 backdrop-blur-md",
          scrolled ? "shadow-md" : "",
        ].join(" ")}
      >
        <div className="mx-auto container  py-2 px-2 sm:px-6 ">
          {/* Top row: Logo + Actions */}
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-indigo-600 text-white font-bold grid place-items-center">
                BĐS
              </div>
              <span className="hidden sm:inline text-lg font-bold text-gray-900">
                Bất Động Sản
              </span>
            </Link>

            <div className="flex items-center gap-4">
              <Link
                to="/dashboard"
                className="hidden md:inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-500 transition-colors shadow-sm"
              >
                Đăng tin
              </Link>

              {/* Account */}
              <div className="relative " ref={accountRef}>
                <button
                  aria-label="Tài khoản"
                  className="flex items-center gap-2 rounded-full  border border-gray-200 px-3 py-1 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  onClick={() => setAccountOpen(!accountOpen)}
                >
                  <div className="h-7 w-7 rounded-full bg-gray-100 text-gray-600 font-medium grid place-items-center overflow-hidden">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="avatar" className="h-full w-full object-cover" />
                    ) : user ? (
                      initial
                    ) : (
<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15.75 7.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5a7.5 7.5 0 0115 0" />
</svg>
                    )}
                  </div>
                  {user && <span className="hidden sm:block text-sm font-medium text-indigo-700 truncate max-w-[140px]">{user.name || user.email}</span>}
                  <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <div
                  className={[
                    "absolute right-0 mt-[0.20px]  w-48 rounded-md border border-gray-200 bg-white shadow-lg transition-all duration-150 origin-top-right z-50",
                    accountOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none",
                  ].join(" ")}
                >
                  {!user ? (
                    <div >
                      <Link to="/register" className=" px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M18 9V3.6c0-.56 0-.84-.109-1.054a1 1 0 00-.437-.437C17.24 2 16.96 2 16.4 2H7.6c-.56 0-.84 0-1.054.109a1 1 0 00-.437.437C6 2.76 6 3.04 6 3.6V9m6 3v9m-3-9h6c.828 0 1.5.895 1.5 2v7c0 1.105-.672 2-1.5 2H9c-.828 0-1.5-.895-1.5-2v-7c0-1.105.672-2 1.5-2z" />
                        </svg>
                        Đăng ký
                      </Link>
                      <Link to="/login" className=" px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        Đăng nhập
                      </Link>
                    </div>
                  ) : (
                    <div >
                      <Link to="/profile" className=" px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Thông tin
                      </Link>
                      <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H5a3 3 0 01-3-3V7a3 3 0 013-3h5a3 3 0 013 3v1" />
                        </svg>
                        Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile menu button */}
              <button
                aria-label="Mở menu"
                className="md:hidden flex items-center px-3 py-1 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                onClick={() => setDrawerOpen(true)}
              >
                <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Nav row */}
          <nav className="hidden md:flex justify-center">
            <NavItem to="/" end>Trang chủ</NavItem>
            <NavItem to="/gioi-thieu">Giới thiệu</NavItem>
            <NavItem to="/ban-tin">Bản tin</NavItem>
            <NavItem to="/bat-dong-san">Bất động sản</NavItem>
            <NavItem to="/lien-he">Liên hệ</NavItem>
            <NavItem to="/test">Tìm kiếm</NavItem>
          </nav>
        </div>
      </header>

      {/* Mobile overlay */}
      <div
        className={[
          "fixed inset-0 bg-black/30 transition-opacity duration-200 md:hidden z-40",
          drawerOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        ].join(" ")}
        onClick={() => setDrawerOpen(false)}
      />

      {/* Mobile drawer */}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r shadow-xl transform transition-transform duration-300 ease-in-out md:hidden",
          drawerOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <span className="font-bold text-gray-900">Menu</span>
          <button aria-label="Đóng menu" onClick={() => setDrawerOpen(false)} className="p-2 hover:bg-gray-100 rounded-md">
            <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="flex flex-col p-4 space-y-2">
          <NavItem to="/" end onClick={() => setDrawerOpen(false)}>Trang chủ</NavItem>
          <NavItem to="/gioi-thieu" onClick={() => setDrawerOpen(false)}>Giới thiệu</NavItem>
          <NavItem to="/ban-tin" onClick={() => setDrawerOpen(false)}>Bản tin</NavItem>
          <NavItem to="/bat-dong-san" onClick={() => setDrawerOpen(false)}>Bất động sản</NavItem>
          <NavItem to="/lien-he" onClick={() => setDrawerOpen(false)}>Liên hệ</NavItem>
          <hr className="my-2 border-gray-200" />
          {!user ? (
            <>
              <Link to="/register" onClick={() => setDrawerOpen(false)} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">Đăng ký</Link>
              <Link to="/login" onClick={() => setDrawerOpen(false)} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">Đăng nhập</Link>
            </>
          ) : (
            <>
              <Link to="/profile" onClick={() => setDrawerOpen(false)} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">Thông tin</Link>
              <button onClick={() => { setDrawerOpen(false); handleLogout(); }} className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md text-left">Đăng xuất</button>
            </>
          )}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1">
        <div className="mx-auto container px-4 py-8 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-gray-50">
        <div className="mx-auto container px-4 py-10 sm:px-6 lg:px-8 grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-md bg-indigo-600 text-white font-bold grid place-items-center">
                BĐS
              </div>
              <span className="text-lg font-bold text-gray-900">Bất Động Sản</span>
            </div>
            <p className="text-sm text-gray-600">Nền tảng thông tin & đăng tin bất động sản. Cập nhật nhanh – Trải nghiệm mượt mà.</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Điều hướng</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link to="/gioi-thieu" className="hover:text-indigo-600 transition-colors">Giới thiệu</Link></li>
              <li><Link to="/ban-tin" className="hover:text-indigo-600 transition-colors">Bản tin</Link></li>
              <li><Link to="/bat-dong-san" className="hover:text-indigo-600 transition-colors">Bất động sản</Link></li>
              <li><Link to="/admin" className="hover:text-indigo-600 transition-colors">Bảng điều khiển</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Liên hệ</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email: support@example.com
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Hotline: 0900 000 000
              </li>
              <li>© {new Date().getFullYear()} All rights reserved.</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}