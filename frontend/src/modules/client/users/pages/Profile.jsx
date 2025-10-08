//frontend/src/modules/client/users/pages/Profile.jsx
//Trang cá nhân của chính mình (có thể chỉnh sửa) → hiện thông tin và cho phép đổi thông tin. (file bạn đang dùng: Profile.jsx
import useProfile from "../hooks/useProfile";
import ProfileForm from "../components/ProfileForm";
import { useState } from "react";

export default function Profile() {
  const { me, loading, error, save, saving } = useProfile();
  const [modalOpen, setModalOpen] = useState(false);

  const initial = (me?.name || me?.email || "?").trim().charAt(0).toUpperCase();

  if (error) return (
    <div className="rounded-lg border border-rose-300 bg-rose-50 p-4 text-rose-700 shadow-sm">
      {error}
    </div>
  );

  if (loading) return (
    <div className="flex justify-center items-center h-32">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      <span className="ml-3 text-sm text-gray-500">Đang tải...</span>
    </div>
  );

  if (!me) return null;

  return (
    <div className=" mx-auto p-6 bg-white rounded-xl shadow-lg space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 border-b pb-4">Thông tin cá nhân</h1>
      <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
        <div className="flex flex-col items-center md:items-start">
          <div 
            className="h-48 w-48 rounded-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 shadow-md cursor-pointer"
            onClick={() => me.avatar && setModalOpen(true)}
          >
            {me.avatar ? (
              <img className="h-full w-full object-cover" src={me.avatar} alt={me.name || me.email} />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-6xl font-bold text-gray-500">
                {initial}
              </div>
            )}
          </div>
          <div className="mt-6 space-y-3 text-base text-gray-700 text-center md:text-left">
            <div className="flex items-center gap-3">
              <svg className="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="font-semibold">Email:</span> {me.email}
            </div>
            <div className="flex items-center gap-3">
              <svg className="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <span className="font-semibold">Role:</span> {me.role}
            </div>
          </div>
        </div>
        <div>
          <ProfileForm me={me} onSave={save} saving={saving} />
        </div>
      </div>

      {/* Modal for enlarged avatar */}
      {modalOpen && me.avatar && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setModalOpen(false)}
        >
          <div className="relative max-w-3xl max-h-[90vh] overflow-auto rounded-xl shadow-2xl">
            <img 
              src={me.avatar} 
              alt={me.name || me.email} 
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