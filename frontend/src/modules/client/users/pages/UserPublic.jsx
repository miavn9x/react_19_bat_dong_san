import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPublicProfile } from "../services/user";

export default function UserPublic() {
  const { id } = useParams();
  const [u, setU] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const data = await getPublicProfile(id);
        if (alive) setU(data);
      } catch (e) {
        if (alive) setErr(e?.response?.data?.message || "Không tải được hồ sơ");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  if (loading) return <div className="text-sm text-gray-500">Đang tải...</div>;
  if (err) return <div className="rounded border border-rose-200 bg-rose-50 p-3 text-rose-700">{err}</div>;
  if (!u) return null;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Hồ sơ công khai</h1>
      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        <div className="h-40 w-40 rounded-xl overflow-hidden bg-gray-100">
          {u.avatar ? <img className="h-full w-full object-cover" src={u.avatar} alt="" /> : null}
        </div>
        <div className="space-y-2 text-sm">
          <div><b>Tên:</b> {u.name}</div>
          <div><b>Điện thoại:</b> {u.phone || "-"}</div>
          <div><b>Địa chỉ:</b> {u.address || "-"}</div>
          <div><b>Role:</b> {u.role}</div>
          {/* KHÔNG có email theo yêu cầu */}
        </div>
      </div>
    </div>
  );
}
