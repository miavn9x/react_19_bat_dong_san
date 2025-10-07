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

  // đồng bộ khi services phát "auth-changed"
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
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Đăng ký xong KHÔNG setUser (không coi là đã đăng nhập)
  const register = useCallback(async (name, email, password) => {
    setError("");
    setLoading(true);
    try {
      const { user } = await apiRegister(name, email, password);
      return user; // chỉ trả về để FE điều hướng sang /login
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
