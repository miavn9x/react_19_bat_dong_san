import useProfile from "../hooks/useProfile";
import ProfileForm from "../components/ProfileForm";

export default function Profile() {
  const { me, loading, error, save, saving } = useProfile();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Thông tin cá nhân</h1>
      {error && <div className="rounded border border-rose-200 bg-rose-50 p-3 text-rose-700">{error}</div>}
      {loading ? (
        <div className="text-sm text-gray-500">Đang tải...</div>
      ) : me ? (
        <div className="grid gap-6 md:grid-cols-[220px_1fr]">
          <div>
            <div className="h-40 w-40 rounded-xl overflow-hidden bg-gray-100">
              {me.avatar ? <img className="h-full w-full object-cover" src={me.avatar} alt="" /> : null}
            </div>
            <div className="mt-3 text-sm text-gray-600">
              <div><b>Email:</b> {me.email}</div>
              <div><b>Role:</b> {me.role}</div>
            </div>
          </div>
          <div>
            <ProfileForm me={me} onSave={save} saving={saving} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
