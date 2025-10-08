// // // src/guards/RoleRoute.jsx

// import { Navigate } from "react-router-dom";

// export default function RoleRoute({ allow = [], children }) {
//   let user = null;
//   try {
//     const raw = localStorage.getItem("user");
//     user = raw ? JSON.parse(raw) : null;
//   } catch {
//     user = null;
//   }

//   if (!user) return <Navigate to="/login" replace />;
//   if (!allow.includes(user.role)) return <Navigate to="/" replace />;
//   return children;
// }
import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getMe } from "../modules/auth/services/auth";

export default function RoleRoute({ allow = [], children }) {
  const location = useLocation();

  // Đọc localStorage (không dùng return sớm trước hooks)
  const localUser = useMemo(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const localAllowed = useMemo(
    () => (localUser ? allow.includes(localUser.role) : false),
    [localUser, allow]
  );

  // Khóa deps phức tạp: dùng key ổn định
  const allowKey = useMemo(() => allow.join("|"), [allow]);

  // Trạng thái verify server
  const [mustLogin, setMustLogin] = useState(!localUser);      // token/lỗi auth
  const [serverAllowed, setServerAllowed] = useState(localAllowed);
  const [verified, setVerified] = useState(!localAllowed || !localUser ? true : false);
  // ^ nếu local chưa đủ quyền / chưa đăng nhập: coi như đã "xác định" -> tránh verify thừa

  useEffect(() => {
    let alive = true;

    // Chỉ verify khi có user và localAllowed (tránh gọi thừa)
    if (!localUser || !localAllowed) {
      setVerified(true);
      return;
    }

    const verify = async () => {
      try {
        const me = await getMe(); // lấy role mới nhất từ server
        if (!alive) return;
        localStorage.setItem("user", JSON.stringify(me));
        // use allowKey (stable string) instead of direct 'allow' to satisfy hook deps
        const allowedFromKey = allowKey ? allowKey.split("|") : [];
        setServerAllowed(allowedFromKey.includes(me.role));
      } catch {
        if (!alive) return;
        setMustLogin(true); // token hết hạn / lỗi auth
      } finally {
        if (alive) setVerified(true);
      }
    };

    verify();

    // Re-verify khi tab quay lại & khi đổi route trong khu admin
    const onVisible = () => {
      if (document.visibilityState === "visible") verify();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      alive = false;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [location.pathname, allowKey, localUser, localAllowed]);

  // Quyết định điều hướng (sau khi đã khởi tạo hooks)
  if (mustLogin) return <Navigate to="/login" replace />;

  // Nếu local đã không đủ quyền -> đá ngay (tránh flicker)
  if (!localAllowed) return <Navigate to="/" replace />;

  // Sau verify: nếu server xác nhận không đủ quyền -> đá khỏi admin
  if (verified && !serverAllowed) return <Navigate to="/" replace />;

  // Cho render trong lúc verify để mượt
  return children;
}
