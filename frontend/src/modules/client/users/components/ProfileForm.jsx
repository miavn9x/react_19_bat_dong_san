// frontend/src/modules/client/users/components/ProfileForm.jsx
// form chỉnh sửa thông tin cá nhân (dùng trong trang Profile.jsx)
// nhận props: me (thông tin user hiện tại), onSave (hàm lưu), saving (trạng thái đang lưu)
// chỉ name, avatar, phone, address
// hiện thị email (không cho sửa email)
import { useState, useEffect } from "react";

export default function ProfileForm({ me, onSave, saving = false }) {
  const [form, setForm] = useState({ name: "", avatar: "", phone: "", address: "" });

  useEffect(() => {
    if (me) setForm({
      name: me.name || "",
      avatar: me.avatar || "",
      phone: me.phone || "",
      address: me.address || "",
    });
  }, [me]);

  const submit = async (e) => {
    e.preventDefault();
    await onSave(form);
  };

  const set = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Họ tên</label>
        <input className="mt-1 w-full rounded border px-3 py-2" value={form.name} onChange={set("name")} />
      </div>

      <div>
        <label className="block text-sm font-medium">Avatar URL</label>
        <input className="mt-1 w-full rounded border px-3 py-2" value={form.avatar} onChange={set("avatar")} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Điện thoại</label>
          <input className="mt-1 w-full rounded border px-3 py-2" value={form.phone} onChange={set("phone")} />
        </div>
        <div>
          <label className="block text-sm font-medium">Địa chỉ</label>
          <input className="mt-1 w-full rounded border px-3 py-2" value={form.address} onChange={set("address")} />
        </div>
      </div>

      <button
        disabled={saving}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {saving ? "Đang lưu..." : "Lưu thay đổi"}
      </button>
    </form>
  );
}
