import { useEffect, useMemo, useState } from "react";
import useCoupons from "../../billing/hooks/useCoupons";

/** ==========================================
 * AdminCouponsPage — UI Pro + Ultra Responsive
 * - Form tạo nhanh (validate) + debounce tìm kiếm
 * - Bảng (desktop) + Cards (mobile)
 * - Sắp xếp cột, phân trang, lọc Active/Expired
 * - Skeleton loading, empty/error state, A11y
 * ========================================== */

// Debounce input value
function useDebounced(value, delay = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

function isExpired(c) {
  if (!c?.expiresAt) return false;
  const d = new Date(c.expiresAt);
  return Number.isFinite(d.getTime()) && d.getTime() < Date.now();
}

function StatusPill({ active, expired }) {
  const cls = expired
    ? "bg-rose-50 text-rose-700 border-rose-200"
    : active
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : "bg-gray-100 text-gray-700 border-gray-200";
  const label = expired ? "Expired" : active ? "Active" : "Inactive";
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {label}
    </span>
  );
}

// Input với icon trái
function InputIconLeft({ icon, className = "", ...props }) {
  return (
    <div className="relative">
      <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 pointer-events-none">
        {icon}
      </span>
      <input
        {...props}
        className={[
          "w-full h-11 rounded-xl border-2 border-gray-200 bg-white pl-10 pr-3 text-sm",
          "outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all",
          className,
        ].join(" ")}
      />
    </div>
  );
}

// Input có suffix phải (ví dụ %)
function InputSuffix({ suffix, className = "", ...props }) {
  return (
    <div className="relative">
      <input
        {...props}
        className={[
          "w-full h-11 rounded-xl border-2 border-gray-200 bg-white pl-3 pr-10 text-sm",
          "outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all",
          className,
        ].join(" ")}
      />
      <span className="absolute inset-y-0 right-3 flex items-center text-gray-500 text-sm pointer-events-none">
        {suffix}
      </span>
    </div>
  );
}

// Toggle switch dùng trong form
function Switch({ checked, onChange, label }) {
  return (
    <label className="inline-flex items-center gap-3 cursor-pointer select-none">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="relative h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-indigo-600 transition-colors">
        <span className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transform transition-transform peer-checked:translate-x-5" />
      </span>
      <span className="text-sm text-gray-800">{label}</span>
    </label>
  );
}

/** Toggle on/off cho từng dòng bảng/thẻ (icon công tắc) */
function RowToggle({ checked, onToggle, title = "Bật/Tắt Active" }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onToggle}
      title={title}
      className={[
        "relative inline-flex items-center h-7 w-12 rounded-full transition-colors",
        checked ? "bg-emerald-500 hover:bg-emerald-600" : "bg-gray-300 hover:bg-gray-400",
        "focus:outline-none focus:ring-4 focus:ring-emerald-100",
      ].join(" ")}
    >
      <span
        className={[
          "absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-sm grid place-items-center",
          "transform transition-transform",
          checked ? "translate-x-5" : "translate-x-0",
        ].join(" ")}
      >
        {checked ? (
          <svg className="h-3.5 w-3.5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeWidth="3" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="h-3.5 w-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeWidth="3" d="M6 6l12 12M18 6L6 18" />
          </svg>
        )}
      </span>
      <span className="sr-only">{checked ? "Đang bật" : "Đang tắt"}</span>
    </button>
  );
}

export default function AdminCouponsPage() {
  const { items = [], loading, err, onCreate, onToggle, onDelete, helpers } = useCoupons();

  // ====== Form state + validate ======
  const [form, setForm] = useState({
    code: "",
    percent: 10,
    expiresAt: "",
    isActive: true,
    maxRedemptions: 0,
  });
  const [formErr, setFormErr] = useState("");

  const [q, setQ] = useState("");
  const dq = useDebounced(q, 300);
  const [onlyActive, setOnlyActive] = useState(false);
  const [hideExpired, setHideExpired] = useState(false);

  const [sort, setSort] = useState({ key: "createdAt", dir: "desc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ====== Validate form ======
  function validate(payload) {
    if (!payload.code) return "Vui lòng nhập CODE.";
    if (!/^[A-Z0-9-_.]{3,32}$/.test(payload.code)) {
      return "CODE chỉ gồm A–Z, số, '-', '_' hoặc '.', dài 3–32 ký tự.";
    }
    if (payload.percent < 0 || payload.percent > 100) return "Phần trăm phải trong khoảng 0–100.";
    if (payload.maxRedemptions < 0) return "Giới hạn lượt dùng không được âm.";
    if (payload.expiresAt) {
      const d = new Date(payload.expiresAt);
      if (!Number.isFinite(d.getTime())) return "Ngày hết hạn không hợp lệ.";
    }
    return "";
  }

  async function handleCreate(e) {
    e.preventDefault();
    const payload = {
      ...form,
      code: (form.code || "").trim().toUpperCase(),
      percent: Math.max(0, Math.min(100, Number(form.percent) || 0)),
      maxRedemptions: Number(form.maxRedemptions) || 0,
      expiresAt: form.expiresAt || undefined,
      isActive: !!form.isActive,
    };
    const v = validate(payload);
    if (v) {
      setFormErr(v);
      return;
    }
    setFormErr("");
    await onCreate(payload);
    setForm({ code: "", percent: 10, expiresAt: "", isActive: true, maxRedemptions: 0 });
  }

  // ====== Stats ======
  const stats = useMemo(() => {
    const total = items.length;
    let active = 0,
      expired = 0;
    for (const c of items) {
      if (isExpired(c)) expired++;
      else if (c.isActive) active++;
    }
    return { total, active, expired };
  }, [items]);

  // ====== Filter + Search ======
  const filtered = useMemo(() => {
    let list = items;
    if (onlyActive) list = helpers?.filterActive ? helpers.filterActive(list, true) : list.filter((x) => x.isActive);
    if (hideExpired) list = list.filter((x) => !isExpired(x));
    if (helpers?.searchByCode) list = helpers.searchByCode(list, dq);
    else if (dq) {
      const kw = dq.toLowerCase();
      list = list.filter((c) => String(c.code || "").toLowerCase().includes(kw));
    }
    return list;
  }, [items, onlyActive, hideExpired, dq, helpers]);

  // ====== Sort ======
  const sorted = useMemo(() => {
    const { key, dir } = sort;
    const mul = dir === "desc" ? -1 : 1;
    const list = [...filtered];
    list.sort((a, b) => {
      const av =
        key === "percent"
          ? Number(a.percent || 0)
          : key === "maxRedemptions"
          ? Number(a.maxRedemptions || 0)
          : key === "timesRedeemed"
          ? Number(a.timesRedeemed || 0)
          : key === "expiresAt"
          ? (a.expiresAt ? new Date(a.expiresAt).getTime() : 0)
          : key === "isActive"
          ? Number(a.isActive)
          : String(a.code || "");
      const bv =
        key === "percent"
          ? Number(b.percent || 0)
          : key === "maxRedemptions"
          ? Number(b.maxRedemptions || 0)
          : key === "timesRedeemed"
          ? Number(b.timesRedeemed || 0)
          : key === "expiresAt"
          ? (b.expiresAt ? new Date(b.expiresAt).getTime() : 0)
          : key === "isActive"
          ? Number(b.isActive)
          : String(b.code || "");
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * mul;
      return String(av).localeCompare(String(bv)) * mul;
    });
    return list;
  }, [filtered, sort]);

  // ====== Pagination ======
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const curPage = Math.min(page, totalPages);
  const pageData = useMemo(() => {
    const start = (curPage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, curPage, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [dq, onlyActive, hideExpired, pageSize]);

  function toggleSort(key) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  }

  function SortHeader({ label, colKey, align = "left" }) {
    const active = sort.key === colKey;
    const dir = active ? sort.dir : undefined;
    const alignClass = align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";
    return (
      <th scope="col" className={`px-3 py-3 select-none ${alignClass}`}>
        <button
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-gray-900 uppercase tracking-wider"
          onClick={() => toggleSort(colKey)}
          aria-label={`Sắp xếp theo ${label}`}
        >
          <span>{label}</span>
          <svg className={`h-4 w-4 ${active ? "opacity-100" : "opacity-40"}`} viewBox="0 0 20 20" fill="currentColor">
            {dir === "asc" ? <path d="M10 5l5 6H5l5-6z" /> : <path d="M10 15l-5-6h10l-5 6z" />}
          </svg>
        </button>
      </th>
    );
  }

  // ====== UI ======
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-indigo-50/30">
      <div className="w-full mx-auto p-3 sm:p-4 lg:p-6 xl:p-8 space-y-4 sm:space-y-6">
        {/* Header + stats */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Mã giảm giá</h1>
            <p className="text-sm text-gray-600">Tạo và quản lý coupon cho chương trình khuyến mãi.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="rounded-2xl border bg-white p-3 shadow-sm">
              <div className="text-xs text-gray-500">Tổng mã</div>
              <div className="text-lg font-semibold">{stats.total.toLocaleString("vi-VN")}</div>
            </div>
            <div className="rounded-2xl border bg-white p-3 shadow-sm">
              <div className="text-xs text-gray-500">Active</div>
              <div className="text-lg font-semibold text-emerald-700">{stats.active.toLocaleString("vi-VN")}</div>
            </div>
            <div className="rounded-2xl border bg-white p-3 shadow-sm">
              <div className="text-xs text-gray-500">Expired</div>
              <div className="text-lg font-semibold text-rose-700">{stats.expired.toLocaleString("vi-VN")}</div>
            </div>
          </div>
        </div>

        {/* ====================== FORM TẠO MÃ (UI mới) ====================== */}
        <form
          onSubmit={handleCreate}
          className="rounded-2xl border-2 border-gray-200 bg-white shadow-sm p-4 sm:p-5"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Tạo mã mới</h3>
              <p className="text-xs text-gray-500">CODE viết hoa, 3–32 ký tự. 0 lượt dùng = không giới hạn.</p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-700 shadow-sm"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Thêm mã
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4">
            {/* CODE */}
            <div className="md:col-span-5">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                CODE
              </label>
              <InputIconLeft
                placeholder="SUMMER25"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                required
                icon={
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeWidth="2" d="M7 7h10v10H7zM3 3h2v2H3zM19 3h2v2h-2zM3 19h2v2H3zM19 19h2v2h-2z" />
                  </svg>
                }
              />
              {formErr && !form.code && (
                <p className="mt-1 text-xs text-rose-600">Vui lòng nhập CODE.</p>
              )}
            </div>

            {/* Percent */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                Phần trăm
              </label>
              <InputSuffix
                type="number"
                min="0"
                max="100"
                value={form.percent}
                onChange={(e) => setForm((f) => ({ ...f, percent: e.target.value }))}
                suffix="%"
              />
            </div>

            {/* Hết hạn */}
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                Hết hạn
              </label>
              <InputIconLeft
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                icon={
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeWidth="2" d="M8 7V3m8 4V3M3 11h18M5 5h14a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" />
                  </svg>
                }
              />
            </div>

            {/* Max redemptions */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                Giới hạn (0 = ∞)
              </label>
              <InputIconLeft
                type="number"
                min="0"
                value={form.maxRedemptions}
                onChange={(e) => setForm((f) => ({ ...f, maxRedemptions: e.target.value }))}
                icon={
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeWidth="2" d="M12 6c-4.418 0-8 2.239-8 5s3.582 5 8 5 8-2.239 8-5-3.582-5-8-5z" />
                  </svg>
                }
              />
            </div>

            {/* Switch */}
            <div className="md:col-span-12 lg:col-span-12 flex items-center">
              <Switch
                checked={form.isActive}
                onChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
                label="Kích hoạt ngay"
              />
            </div>
          </div>

          {formErr && (
            <div className="mt-4 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
              {formErr}
            </div>
          )}
        </form>
        {/* ==================== /FORM ==================== */}

        {/* Bộ lọc */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
          <label className="text-sm flex-1 min-w-0">
            <span className="block text-gray-600 mb-1">Tìm theo CODE</span>
            <div className="relative">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Nhập CODE…"
                className="w-full rounded-xl border px-3 py-2 pl-10 text-sm bg-white"
                aria-label="Tìm kiếm mã giảm giá"
              />
              <span className="absolute inset-y-0 left-3 grid place-items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeWidth="2" d="M21 21l-4.35-4.35M10 18a8 8 0 110-16 8 8 0 010 16z" />
                </svg>
              </span>
            </div>
          </label>

          <label className="text-sm flex items-center gap-2">
            <input type="checkbox" checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} />
            <span>Chỉ hiển thị Active</span>
          </label>
          <label className="text-sm flex items-center gap-2">
            <input type="checkbox" checked={hideExpired} onChange={(e) => setHideExpired(e.target.checked)} />
            <span>Ẩn mã đã hết hạn</span>
          </label>

          <label className="text-sm">
            <span className="block text-gray-600 mb-1">Hiển thị</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="border rounded-lg px-3 py-2 text-sm bg-white"
            >
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n} dòng
                </option>
              ))}
            </select>
          </label>
        </div>

        {err && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            <strong className="font-medium">Lỗi:</strong> {err}
          </div>
        )}

        {/* ====== Bảng (desktop) ====== */}
        <div className="hidden md:block overflow-x-auto rounded-2xl border-2 border-gray-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <SortHeader label="Code" colKey="code" />
                <SortHeader label="%" colKey="percent" />
                <SortHeader label="Hết hạn" colKey="expiresAt" />
                <SortHeader label="Active" colKey="isActive" />
                <SortHeader label="Đã dùng" colKey="timesRedeemed" />
                <SortHeader label="Giới hạn" colKey="maxRedemptions" />
                <th className="px-3 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={`sk-${i}`}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={`skc-${i}-${j}`} className="px-3 py-3">
                        <div
                          className="h-4 bg-gray-200 rounded animate-pulse"
                          style={{ width: `${60 + Math.random() * 30}%` }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}

              {!loading &&
                pageData.map((c) => {
                  const expired = isExpired(c);
                  return (
                    <tr key={c._id} className="hover:bg-indigo-50/40">
                      <td className="px-3 py-3 font-mono font-medium text-gray-900">{c.code}</td>
                      <td className="px-3 py-3">{Number(c.percent || 0)}%</td>
                      <td className="px-3 py-3">
                        {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("vi-VN") : "—"}
                      </td>
                      <td className="px-3 py-3">
                        <StatusPill active={!!c.isActive} expired={expired} />
                      </td>
                      <td className="px-3 py-3">{c.timesRedeemed || 0}</td>
                      <td className="px-3 py-3">{c.maxRedemptions ? c.maxRedemptions : "∞"}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <RowToggle
                            checked={!!c.isActive}
                            onToggle={() => onToggle(c._id, c.isActive)}
                            title="Bật/Tắt Active"
                          />
                          <button
                            className="px-3 py-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700"
                            onClick={() => {
                              if (window.confirm("Xoá mã này?")) onDelete(c._id);
                            }}
                            title="Xoá"
                          >
                            Xoá
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

              {!loading && pageData.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-12 text-center text-gray-500">
                    Không có dữ liệu phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ====== Cards (mobile) ====== */}
        <div className="md:hidden grid gap-3">
          {loading &&
            Array.from({ length: 5 }).map((_, i) => (
              <div key={`m-sk-${i}`} className="rounded-2xl border-2 border-gray-200 bg-white p-4 shadow-sm">
                <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
                <div className="mt-3 space-y-2">
                  {Array.from({ length: 4 }).map((__, j) => (
                    <div key={`m-sk-r-${i}-${j}`} className="h-3 bg-gray-200 rounded animate-pulse" />
                  ))}
                </div>
              </div>
            ))}

          {!loading &&
            pageData.map((c) => {
              const expired = isExpired(c);
              return (
                <div
                  key={c._id}
                  className="rounded-2xl border-2 border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-mono font-semibold text-gray-900">{c.code}</div>
                      <div className="text-xs text-gray-500">
                        {c.expiresAt ? new Date(c.expiresAt).toLocaleString("vi-VN") : "Không đặt hạn"}
                      </div>
                    </div>
                    <StatusPill active={!!c.isActive} expired={expired} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                    <div className="text-gray-500">Phần trăm</div>
                    <div className="text-gray-900 text-right">{Number(c.percent || 0)}%</div>
                    <div className="text-gray-500">Đã dùng</div>
                    <div className="text-gray-900 text-right">{c.timesRedeemed || 0}</div>
                    <div className="text-gray-500">Giới hạn</div>
                    <div className="text-gray-900 text-right">{c.maxRedemptions ? c.maxRedemptions : "∞"}</div>
                  </div>

                  <div className="mt-3 flex items-center justify-end gap-2">
                    <RowToggle
                      checked={!!c.isActive}
                      onToggle={() => onToggle(c._id, c.isActive)}
                      title="Bật/Tắt Active"
                    />
                    <button
                      className="px-3 py-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700"
                      onClick={() => {
                        if (window.confirm("Xoá mã này?")) onDelete(c._id);
                      }}
                    >
                      Xoá
                    </button>
                  </div>
                </div>
              );
            })}

          {!loading && pageData.length === 0 && (
            <div className="rounded-xl border bg-white p-6 text-center text-gray-500">Không có dữ liệu phù hợp.</div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="text-sm text-gray-600">
            Trang <span className="font-semibold text-gray-900">{curPage}</span> / {totalPages} —{" "}
            {sorted.length} mã (đang hiển thị {pageData.length})
          </div>
          <div className="flex items-center gap-2">
            <button
              className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-40"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={curPage <= 1}
            >
              Trước
            </button>
            <div className="min-w-[3ch] text-center text-sm">{curPage}</div>
            <button
              className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-40"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={curPage >= totalPages}
            >
              Sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
