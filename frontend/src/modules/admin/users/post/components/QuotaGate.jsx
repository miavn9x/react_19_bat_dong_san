// frontend/src/modules/admin/users/post/components/QuotaGate.jsx
import { useState } from "react";
import { createOrder } from "../../billing/services/billing.service";

export default function QuotaGate({ remaining, onCreatedOrder }) {
  const [busy, setBusy] = useState(false);
  const [error, setErr] = useState("");

  const buyTrialPlus = async () => {
    setBusy(true); setErr("");
    try {
      // Ví dụ: bạn đã seed plan code "BDS10" (10 credits). Thay code đúng với BE của bạn.
      const order = await createOrder({ planCode: "BDS10", quantity: 1 });
      onCreatedOrder?.(order);
    } catch (e) { setErr(e.message || "Không tạo được đơn mua"); }
    finally { setBusy(false); }
  };

  return (
    <div className="p-4 rounded-xl border bg-amber-50">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-amber-800">Bạn đã hết lượt đăng bài</h3>
          <p className="text-sm text-amber-700">
            Tài khoản đã dùng hết số lượt cho phép (trial mặc định 3). Vui lòng mua gói để tiếp tục đăng bài.
          </p>
          {error && <p className="text-sm text-rose-600 mt-1">{error}</p>}
        </div>
        <button
          onClick={buyTrialPlus}
          disabled={busy}
          className="px-3 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700"
        >
          {busy ? "Đang tạo đơn…" : "Mua gói ngay"}
        </button>
      </div>
      <p className="text-xs text-amber-700 mt-2">Lượt còn lại hiện tại: <b>{Number(remaining || 0)}</b></p>
    </div>
  );
}
