//frontend/src/modules/client/users/pages/UserPublic.jsx
//Trang cá nhân của người khác (không thể chỉnh sửa) → hiện thông tin (file bạn đang dùng: UserPublic.jsx
//Trang hồ sơ công khai của người khác (chỉ xem) → chỉ hiển thị thông tin public, không chỉnh sửa. (file bạn đang dùng: UserPublic.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPublicProfile } from "../services/user";

export default function UserPublic() {
  const { id } = useParams();
  const [u, setU] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

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

  if (loading) return (
    <div className="flex justify-center items-center h-32">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      <span className="ml-3 text-sm text-gray-500">Đang tải...</span>
    </div>
  );
  
  if (err) return (
    <div className="rounded-lg border border-rose-300 bg-rose-50 p-4 text-rose-700 shadow-sm">
      {err}
    </div>
  );
  
  if (!u) return null;

  const initial = (u.name || "?").trim().charAt(0).toUpperCase();

  return (
    <div className=" mx-auto p-6 bg-white rounded-xl shadow-lg space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 border-b pb-4">Hồ sơ công khai</h1>
      <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
        <div className="flex justify-center md:justify-start">
          <div 
            className="h-48 w-48 rounded-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 shadow-md cursor-pointer"
            onClick={() => u.avatar && setModalOpen(true)}
          >
            {u.avatar ? (
              <img className="h-full w-full object-cover" src={u.avatar} alt={u.name} />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-6xl font-bold text-gray-500">
                {initial}
              </div>
            )}
          </div>
        </div>
        <div className="space-y-4 text-base text-gray-700">
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="font-semibold">Tên:</span> {u.name}
          </div>
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span className="font-semibold">Điện thoại:</span> {u.phone || "-"}
          </div>
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="font-semibold">Địa chỉ:</span> {u.address || "-"}
          </div>
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <span className="font-semibold">Role:</span> {u.role}
          </div>
          {/* KHÔNG có email theo yêu cầu */}
        </div>
      </div>

      {/* Modal for enlarged avatar */}
      {modalOpen && u.avatar && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setModalOpen(false)}
        >
          <div className="relative max-w-3xl max-h-[90vh] overflow-auto rounded-xl shadow-2xl">
            <img 
              src={u.avatar} 
              alt={u.name} 
              className="max-w-full max-h-[90vh] object-contain"
            />
            <button 
              className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/70 transition"
              onClick={() => setModalOpen(false)}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}