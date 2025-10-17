// frontend/src/modules/admin/users/billing/hooks/useMyQuota.js

import { useEffect, useState, useCallback } from "react";
import { getMyQuota } from "../services/billing.service";

export default function useMyQuota() {
  const [remaining, setRemaining] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setErr("");
    try {
      const data = await getMyQuota();
      setRemaining(Number(data?.remaining || 0));
    } catch (e) { setErr(e.message || "Cannot load quota"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  return { remaining, loading, error, reload: load };
}
