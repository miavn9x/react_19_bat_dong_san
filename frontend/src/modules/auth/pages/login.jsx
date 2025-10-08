// // frontend/src/modules/auth/pages/login.jsx
// import { useState, useEffect } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import useAuth from "../hooks/useAuth";

// export default function Login() {
//   const navigate = useNavigate();
//   const { login, error, loading } = useAuth();

//   // ❌ Không dùng giá trị cứng — để rỗng để user nhập (dữ liệu phải từ BE)
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");

//   const [msg, setMsg] = useState("");
//   const [showPw, setShowPw] = useState(false);
//   const [capsOn, setCapsOn] = useState(false);

//   // Xoá message khi user gõ lại
//   useEffect(() => {
//     if (msg) setMsg("");
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [email, password]);

//   const onSubmit = async (e) => {
//     e.preventDefault();
//     setMsg("");

//     if (!email || !password) {
//       setMsg("Vui lòng nhập email & mật khẩu");
//       return;
//     }

//     try {
//       // Gọi BE; chỉ khi thành công mới điều hướng
//       await login(email, password);
//       navigate("/", { replace: true });
//     } catch (err) {
//       // Nếu BE trả lỗi -> hiển thị, KHÔNG điều hướng
//       const message = err?.message || err?.response?.data?.message || "Đăng nhập thất bại";
//       setMsg(message);
//     }
//   };

//   // Ưu tiên hiển thị lỗi cụ thể nhất
//   const hint = msg || error;

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
//       <div className="w-full max-w-md">
//         <div className="bg-white rounded-2xl shadow p-8">
//           <h2 className="text-2xl font-bold tracking-tight text-gray-900">
//             Đăng nhập
//           </h2>
//           <p className="mt-1 text-sm text-gray-500">
//             Nhập thông tin để tiếp tục.
//           </p>

//           {/* Banner lỗi */}
//           {hint && (
//             <div className="mt-4 rounded-lg border border-red-200 bg-red-50 text-red-700 p-3 text-sm">
//               {hint}
//             </div>
//           )}

//           <form onSubmit={onSubmit} className="mt-6 space-y-4">
//             <div>
//               <label
//                 htmlFor="email"
//                 className="block text-sm font-medium text-gray-700"
//               >
//                 Email
//               </label>
//               <input
//                 id="email"
//                 type="email"
//                 required
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-indigo-500"
//                 placeholder="you@example.com"
//               />
//             </div>

//             <div>
//               <label
//                 htmlFor="password"
//                 className="block text-sm font-medium text-gray-700"
//               >
//                 Mật khẩu
//               </label>

//               {/* Wrapper để đặt icon trong input */}
//               <div className="relative">
//                 <input
//                   id="password"
//                   type={showPw ? "text" : "password"}
//                   required
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   onKeyUp={(e) => setCapsOn(e.getModifierState?.("CapsLock"))}
//                   className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pr-10 text-gray-900 shadow-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-indigo-500"
//                   placeholder="••••••••"
//                   autoComplete="current-password"
//                 />

//                 {/* Nút hiện/ẩn mật khẩu */}
//                 <button
//                   type="button"
//                   aria-label={showPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
//                   aria-pressed={showPw}
//                   onMouseDown={(e) => e.preventDefault()} // giữ focus ở input
//                   onClick={() => setShowPw((v) => !v)}
//                   className="absolute inset-y-0 right-2 mt-1 grid place-items-center rounded-md px-2 text-gray-500 hover:text-gray-700"
//                 >
//                   {showPw ? (
//                     // icon eye-off
//                     <svg
//                       xmlns="http://www.w3.org/2000/svg"
//                       viewBox="0 0 24 24"
//                       className="h-5 w-5"
//                       fill="none"
//                       stroke="currentColor"
//                     >
//                       <path
//                         strokeWidth="2"
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         d="M3 3l18 18M10.584 10.587A3 3 0 0012 15a3 3 0 002.829-4.082M9.88 4.6A9.77 9.77 0 0112 4c5.523 0 10 4.477 10 8 0 1.345-.47 2.6-1.29 3.674M6.41 6.41C4.31 7.84 3 9.8 3 12c0 3.523 4.477 8 9 8 1.14 0 2.23-.2 3.237-.57"
//                       />
//                     </svg>
//                   ) : (
//                     // icon eye
//                     <svg
//                       xmlns="http://www.w3.org/2000/svg"
//                       viewBox="0 0 24 24"
//                       className="h-5 w-5"
//                       fill="none"
//                       stroke="currentColor"
//                     >
//                       <path
//                         strokeWidth="2"
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"
//                       />
//                       <circle cx="12" cy="12" r="3" strokeWidth="2" />
//                     </svg>
//                   )}
//                 </button>
//               </div>

//               {/* Cảnh báo Caps Lock */}
//               {capsOn && (
//                 <p className="mt-1 text-xs text-amber-600">
//                   Caps Lock đang bật — kiểm tra lại mật khẩu.
//                 </p>
//               )}
//             </div>

//             <button
//               type="submit"
//               disabled={loading}
//               className="inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-white font-medium shadow hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:opacity-60"
//             >
//               {loading ? "Đang xử lý..." : "Đăng nhập"}
//             </button>
//           </form>

//           <p className="mt-4 text-center text-sm text-gray-500">
//             Chưa có tài khoản?{" "}
//             <Link
//               to="/register"
//               className="font-medium text-indigo-600 hover:underline"
//             >
//               Đăng ký
//             </Link>
//           </p>
//         </div>

//         <p className="mt-6 text-center text-xs text-gray-400">
//           Bảo vệ tài khoản bằng mật khẩu đủ mạnh.
//         </p>
//       </div>
//     </div>
//   );
// }
// src/modules/auth/pages/login.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function Login() {
  const navigate = useNavigate();
  const { login, error, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [msg, setMsg] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [capsOn, setCapsOn] = useState(false);

  useEffect(() => {
    if (msg) setMsg("");
  }, [email, password]); // eslint-disable-line

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    if (!email || !password) {
      setMsg("Vui lòng nhập email & mật khẩu");
      return;
    }

    try {
      const u = await login(email, password);
      // ⬇️ điều hướng theo role
      if (u?.role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err) {
      const message = err?.message || err?.response?.data?.message || "Đăng nhập thất bại";
      setMsg(message);
    }
  };

  const hint = msg || error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow p-8">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Đăng nhập</h2>
          <p className="mt-1 text-sm text-gray-500">Nhập thông tin để tiếp tục.</p>

          {hint && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 text-red-700 p-3 text-sm">
              {hint}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-indigo-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Mật khẩu</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyUp={(e) => setCapsOn(e.getModifierState?.("CapsLock"))}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pr-10 text-gray-900 shadow-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-indigo-500"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  aria-label={showPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  aria-pressed={showPw}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute inset-y-0 right-2 mt-1 grid place-items-center rounded-md px-2 text-gray-500 hover:text-gray-700"
                >
                  {showPw ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
                      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.584 10.587A3 3 0 0012 15a3 3 0 002.829-4.082M9.88 4.6A9.77 9.77 0 0112 4c5.523 0 10 4.477 10 8 0 1.345-.47 2.6-1.29 3.674M6.41 6.41C4.31 7.84 3 9.8 3 12c0 3.523 4.477 8 9 8 1.14 0 2.23-.2 3.237-.57" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
                      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                      <circle cx="12" cy="12" r="3" strokeWidth="2" />
                    </svg>
                  )}
                </button>
              </div>
              {capsOn && <p className="mt-1 text-xs text-amber-600">Caps Lock đang bật — kiểm tra lại mật khẩu.</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-white font-medium shadow hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:opacity-60"
            >
              {loading ? "Đang xử lý..." : "Đăng nhập"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-500">
            Chưa có tài khoản?{" "}
            <Link to="/register" className="font-medium text-indigo-600 hover:underline">
              Đăng ký
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">Bảo vệ tài khoản bằng mật khẩu đủ mạnh.</p>
      </div>
    </div>
  );
}
