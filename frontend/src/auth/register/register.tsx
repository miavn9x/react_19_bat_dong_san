// src/auth/register/Register.tsx
import { useState, FormEvent, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

export default function Register() {
  const navigate = useNavigate();
  const { register, error, loading } = useAuth();

  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  const [msg, setMsg] = useState<string>("");

  // hiển/ẩn mật khẩu (mỗi ô có nút riêng)
  const [showPw, setShowPw] = useState<boolean>(false);
  const [showPw2, setShowPw2] = useState<boolean>(false);

  // cảnh báo Caps Lock
  const [capsOn1, setCapsOn1] = useState<boolean>(false);
  const [capsOn2, setCapsOn2] = useState<boolean>(false);

  // Xóa message khi user gõ lại
  useEffect(() => {
    if (msg) setMsg("");
  }, [name, email, password, confirmPassword, msg]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMsg("");

    // Validation phía client
    if (!name.trim()) return setMsg("Vui lòng nhập họ tên");
    if (!email.trim()) return setMsg("Vui lòng nhập email");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return setMsg("Email không hợp lệ");

    if (!password) return setMsg("Vui lòng nhập mật khẩu");
    if (password.length < 6) return setMsg("Mật khẩu phải có ít nhất 6 ký tự");

    if (!confirmPassword) return setMsg("Vui lòng nhập lại mật khẩu");
    if (password !== confirmPassword) return setMsg("Hai mật khẩu không khớp");

    try {
      // ✅ GỬI CHỈ 1 MẬT KHẨU lên BE
      await register(name.trim(), email.trim(), password);

      // ✅ Thành công → chuyển sang trang đăng nhập (kèm state để gợi ý)
      navigate("/login", {
        replace: true,
        state: { justRegistered: true, registeredEmail: email.trim() },
      });
    } catch (err: unknown) {
      // Xử lý lỗi chi tiết từ backend
      let message = "Đăng ký thất bại. Vui lòng thử lại.";

      if (err instanceof Error) {
        message = err.message;
      } else if (typeof err === "object" && err !== null) {
        const errorObj = err as any;

        if (errorObj.response?.data?.message) {
          message = errorObj.response.data.message;
        } else if (errorObj.response?.data?.error) {
          message = errorObj.response.data.error;
        } else if (errorObj.message) {
          message = errorObj.message;
        }

        const status = errorObj.response?.status;
        if (status === 409 || String(message).toLowerCase().includes("exist")) {
          message = "Email này đã được đăng ký. Vui lòng dùng email khác hoặc đăng nhập.";
        } else if (status === 400) {
          if (String(message).toLowerCase().includes("email")) {
            message = "Email không hợp lệ";
          } else if (String(message).toLowerCase().includes("password")) {
            message = "Mật khẩu không đủ mạnh";
          }
        } else if (status === 422) {
          message = "Thông tin không hợp lệ. Vui lòng kiểm tra lại.";
        } else if (status >= 500) {
          message = "Lỗi hệ thống. Vui lòng thử lại sau.";
        }
      }

      setMsg(message);
    }
  };

  // Ưu tiên hiển thị msg (client) trước error (từ hook)
  const hint = msg || error;
  const passwordsFilled = password.length > 0 && confirmPassword.length > 0;
  const passwordsMatch = password === confirmPassword;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow p-8">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Tạo tài khoản
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Điền thông tin bên dưới để đăng ký.
          </p>

          {/* Banner thông báo lỗi */}
          {hint && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm">
              <div className="flex gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-red-600 flex-shrink-0"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-red-700">{hint}</span>
              </div>
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Họ tên <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nguyễn Văn A"
                required
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Mật khẩu */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Mật khẩu <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyUp={(e) => setCapsOn1(e.getModifierState?.("CapsLock"))}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pr-10 text-gray-900 shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500"
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
                    // eye-off
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.584 10.587A3 3 0 0012 15a3 3 0 002.829-4.082M9.88 4.6A9.77 9.77 0 0112 4c5.523 0 10 4.477 10 8 0 1.345-.47 2.6-1.29 3.674M6.41 6.41C4.31 7.84 3 9.8 3 12c0 3.523 4.477 8 9 8 1.14 0 2.23-.2 3.237-.57" />
                    </svg>
                  ) : (
                    // eye
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                      <circle cx="12" cy="12" r="3" strokeWidth="2" />
                    </svg>
                  )}
                </button>
              </div>
              {capsOn1 && (
                <p className="mt-1 text-xs text-amber-600">Caps Lock đang bật — kiểm tra lại mật khẩu.</p>
              )}
              <p className="mt-1 text-xs text-gray-500">Tối thiểu 6 ký tự</p>
            </div>

            {/* Nhập lại mật khẩu (chỉ để kiểm tra, KHÔNG gửi lên BE) */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Nhập lại mật khẩu <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showPw2 ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyUp={(e) => setCapsOn2(e.getModifierState?.("CapsLock"))}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  className={[
                    "mt-1 block w-full rounded-lg border px-3 py-2 pr-10 text-gray-900 shadow-sm outline-none focus:ring-2",
                    passwordsFilled
                      ? passwordsMatch
                        ? "border-emerald-300 focus:border-emerald-400 focus:ring-emerald-500"
                        : "border-red-300 focus:border-red-400 focus:ring-red-500"
                      : "border-gray-300 focus:border-indigo-400 focus:ring-indigo-500",
                  ].join(" ")}
                />
                <button
                  type="button"
                  aria-label={showPw2 ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  aria-pressed={showPw2}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setShowPw2((v) => !v)}
                  className="absolute inset-y-0 right-2 mt-1 grid place-items-center rounded-md px-2 text-gray-500 hover:text-gray-700"
                >
                  {showPw2 ? (
                    // eye-off
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.584 10.587A3 3 0 0012 15a3 3 0 002.829-4.082M9.88 4.6A9.77 9.77 0 0112 4c5.523 0 10 4.477 10 8 0 1.345-.47 2.6-1.29 3.674M6.41 6.41C4.31 7.84 3 9.8 3 12c0 3.523 4.477 8 9 8 1.14 0 2.23-.2 3.237-.57" />
                    </svg>
                  ) : (
                    // eye
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                      <circle cx="12" cy="12" r="3" strokeWidth="2" />
                    </svg>
                  )}
                </button>
              </div>
              {capsOn2 && (
                <p className="mt-1 text-xs text-amber-600">Caps Lock đang bật — kiểm tra lại mật khẩu.</p>
              )}

              {/* Nhãn khớp/không khớp */}
              {passwordsFilled && (
                <p
                  className={[
                    "mt-1 text-xs",
                    passwordsMatch ? "text-emerald-600" : "text-red-600",
                  ].join(" ")}
                >
                  {passwordsMatch ? "Mật khẩu khớp" : "Mật khẩu không khớp"}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-white font-medium shadow hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Đang xử lý...
                </>
              ) : (
                "Đăng ký"
              )}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-500">
            Đã có tài khoản?{" "}
            <Link to="/login" className="font-medium text-indigo-600 hover:underline">
              Đăng nhập
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          Bằng cách tiếp tục, bạn đồng ý với Điều khoản & Chính sách bảo mật.
        </p>
      </div>
    </div>
  );
}
