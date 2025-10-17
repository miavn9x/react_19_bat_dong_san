
// frontend/src/modules/admin/billing/pages/AdminPlansPage.jsx
import { useMemo, useState } from "react";
import usePlans from "../../billing/hooks/usePlans";

const CURRENCIES = ["VND", "USD"];

// Style helpers
const clsInput =
  "h-10 w-full rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
const clsBtnPrimary =
  "h-10 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 disabled:opacity-60 disabled:cursor-not-allowed transition-colors";
const clsBtnSecondary =
  "h-10 inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 transition-colors";

export default function AdminPlansPage() {
  const { items, loading, err, onCreate, onUpdate, onDelete } = usePlans();

  const [form, setForm] = useState({
    code: "",
    name: "",
    price: 0,
    currency: "VND",
    credits: 1,
    defaultDiscountPct: 0,
    isActive: true,
    sortOrder: 0,
  });

  const [q, setQ] = useState("");
  const [onlyActive, setOnlyActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [sortKey, setSortKey] = useState("sortOrder");
  const [sortDir, setSortDir] = useState("asc");

  const currencySymbol = form.currency === "USD" ? "$" : "₫";

  // Validate form
  const validate = () => {
    const e = {};
    if (!form.code.trim()) e.code = "Bắt buộc";
    if (!form.name.trim()) e.name = "Bắt buộc";
    if (+form.price < 0) e.price = "Phải ≥ 0";
    if (+form.credits < 0) e.credits = "Phải ≥ 0";
    if (+form.defaultDiscountPct < 0 || +form.defaultDiscountPct > 100) e.defaultDiscountPct = "0–100";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  async function handleCreate(e) {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      ...form,
      code: form.code.trim(),
      name: form.name.trim(),
      price: +form.price || 0,
      credits: +form.credits || 0,
      defaultDiscountPct: Math.max(0, Math.min(100, +form.defaultDiscountPct || 0)),
      sortOrder: +form.sortOrder || 0,
      currency: form.currency || "VND",
      isActive: !!form.isActive,
    };

    setSubmitting(true);
    try {
      await onCreate(payload);
      setForm({
        code: "",
        name: "",
        price: 0,
        currency: "VND",
        credits: 1,
        defaultDiscountPct: 0,
        isActive: true,
        sortOrder: 0,
      });
      setErrors({});
    } finally {
      setSubmitting(false);
    }
  }

  // Filter + search + sort
  const view = useMemo(() => {
    let list = Array.isArray(items) ? [...items] : [];
    if (onlyActive) list = list.filter((p) => !!p.isActive);
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      list = list.filter(
        (p) =>
          String(p.code || "").toLowerCase().includes(s) ||
          String(p.name || "").toLowerCase().includes(s)
      );
    }
    list.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      const va = a?.[sortKey];
      const vb = b?.[sortKey];
      if (["price", "credits", "defaultDiscountPct", "sortOrder"].includes(sortKey)) {
        return ((+va || 0) - (+vb || 0)) * dir;
      }
      return String(va || "").localeCompare(String(vb || ""), "vi") * dir;
    });
    return list;
  }, [items, onlyActive, q, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <div className="p-4 space-y-6 w-full mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-gray-900">Quản lý Gói &amp; Giá</h1>
        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" aria-hidden>
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Đang tải…</span>
          </div>
        )}
      </div>

      {err && <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700">{err}</div>}

      {/* FORM: Responsive grid, mobile 1 cột / tablet 2–4 / desktop 12 */}
      <form onSubmit={handleCreate} className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
        <h2 className="text-base font-medium text-gray-900 mb-4">Tạo gói mới</h2>

        {/* Row 1: Code + Name */}
        <div className="grid gap-4 sm:grid-cols-2 mb-4">
          <label className="text-sm">
            <span className="block text-gray-700 font-medium mb-1.5">
              Mã gói <span className="text-rose-600">*</span>
            </span>
            <input
              className={`${clsInput} uppercase font-mono ${errors.code ? "border-rose-500" : ""}`}
              placeholder="VD: BASIC"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              onBlur={() => setForm((f) => ({ ...f, code: f.code.trim().toUpperCase() }))}
            />
            <div className="text-xs text-gray-500 mt-1">Chỉ chữ in hoa, không dấu, không khoảng trắng</div>
            {errors.code && <div className="text-xs text-rose-600 mt-1">{errors.code}</div>}
          </label>

          <label className="text-sm">
            <span className="block text-gray-700 font-medium mb-1.5">
              Tên gói <span className="text-rose-600">*</span>
            </span>
            <input
              className={`${clsInput} ${errors.name ? "border-rose-500" : ""}`}
              placeholder="VD: Gói Cơ Bản"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            {errors.name && <div className="text-xs text-rose-600 mt-1">{errors.name}</div>}
          </label>
        </div>

        {/* Row 2: Price + Currency + Credits + Discount */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
          <label className="text-sm">
            <span className="block text-gray-700 font-medium mb-1.5">Giá</span>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">{currencySymbol}</span>
              <input
                className={`${clsInput} pl-8 ${errors.price ? "border-rose-500" : ""}`}
                type="number"
                min="0"
                step="1000"
                placeholder="0"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
            {errors.price && <div className="text-xs text-rose-600 mt-1">{errors.price}</div>}
          </label>

          <label className="text-sm">
            <span className="block text-gray-700 font-medium mb-1.5">Tiền tệ</span>
            <select
              className={`${clsInput} cursor-pointer`}
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            <span className="block text-gray-700 font-medium mb-1.5">Credits</span>
            <input
              className={`${clsInput} ${errors.credits ? "border-rose-500" : ""}`}
              type="number"
              min="0"
              placeholder="1"
              value={form.credits}
              onChange={(e) => setForm({ ...form, credits: e.target.value })}
            />
            {errors.credits && <div className="text-xs text-rose-600 mt-1">{errors.credits}</div>}
          </label>

          <label className="text-sm">
            <span className="block text-gray-700 font-medium mb-1.5">Giảm giá (%)</span>
            <div className="relative">
              <input
                className={`${clsInput} pr-8 ${errors.defaultDiscountPct ? "border-rose-500" : ""}`}
                type="number"
                min="0"
                max="100"
                placeholder="0"
                value={form.defaultDiscountPct}
                onChange={(e) => setForm({ ...form, defaultDiscountPct: e.target.value })}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
            </div>
            {errors.defaultDiscountPct && (
              <div className="text-xs text-rose-600 mt-1">{errors.defaultDiscountPct}</div>
            )}
          </label>
        </div>

        {/* Row 3: Sort + Active + Actions (RESPONSIVE GRID) */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-12 items-end">
          <label className="text-sm lg:col-span-4">
            <span className="block text-gray-700 font-medium mb-1.5">
              Thứ tự hiển thị <span className="text-xs text-gray-500">(Số nhỏ đứng trước)</span>
            </span>
            <input
              className={clsInput}
              type="number"
              placeholder="0"
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
            />
          </label>

          <div className="h-10 flex items-center lg:col-span-3">
            <label className="inline-flex items-center gap-2.5 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="font-medium text-gray-700">Kích hoạt gói</span>
            </label>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 lg:col-span-5 sm:justify-end">
            <button
              type="button"
              className={`${clsBtnSecondary} w-full sm:w-auto`}
              onClick={() =>
                setForm({
                  code: "",
                  name: "",
                  price: 0,
                  currency: "VND",
                  credits: 1,
                  defaultDiscountPct: 0,
                  isActive: true,
                  sortOrder: 0,
                })
              }
            >
              Làm mới
            </button>
            <button disabled={submitting} className={`${clsBtnPrimary} w-full sm:w-auto`}>
              {submitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden>
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Đang tạo…
                </>
              ) : (
                "Tạo gói"
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Filter section */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 flex flex-col sm:flex-row sm:items-end gap-4">
        <label className="text-sm flex-1">
          <span className="block text-gray-700 font-medium mb-1.5">Tìm kiếm</span>
          <div className="relative">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Nhập mã gói hoặc tên gói…"
              className={`${clsInput} pl-9`}
            />
            <span className="absolute inset-y-0 left-3 grid place-items-center">
              <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                <path strokeWidth="2" d="M21 21l-4.35-4.35M10 18a8 8 0 110-16 8 8 0 010 16z" />
              </svg>
            </span>
          </div>
        </label>

        <label className="inline-flex items-center gap-2.5 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={onlyActive}
            onChange={(e) => setOnlyActive(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="font-medium text-gray-700">Chỉ hiển thị Active</span>
        </label>
      </div>

      {/* ===== Mobile: Card list ===== */}
      <div className="md:hidden space-y-3">
        {view.map((p) => (
          <div key={p._id} className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-mono text-xs text-indigo-600">{p.code}</div>
                <div className="text-base font-semibold text-gray-900">{p.name}</div>
              </div>
              <span
                className={
                  "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium " +
                  (p.isActive
                    ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                    : "bg-gray-100 text-gray-600 border border-gray-200")
                }
              >
                {p.isActive ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-gray-700">
              <div><span className="text-gray-500">Giá:</span> {(p.price || 0).toLocaleString("vi-VN")} {p.currency}</div>
              <div><span className="text-gray-500">Credits:</span> {p.credits}</div>
              <div><span className="text-gray-500">Giảm:</span> {p.defaultDiscountPct}%</div>
              <div><span className="text-gray-500">Thứ tự:</span> {p.sortOrder ?? 0}</div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                className="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                onClick={() => onUpdate(p._id, { isActive: !p.isActive })}
              >
                {p.isActive ? "Tắt" : "Bật"}
              </button>
              <button
                className="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-rose-600 text-white hover:bg-rose-700 transition-colors"
                onClick={() => {
                  if (confirm("Bạn có chắc muốn xoá gói này?")) onDelete(p._id);
                }}
              >
                Xoá
              </button>
            </div>
          </div>
        ))}
        {view.length === 0 && !loading && (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-8 text-center text-gray-400 text-sm">
            Không có dữ liệu
          </div>
        )}
      </div>

      {/* ===== Desktop: Table ===== */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <Th onClick={() => toggleSort("code")} active={sortKey === "code"} dir={sortDir}>Mã gói</Th>
              <Th onClick={() => toggleSort("name")} active={sortKey === "name"} dir={sortDir}>Tên gói</Th>
              <Th onClick={() => toggleSort("price")} active={sortKey === "price"} dir={sortDir}>Giá</Th>
              <Th onClick={() => toggleSort("credits")} active={sortKey === "credits"} dir={sortDir}>Credits</Th>
              <Th onClick={() => toggleSort("defaultDiscountPct")} active={sortKey === "defaultDiscountPct"} dir={sortDir}>Giảm giá</Th>
              <Th onClick={() => toggleSort("sortOrder")} active={sortKey === "sortOrder"} dir={sortDir}>Thứ tự</Th>
              <th className="px-4 py-3 text-right font-medium text-gray-700">Trạng thái</th>
              <th className="px-4 py-3 text-right font-medium text-gray-700">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {view.map((p) => (
              <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs font-medium text-indigo-600">{p.code}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                <td className="px-4 py-3 text-gray-700">
                  {(p.price || 0).toLocaleString("vi-VN")} {p.currency}
                </td>
                <td className="px-4 py-3 text-gray-700">{p.credits}</td>
                <td className="px-4 py-3 text-gray-700">{p.defaultDiscountPct}%</td>
                <td className="px-4 py-3 text-gray-700">{p.sortOrder ?? 0}</td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={
                      "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium " +
                      (p.isActive
                        ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                        : "bg-gray-100 text-gray-600 border border-gray-200")
                    }
                  >
                    {p.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                    onClick={() => onUpdate(p._id, { isActive: !p.isActive })}
                    title={p.isActive ? "Tắt gói" : "Bật gói"}
                  >
                    {p.isActive ? "Tắt" : "Bật"}
                  </button>
                  <button
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-600 text-white hover:bg-rose-700 transition-colors"
                    onClick={() => {
                      if (confirm("Bạn có chắc muốn xoá gói này?")) onDelete(p._id);
                    }}
                  >
                    Xoá
                  </button>
                </td>
              </tr>
            ))}
            {view.length === 0 && !loading && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400 text-sm">
                  Không có dữ liệu
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  function Th({ children, onClick, active, dir }) {
    return (
      <th
        onClick={onClick}
        className="px-4 py-3 text-left font-medium text-gray-700 select-none cursor-pointer hover:bg-gray-100 transition-colors"
        title="Nhấn để sắp xếp"
      >
        <span className="inline-flex items-center gap-1.5">
          {children}
          <span className={`text-xs transition-colors ${active ? "text-indigo-600" : "text-gray-400"}`}>
            {active ? (dir === "asc" ? "▲" : "▼") : "↕"}
          </span>
        </span>
      </th>
    );
  }
}
