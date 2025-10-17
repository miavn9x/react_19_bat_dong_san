
// ==========================================
//  frontend/src/guards/RoleRoute.jsx
// ==========================================


import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

function parseJwt(token = "") {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch { return null; }
}

export default function RoleRoute({ allow = [], children }) {
  const [checkDone, setCheckDone] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkRole = () => {
      const token = localStorage.getItem("token") || "";
      const role = parseJwt(token)?.role || "";
      setHasAccess(!!role && allow.includes(role));
      setCheckDone(true);
    };
    checkRole();

    const handler = () => checkRole();
    window.addEventListener("auth-changed", handler);
    return () => window.removeEventListener("auth-changed", handler);
  }, [allow]);

  if (!checkDone) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return hasAccess ? children : <Navigate to="/" replace />;
}
