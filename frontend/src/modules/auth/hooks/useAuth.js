
// // ==========================================
// // FILE 3: frontend/src/modules/auth/hooks/useAuth.js
// // ==========================================


import { useEffect, useState, useCallback } from "react";
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  getMe,
  AUTH_EVENT,
} from "../services/auth";

export default function useAuth() {
  const [user, setUser] = useState(null); // RAM-only
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Khi token thay đổi (auth-changed) hoặc lần đầu mount → nếu có token thì /users/me
  useEffect(() => {
    const onAuthChanged = async () => {
      const hasToken = !!localStorage.getItem("token");
      if (!hasToken) { setUser(null); return; }
      try {
        setLoading(true);
        const me = await getMe();
        setUser(me);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    window.addEventListener(AUTH_EVENT, onAuthChanged);
    onAuthChanged(); // bootstrap khi reload
    return () => window.removeEventListener(AUTH_EVENT, onAuthChanged);
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      setLoading(true);
      const me = await getMe();
      setUser(me);
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
      // Có thể dùng user trả về để điều hướng ngay
      setUser(user || null);
      return user;
    } catch (e) {
      const msg = e?.response?.data?.message || "Đăng nhập thất bại";
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (name, email, password) => {
    setError("");
    setLoading(true);
    try {
      const { user } = await apiRegister(name, email, password);
      return user;
    } catch (e) {
      const msg = e?.response?.data?.message || "Đăng ký thất bại";
      setError(msg);
      throw new Error(msg);
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
