// // frontend/src/layouts/AdminLayout.jsx
// // Layout dành cho admin - Fixed Mobile Responsive
// import { useEffect, useState } from "react";
// import { NavLink, Outlet, Link, useNavigate, useLocation } from "react-router-dom";
// import { logout as doLogout, AUTH_EVENT } from "../modules/auth/services/auth";

// function SidebarLink({ to, children, end }) {
//   return (
//     <NavLink
//       to={to}
//       end={end}
//       className={({ isActive }) =>
//         [
//           "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
//           isActive
//             ? "bg-indigo-50 text-indigo-700 font-medium"
//             : "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
//         ].join(" ")
//       }
//     >
//       {children}
//     </NavLink>
//   );
// }

// export default function AdminLayout() {
//   const navigate = useNavigate();
//   const location = useLocation();

//   const [user, setUser] = useState(() => {
//     try {
//       const u = localStorage.getItem("user");
//       return u ? JSON.parse(u) : null;
//     } catch {
//       return null;
//     }
//   });

//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const [q, setQ] = useState("");

//   // Đồng bộ user khi login/logout
//   useEffect(() => {
//     const syncUser = () => {
//       try {
//         const u = localStorage.getItem("user");
//         setUser(u ? JSON.parse(u) : null);
//       } catch {
//         setUser(null);
//       }
//     };
//     window.addEventListener(AUTH_EVENT, syncUser);
//     return () => window.removeEventListener(AUTH_EVENT, syncUser);
//   }, []);

//   // Đóng sidebar khi đổi route
//   useEffect(() => {
//     setSidebarOpen(false);
//   }, [location.pathname]);

//   // Khoá scroll nền khi mở sidebar
//   useEffect(() => {
//     if (sidebarOpen) {
//       document.body.style.overflow = "hidden";
//       document.documentElement.style.overflow = "hidden";
//     } else {
//       document.body.style.overflow = "";
//       document.documentElement.style.overflow = "";
//     }

//     const onKey = (e) => {
//       if (e.key === "Escape") setSidebarOpen(false);
//     };
//     window.addEventListener("keydown", onKey);
    
//     return () => {
//       document.body.style.overflow = "";
//       document.documentElement.style.overflow = "";
//       window.removeEventListener("keydown", onKey);
//     };
//   }, [sidebarOpen]);

//   // Cuộn lên đầu trang khi chuyển route
//   useEffect(() => {
//     window.scrollTo(0, 0);
//     document.documentElement.scrollTop = 0;
//   }, [location.pathname]);

//   const handleLogout = () => {
//     doLogout();
//     navigate("/login", { replace: true });
//   };

//   const handleSearch = (e) => {
//     e.preventDefault();
//     const keyword = q.trim();
//     if (!keyword) return;
//     navigate(`/admin/search?q=${encodeURIComponent(keyword)}`);
//   };

//   const initial = (user?.name || user?.email || "?").trim().charAt(0).toUpperCase();

//   return (
//     <div className="min-h-screen flex flex-col bg-gray-50">
//       {/* Top bar - Fixed height */}
//       <header className="sticky top-0 z-30 border-b bg-white shadow-sm">
//         <div className="h-14 sm:h-16 px-3 sm:px-4 flex items-center gap-2 sm:gap-3 max-w-[1920px] mx-auto">
//           {/* Sidebar toggle (mobile) */}
//           <button
//             aria-label="Mở menu"
//             className="md:hidden flex items-center justify-center w-9 h-9 rounded-md border border-gray-300 bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors"
//             onClick={() => setSidebarOpen(true)}
//           >
//             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//               <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
//             </svg>
//           </button>

//           {/* Brand */}
//           <Link to="/admin" className="flex items-center gap-2 flex-shrink-0">
//             <div className="h-8 w-8 rounded-lg bg-indigo-600 grid place-items-center text-white font-bold text-sm">
//               AD
//             </div>
//             <span className="hidden sm:block text-base sm:text-lg font-extrabold text-gray-900">Admin</span>
//           </Link>

//           {/* Search (center) */}
//           <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-2">
//             <div className="relative">
//               <input
//                 type="search"
//                 value={q}
//                 onChange={(e) => setQ(e.target.value)}
//                 placeholder="Tìm kiếm..."
//                 className="w-full h-9 sm:h-10 rounded-lg border border-gray-300 bg-white px-3 pl-8 sm:pl-9 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-shadow"
//               />
//               <span className="absolute inset-y-0 left-2 sm:left-3 flex items-center pointer-events-none">
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
//                   <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M10 18a8 8 0 110-16 8 8 0 010 16z" />
//                 </svg>
//               </span>
//             </div>
//           </form>

//           {/* Right actions */}
//           <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
//             {/* User bubble */}
//             <div className="flex items-center gap-2 rounded-full border border-gray-200 pl-1 pr-2 sm:pr-3 py-0.5 bg-white">
//               <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full grid place-items-center bg-gray-100 text-gray-700 font-semibold overflow-hidden flex-shrink-0">
//                 {user?.avatar ? (
//                   <img src={user.avatar} alt="avatar" className="h-full w-full object-cover" />
//                 ) : user ? (
//                   <span className="text-sm">{initial}</span>
//                 ) : (
//                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
//                     <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15.75 7.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
//                     <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5a7.5 7.5 0 0115 0" />
//                   </svg>
//                 )}
//               </div>
//               {user && (
//                 <span className="hidden sm:block text-xs sm:text-sm font-medium text-gray-900 max-w-[100px] truncate">
//                   {user.name || user.email}
//                 </span>
//               )}
//             </div>

//             <button
//               onClick={handleLogout}
//               className="flex items-center justify-center w-9 h-9 rounded-lg bg-rose-600 text-white shadow-sm hover:bg-rose-700 active:bg-rose-800 transition-colors"
//               aria-label="Đăng xuất"
//             >
//               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
//                 <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1" />
//               </svg>
//             </button>
//           </div>
//         </div>
//       </header>

//       {/* Overlay (mobile) */}
//       {sidebarOpen && (
//         <div
//           className="fixed inset-0 z-40 bg-black/40 md:hidden"
//           onClick={() => setSidebarOpen(false)}
//         />
//       )}

//       <div className="flex flex-1 relative">
//         {/* Sidebar */}
//         <aside
//           className={[
//             "fixed md:static top-0 left-0 bottom-0 z-50 w-64 sm:w-72 bg-white border-r shadow-2xl md:shadow-none overflow-y-auto",
//             "transition-transform duration-300 ease-out",
//             sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
//           ].join(" ")}
//         >
//           {/* Mobile header */}
//           <div className="h-14 sm:h-16 border-b px-4 flex items-center justify-between md:hidden sticky top-0 bg-white z-10">
//             <span className="font-semibold text-gray-900">Menu</span>
//             <button
//               aria-label="Đóng menu"
//               className="flex items-center justify-center w-9 h-9 rounded-md border border-gray-300 hover:bg-gray-50 active:bg-gray-100"
//               onClick={() => setSidebarOpen(false)}
//             >
//               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
//                 <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 011.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
//               </svg>
//             </button>
//           </div>

//           <nav className="p-3 space-y-1">
//             <SidebarLink to="/" end>
//               <span className="inline-flex items-center justify-center h-4 w-4 text-gray-600">
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 9.75L12 3l9 6.75M4.5 10.5V19a1.5 1.5 0 001.5 1.5h3v-6h6v6h3A1.5 1.5 0 0020.5 19V10.5" />
//                 </svg>
//               </span>
//               Trang chủ
//             </SidebarLink>

//             <SidebarLink to="/admin" end>📊 Dashboard</SidebarLink>
//             <SidebarLink to="/admin/users">👥 Quản lý người dùng</SidebarLink>
//             <SidebarLink to="/admin/posts">📰 Quản lý bài đăng</SidebarLink>
//             <SidebarLink to="/admin/uploads">📁 Thư viện media</SidebarLink>
//             <SidebarLink to="/admin/settings">⚙️ Cấu hình</SidebarLink>
//             <SidebarLink to="/admin/moderation/listings">🧮 Duyệt tin BĐS</SidebarLink>

//             <div className="mt-4 mb-2 pt-4 border-t border-gray-200">
//               <div className="text-xs font-semibold text-gray-500 px-3 mb-2">Billing</div>
//               <SidebarLink to="/admin/billing/plans">💳 Gói & Giá</SidebarLink>
//               <SidebarLink to="/admin/billing/coupons">🏷️ Mã giảm giá</SidebarLink>
//               <SidebarLink to="/admin/billing/orders">🧾 Đơn hàng</SidebarLink>
//             </div>
//           </nav>
//         </aside>

//         {/* Content */}
//         <main className="flex-1 min-w-0 overflow-x-hidden">
//           <div className="w-full p-3 sm:p-4 md:p-6">
//             <Outlet />
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// }

// frontend/src/layouts/AdminLayout.jsx
// Layout dành cho admin – Sidebar có thể THU GỌN/MỞ RỘNG trên PC + overlay trên mobile
import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { logout as doLogout, AUTH_EVENT } from "../modules/auth/services/auth";

/* ================= Icons (đều là SVG inline, nhẹ & đồng bộ style) ================ */
const IconMenu = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
  </svg>
);
const IconClose = (p) => (
  <svg viewBox="0 0 20 20" fill="currentColor" {...p}>
    <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/>
  </svg>
);
const IconHome = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 9.75L12 3l9 6.75M4.5 10.5V19a1.5 1.5 0 001.5 1.5h3v-6h6v6h3A1.5 1.5 0 0020.5 19V10.5"/>
  </svg>
);
const IconDash = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
    <path strokeWidth="2" d="M3 12h7V4H3v8zm0 8h7v-6H3v6zm11 0h7V12h-7v8zm0-18v6h7V2h-7z"/>
  </svg>
);
const IconUsers = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M17 20v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2m18 0v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M9 11a4 4 0 100-8 4 4 0 000 8z"/>
  </svg>
);
const IconPosts = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
    <path strokeWidth="2" d="M7 8h10M7 12h6M5 21h14a2 2 0 002-2V7.414a2 2 0 00-.586-1.414l-3.414-3.414A2 2 0 0015.586 2H5a2 2 0 00-2 2v15a2 2 0 002 2z"/>
  </svg>
);
const IconMedia = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
    <path strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L18 18M2 7h20M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z"/>
  </svg>
);
const IconSettings = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M11.983 6.5a1 1 0 011.034-.258l1.41.47a1 1 0 001.2-.57l.54-1.28a1 1 0 01.95-.61h1.52a1 1 0 011 1v1.52a1 1 0 01-.61.95l-1.28.54a1 1 0 00-.57 1.2l.47 1.41a1 1 0 01-.26 1.03l-1.08 1.08a1 1 0 01-1.03.26l-1.41-.47a1 1 0 00-1.2.57l-.54 1.28a1 1 0 01-.95.61h-1.52a1 1 0 01-1-1v-1.52a1 1 0 01.61-.95l1.28-.54a1 1 0 00.57-1.2l-.47-1.41a1 1 0 01.26-1.03L11.983 6.5zM12 9.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z"/>
  </svg>
);
const IconShield = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const IconPlan = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
    <path strokeWidth="2" d="M4 6h16M4 10h16M4 14h10M4 18h10"/>
  </svg>
);
const IconCoupon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
    <path strokeWidth="2" d="M3 7h18v4a2 2 0 110 4v4H3v-4a2 2 0 110-4V7zM8 9h.01M12 9h.01M16 9h.01"/>
  </svg>
);
const IconOrder = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
    <path strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
  </svg>
);
const IconLogout = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1"/>
  </svg>
);
const IconChevron = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...p}>
    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
  </svg>
);

/* ================= SidebarLink ================= */
function SidebarLink({ to, icon, label, end, collapsed, onNavigate }) {
  return (
    <NavLink
      to={to}
      end={end}
      title={collapsed ? label : undefined}
      onClick={onNavigate}
      className={({ isActive }) =>
        [
          "group flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
          collapsed ? "justify-center" : "justify-start",
          isActive
            ? "bg-indigo-50 text-indigo-700 font-medium"
            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
        ].join(" ")
      }
    >
      <span className="inline-flex items-center justify-center h-5 w-5 text-gray-600">{icon}</span>
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  );
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  // user từ localStorage
  const [user, setUser] = useState(() => {
    try {
      const u = localStorage.getItem("user");
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  });

  // Trạng thái giao diện
  const [sidebarOpen, setSidebarOpen] = useState(false);      // overlay mobile
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // mini variant desktop
  const [q, setQ] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  // Theo dõi viewport để biết mobile/desktop
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)"); // < md
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Đồng bộ user khi login/logout
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

  // Đóng sidebar overlay khi đổi route (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Khóa scroll NỀN khi mở sidebar overlay (mobile)
  useEffect(() => {
    const lock = sidebarOpen && isMobile;
    document.body.style.overflow = lock ? "hidden" : "";
    document.documentElement.style.overflow = lock ? "hidden" : "";
    const onKey = (e) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [sidebarOpen, isMobile]);

  // Cuộn lên đầu khi đổi route
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
  }, [location.pathname]);

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

  // Danh sách menu
  const menus = useMemo(
    () => [
      { to: "/", label: "Trang chủ", icon: <IconHome className="h-4 w-4" /> , end: true },
      { to: "/admin", label: "Dashboard", icon: <IconDash className="h-4 w-4" />, end: true },
      { to: "/admin/users", label: "Quản lý người dùng", icon: <IconUsers className="h-4 w-4" /> },
      { to: "/admin/posts", label: "Quản lý bài đăng", icon: <IconPosts className="h-4 w-4" /> },
      { to: "/admin/uploads", label: "Thư viện media", icon: <IconMedia className="h-4 w-4" /> },
      { to: "/admin/settings", label: "Cấu hình", icon: <IconSettings className="h-4 w-4" /> },
      { to: "/admin/moderation/listings", label: "Duyệt tin BĐS", icon: <IconShield className="h-4 w-4" /> },
    ],
    []
  );

  const billings = useMemo(
    () => [
      { to: "/admin/billing/plans", label: "Gói & Giá", icon: <IconPlan className="h-4 w-4" /> },
      { to: "/admin/billing/coupons", label: "Mã giảm giá", icon: <IconCoupon className="h-4 w-4" /> },
      { to: "/admin/billing/orders", label: "Đơn hàng", icon: <IconOrder className="h-4 w-4" /> },
    ],
    []
  );

  /* ==================== RENDER ==================== */
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
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex flex-1 relative">
        {/* Sidebar */}
        <aside
          className={[
            "fixed md:static top-0 left-0 bottom-0 z-50 bg-white border-r shadow-2xl md:shadow-none overflow-y-auto",
            "transition-all duration-300 ease-out",
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
            "w-64",                 // width trên mobile overlay
            sidebarCollapsed ? "md:w-20" : "md:w-72", // width trên desktop
          ].join(" ")}
        >
          {/* Mobile header trong sidebar */}
          <div className="h-14 sm:h-16 border-b px-4 flex items-center justify-between md:hidden sticky top-0 bg-white z-10">
            <span className="font-semibold text-gray-900">Menu</span>
            <button
              aria-label="Đóng menu"
              className="flex items-center justify-center w-9 h-9 rounded-md border border-gray-300 hover:bg-gray-50 active:bg-gray-100"
              onClick={() => setSidebarOpen(false)}
            >
              <IconClose className="h-5 w-5 text-gray-700" />
            </button>
          </div>

          {/* Desktop header trong sidebar (nút thu gọn) */}
          <div className="hidden md:flex items-center justify-between px-3 pt-3 pb-2">
            <span className={`text-xs font-semibold text-gray-500 ${sidebarCollapsed ? "opacity-0 pointer-events-none select-none" : "opacity-100"}`}>
              Điều hướng
            </span>
            <button
              className="hidden md:inline-flex items-center justify-center w-8 h-8 rounded-md border border-gray-200 bg-white hover:bg-gray-50"
              title={sidebarCollapsed ? "Mở rộng" : "Thu gọn"}
              onClick={() => setSidebarCollapsed((v) => !v)}
            >
              <IconChevron className={`h-4 w-4 text-gray-700 transition-transform ${sidebarCollapsed ? "rotate-180" : ""}`} />
            </button>
          </div>

          {/* Nav */}
          <nav className="p-3 space-y-1">
            {menus.map((m) => (
              <SidebarLink
                key={m.to}
                to={m.to}
                end={m.end}
                icon={m.icon}
                label={m.label}
                collapsed={sidebarCollapsed}
                onNavigate={() => setSidebarOpen(false)}
              />
            ))}

            {/* Billing group */}
            <div className="mt-4 mb-2 pt-4 border-t border-gray-200">
              {!sidebarCollapsed && (
                <div className="text-xs font-semibold text-gray-500 px-3 mb-2">Billing</div>
              )}
              {billings.map((m) => (
                <SidebarLink
                  key={m.to}
                  to={m.to}
                  icon={m.icon}
                  label={m.label}
                  collapsed={sidebarCollapsed}
                  onNavigate={() => setSidebarOpen(false)}
                />
              ))}
            </div>
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0 overflow-x-hidden">
          <div className="w-full p-3 sm:p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
