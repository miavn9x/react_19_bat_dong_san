// frontend/src/layouts/MainLayout.jsx
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
          "relative px-3 py-2 text-sm font-medium rounded-md transition",
          isActive
            ? "text-indigo-700"
            : "text-gray-700 hover:text-gray-900 hover:bg-gray-100",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          <span>{children}</span>
          <span
            className={[
              "pointer-events-none absolute -bottom-1 left-3 right-3 h-0.5 rounded",
              isActive ? "bg-indigo-600" : "bg-transparent",
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
  // const [q, setQ] = useState("");
  // const handleSearch = (e) => {
  //   e.preventDefault();
  //   const term = q?.trim() || "";
  //   if (!term) {
  //     navigate("/search");
  //   } else {
  //     navigate(`/search?q=${encodeURIComponent(term)}`);
  //   }
  //   setDrawerOpen(false);
  // };

  // ⬇️ LẮNG NGHE SỰ KIỆN auth-changed ĐỂ ĐỒNG BỘ NGAY SAU LOGIN/LOGOUT
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

  // Shadow khi scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Đóng drawer & dropdown khi đổi route
  useEffect(() => {
    setDrawerOpen(false);
    setAccountOpen(false);
  }, [location.pathname]);

  // Khoá scroll nền + ESC để đóng
  useEffect(() => {
    document.body.classList.toggle("overflow-hidden", drawerOpen);
    const onKey = (e) =>
      e.key === "Escape" && (setDrawerOpen(false), setAccountOpen(false));
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("overflow-hidden");
      window.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen]);

  // Click ra ngoài đóng dropdown tài khoản
  useEffect(() => {
    const onDocClick = (e) => {
      if (!accountRef.current) return;
      if (!accountRef.current.contains(e.target)) setAccountOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const handleLogout = () => {
    doLogout();
    setUser(null); // local sync
    navigate("/");
  };

  const initial = (user?.name || user?.email || "?")
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header
        className={[
          "sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70",
          scrolled ? "shadow-sm" : "",
        ].join(" ")}
      >
        <div className="mx-auto container px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Brand */}
            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-indigo-600 grid place-items-center text-white font-bold">
                BĐS
              </div>
              <span className="md:hidden lg:inline text-lg md:text-xl font-extrabold text-gray-900 tracking-tight">
                Bất Động Sản
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              <NavItem to="/" end>
                Trang chủ
              </NavItem>
              <NavItem to="/gioi-thieu">Giới thiệu</NavItem>
              <NavItem to="/ban-tin">Bản tin</NavItem>
              <NavItem to="/bat-dong-san">Bất động sản</NavItem>
              <NavItem to="/lien-he">Liên hệ</NavItem>
              {/* <NavItem to="/test">Test SunEditor</NavItem> */}

              {/* Search (center) */}
              {/* <form onSubmit={handleSearch} className="mx-auto ">
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
            </form> */}
            </nav>

            {/* Actions desktop & mobile */}
            <div className="flex items-center gap-2">
              {/* Desktop CTA */}
              <Link
                to="/dashboard"
                className="hidden md:inline-flex items-center justify-center rounded-lg bg-indigo-600 px-3 py-2.5 text-sm font-medium text-white shadow hover:bg-indigo-700 transition"
              >
                Đăng tin
              </Link>

              {/* Account dropdown */}
              <div className="relative" ref={accountRef}>
                <button
                  aria-label="Tài khoản"
                  className="inline-flex mt-0 items-center gap-2 rounded-full border px-3 py-1 bg-white hover:bg-gray-50"
                  onClick={() => setAccountOpen((v) => !v)}
                >
                  {/* Bubble: ưu tiên avatar nếu BE có, không thì ký tự đầu */}
                  <div className="h-8 w-8 flex-shrink-0 rounded-full grid place-items-center bg-gray-100 text-gray-700 font-semibold overflow-hidden">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt="avatar"
                        className="h-full w-full object-cover"
                      />
                    ) : user ? (
                      initial
                    ) : (
                      // icon user
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15.75 7.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
                        />
                        <path
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 19.5a7.5 7.5 0 0115 0"
                        />
                      </svg>
                    )}
                  </div>

                  {/* Tên (desktop) */}
                  {user && (
                    <span className="hidden sm:block text-sm font-medium text-gray-900 max-w-[160px] truncate">
                      {user.name || user.email}
                    </span>
                  )}

                  {/* Chevron */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 flex-shrink-0 text-gray-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.085l3.71-3.854a.75.75 0 111.08 1.04l-4.24 4.4a.75.75 0 01-1.08 0l-4.24-4.4a.75.75 0 01.02-1.06z" />
                  </svg>
                </button>

                {/* Dropdown */}
                <div
                  className={[
                    "absolute right-0 mt-0 min-w-full rounded-xl border bg-white shadow-lg transition origin-top-right z-[999]",
                    accountOpen
                      ? "opacity-100 scale-100"
                      : "opacity-0 scale-95 pointer-events-none",
                  ].join(" ")}
                >
                  {!user ? (
                    <div className="p-1">
                      <Link
                        to="/register"
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 whitespace-nowrap"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                        >
                          <path
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 14c2.761 0 5 2.239 5 5M9 14c-2.761 0-5 2.239-5 5m8-13a4 4 0 110 8 4 4 0 010-8zm7 3h3m-1.5-1.5V10.5"
                          />
                        </svg>
                        Đăng ký
                      </Link>
                      <Link
                        to="/login"
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 whitespace-nowrap"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                        >
                          <path
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 3h4a2 2 0 012 2v4m-6 12h4a2 2 0 002-2v-4M10 17l5-5-5-5m5 5H3"
                          />
                        </svg>
                        Đăng nhập
                      </Link>
                    </div>
                  ) : (
                    <div className="p-1">
                      <Link
                        to="/profile"
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 whitespace-nowrap"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                        >
                          <path
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"
                          />
                        </svg>
                        Thông tin
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 whitespace-nowrap"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                        >
                          <path
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1"
                          />
                        </svg>
                        Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Hamburger (mobile) */}
              <button
                aria-label="Mở menu"
                aria-expanded={drawerOpen}
                aria-controls="mobile-drawer"
                className="md:hidden inline-flex items-center rounded-md border px-3 py-2 text-sm bg-white hover:bg-gray-50"
                onClick={() => setDrawerOpen(true)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
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
          drawerOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        ].join(" ")}
        onClick={() => setDrawerOpen(false)}
      />

      {/* Drawer (mobile) */}
      <aside
        id="mobile-drawer"
        className={[
          "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r shadow-xl md:hidden",
          "transform transition-transform duration-300 ease-out",
          drawerOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 grid place-items-center text-white font-bold">
              BĐS
            </div>
            <span className="font-bold">Menu</span>
          </div>
          <button
            aria-label="Đóng menu"
            className="inline-flex items-center rounded-md border px-3 py-2 text-sm bg-white hover:bg-gray-50"
            onClick={() => setDrawerOpen(false)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 011.414 
                1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 
                1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 
                10 4.293 5.707a1 1 0 010-1.414z"
              />
            </svg>
          </button>
        </div>

        <nav className="px-2 py-3 flex flex-col gap-1">
          <NavItem to="/" end onClick={() => setDrawerOpen(false)}>
            Trang chủ
          </NavItem>
          <NavItem to="/gioi-thieu" onClick={() => setDrawerOpen(false)}>
            Giới thiệu
          </NavItem>
          <NavItem to="/ban-tin" onClick={() => setDrawerOpen(false)}>
            Bản tin
          </NavItem>
          <NavItem to="/bat-dong-san" onClick={() => setDrawerOpen(false)}>
            Bất động sản
          </NavItem>
          <div className="my-2 h-px bg-gray-200" />
          {!user ? (
            <>
              <Link
                to="/register"
                onClick={() => setDrawerOpen(false)}
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Đăng ký
              </Link>
              <Link
                to="/login"
                onClick={() => setDrawerOpen(false)}
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Đăng nhập
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/profile"
                onClick={() => setDrawerOpen(false)}
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Thông tin
              </Link>
              <button
                onClick={() => {
                  setDrawerOpen(false);
                  handleLogout();
                }}
                className="px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 text-left"
              >
                Đăng xuất
              </button>
            </>
          )}
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1">
        <div className="mx-auto container px-4 py-8">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white">
        <div className="mx-auto container px-4 py-10 grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-indigo-600 grid place-items-center text-white font-bold">
                BĐS
              </div>
              <span className="text-lg font-extrabold text-gray-900">
                Bất Động Sản
              </span>
            </div>
            <p className="mt-3 text-sm text-gray-600">
              Nền tảng thông tin & đăng tin bất động sản. Cập nhật nhanh – Trải
              nghiệm mượt.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900">Điều hướng</h4>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              <li>
                <Link className="hover:text-gray-900" to="/gioi-thieu">
                  Giới thiệu
                </Link>
              </li>
              <li>
                <Link className="hover:text-gray-900" to="/ban-tin">
                  Bản tin
                </Link>
              </li>
              <li>
                <Link className="hover:text-gray-900" to="/bat-dong-san">
                  Bất động sản
                </Link>
              </li>
              <li>
                <Link className="hover:text-gray-900" to="/dashboard">
                  Bảng điều khiển
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900">Liên hệ</h4>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              <li>Email: support@example.com</li>
              <li>Hotline: 0900 000 000</li>
              <li>© {new Date().getFullYear()} All rights reserved.</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
