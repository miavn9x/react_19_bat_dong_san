// // src/hooks/useAuth.js
// import { useEffect, useState, useCallback } from "react";
// import { login as apiLogin, register as apiRegister, logout as apiLogout, getMe } from "../services/auth";

// export default function useAuth() {
//   const [user, setUser] = useState(() => {
//     try {
//       const u = localStorage.getItem("user");
//       return u ? JSON.parse(u) : null;
//     } catch {
//       return null;
//     }
//   });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const refreshProfile = useCallback(async () => {
//     try {
//       setLoading(true);
//       const me = await getMe();
//       setUser(me);
//       localStorage.setItem("user", JSON.stringify(me));
//       setError("");
//     } catch (e) {
//       // nếu token hỏng → coi như chưa đăng nhập
//       setError(e?.response?.data?.message || "Không lấy được hồ sơ");
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   const login = useCallback(async (email, password) => {
//     setError(""); setLoading(true);
//     try {
//       const { user } = await apiLogin(email, password);
//       setUser(user);
//       return user;
//     } catch (e) {
//       const msg = e?.response?.data?.message || "Đăng nhập thất bại";
//       setError(msg);
//       throw new Error(msg);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   const register = useCallback(async (name, email, password) => {
//     setError(""); setLoading(true);
//     try {
//       const { user } = await apiRegister(name, email, password);
//       setUser(user);
//       return user;
//     } catch (e) {
//       const msg = e?.response?.data?.message || "Đăng ký thất bại";
//       setError(msg);
//       throw new Error(msg);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   const logout = useCallback(() => {
//     apiLogout();
//     setUser(null);
//   }, []);

//   // Option: lần đầu vào trang có thể gọi refreshProfile() để đồng bộ user từ token
//   useEffect(() => {
//     // Nếu muốn, bật dòng dưới: refreshProfile();
//   }, [refreshProfile]);

//   return { user, loading, error, login, register, logout, refreshProfile };
// }
// src/hooks/useAuth.js
import { useEffect, useState, useCallback } from "react";
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  getMe,
} from "../services/auth";

export default function useAuth() {
  const [user, setUser] = useState(() => {
    try {
      const u = localStorage.getItem("user");
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ✅ Đồng bộ user khi có sự kiện auth-changed
  useEffect(() => {
    const syncUser = () => {
      try {
        const u = localStorage.getItem("user");
        setUser(u ? JSON.parse(u) : null);
      } catch {
        setUser(null);
      }
    };

    window.addEventListener("auth-changed", syncUser);
    return () => window.removeEventListener("auth-changed", syncUser);
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      setLoading(true);
      const me = await getMe();
      setUser(me);
      localStorage.setItem("user", JSON.stringify(me));
      setError("");
    } catch (e) {
      setError(e?.response?.data?.message || "Không lấy được hồ sơ");
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    setError("");
    setLoading(true);
    try {
      const { user } = await apiLogin(email, password);
      setUser(user);
      return user;
    } catch (e) {
      const msg = e?.response?.data?.message || "Đăng nhập thất bại";
      setError(msg);
      throw new Error(msg); // ✅ Ném lỗi để Login.jsx catch
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (name, email, password) => {
    setError("");
    setLoading(true);
    try {
      const { user } = await apiRegister(name, email, password);
      setUser(user);
      return user;
    } catch (e) {
      const msg = e?.response?.data?.message || "Đăng ký thất bại";
      setError(msg);
      throw new Error(msg); // ✅ Ném lỗi để Register.jsx catch
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    apiLogout();
    setUser(null);
  }, []);

  return { user, loading, error, login, register, logout, refreshProfile };
}