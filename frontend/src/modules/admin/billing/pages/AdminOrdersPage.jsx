
import { useEffect, useMemo, useState } from "react";
import useOrders from "../../billing/hooks/useOrders";

// =============================
// AdminOrdersPage — UI Pro + Ultra Responsive
// Tối ưu cho Mobile / Tablet / Desktop / Wide
// =============================

const STATUS_OPTIONS = [
  { value: "", label: "Tất cả", icon: "●" },
  { value: "pending", label: "Chờ thanh toán", icon: "⏳" },
  { value: "paid", label: "Đã thanh toán", icon: "✓" },
  { value: "cancelled", label: "Đã huỷ", icon: "✕" },
];

function useDebounced(value, delay = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

function currencyFromOrder(o) {
  const cur = o?.planSnapshot?.currency || "VND";
  if (cur === "đ" || cur === "vnd") return "VND";
  return cur;
}

function formatMoney(amount, currency = "VND") {
  try {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "VND" ? 0 : 2,
    }).format(Number(amount || 0));
  } catch {
    return (amount || 0).toLocaleString("vi-VN") + (currency ? ` ${currency}` : "");
  }
}

function StatusPill({ status }) {
  const config = {
    paid: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: "✓" },
    pending: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", icon: "⏳" },
    cancelled: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", icon: "✕" },
  };
  const style = config[status] || { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-200", icon: "●" };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${style.bg} ${style.text} ${style.border}`}>
      <span className="text-[10px]">{style.icon}</span>
      <span className="hidden sm:inline">{status || "unknown"}</span>
    </span>
  );
}

function StatCard({ icon, label, value, subtext, color = "blue" }) {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    emerald: "from-emerald-500 to-emerald-600",
    amber: "from-amber-500 to-amber-600",
    violet: "from-violet-500 to-violet-600",
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 truncate">{label}</p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">{value}</p>
            {subtext && <p className="text-xs text-gray-500 mt-1 truncate">{subtext}</p>}
          </div>
          <div className={`flex-shrink-0 ml-3 h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center text-white shadow-lg`}>
            {icon}
          </div>
        </div>
      </div>
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${colorClasses[color]} opacity-50`} />
    </div>
  );
}

export default function AdminOrdersPage() {
  const { items, loading, err, onMarkPaid, helpers } = useOrders();

  // ====== state ======
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const dq = useDebounced(q, 300);

  const [density, setDensity] = useState("cozy"); // "cozy" | "compact"
  const [sort, setSort] = useState({ key: "createdAt", dir: "desc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [viewMode, setViewMode] = useState("auto"); // "auto" | "table" | "card"

  // ====== stats ======
  const stats = useMemo(() => {
    const total = items?.length || 0;
    let paid = 0, pending = 0, cancelled = 0, totalRevenue = 0;
    for (const o of items || []) {
      if (o.status === "paid") paid++;
      if (o.status === "pending") pending++;
      if (o.status === "cancelled") cancelled++;
      totalRevenue += Number(o.total || 0);
    }
    return { total, paid, pending, cancelled, totalRevenue };
  }, [items]);

  // ====== filter + search ======
  const filtered = useMemo(() => {
    let list = helpers?.byStatus ? helpers.byStatus(items, status) : items || [];
    if (helpers?.search) list = helpers.search(list, dq);
    else if (dq) {
      const kw = dq.toLowerCase();
      list = (list || []).filter(
        (o) =>
          String(o._id).toLowerCase().includes(kw) ||
          String(o.userId || "").toLowerCase().includes(kw) ||
          String(o.planSnapshot?.name || o.planSnapshot?.code || "").toLowerCase().includes(kw)
      );
    }
    return list;
  }, [items, status, dq, helpers]);

  // ====== sort ======
  const sorted = useMemo(() => {
    const list = [...(filtered || [])];
    const { key, dir } = sort;
    const mul = dir === "desc" ? -1 : 1;
    list.sort((a, b) => {
      const av = key === "total"
        ? Number(a.total || 0)
        : key === "status"
        ? String(a.status || "")
        : key === "plan"
        ? String(a.planSnapshot?.name || a.planSnapshot?.code || "")
        : a[key] ?? a.createdAt ?? a._id;

      const bv = key === "total"
        ? Number(b.total || 0)
        : key === "status"
        ? String(b.status || "")
        : key === "plan"
        ? String(b.planSnapshot?.name || b.planSnapshot?.code || "")
        : b[key] ?? b.createdAt ?? b._id;

      if (av === undefined && bv === undefined) return 0;
      if (av === undefined) return 1;
      if (bv === undefined) return -1;

      if (typeof av === "number" && typeof bv === "number") return (av - bv) * mul;
      return String(av).localeCompare(String(bv)) * mul;
    });
    return list;
  }, [filtered, sort]);

  // ====== pagination ======
  const totalPages = Math.max(1, Math.ceil((sorted.length || 0) / pageSize));
  const curPage = Math.min(page, totalPages);
  const pageData = useMemo(() => {
    const start = (curPage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, curPage, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [status, dq, pageSize]);

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
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-gray-900 uppercase tracking-wider transition-colors"
          onClick={() => toggleSort(colKey)}
          aria-label={`Sắp xếp theo ${label}`}
        >
          <span>{label}</span>
          {active && (
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              {dir === "asc" ? <path d="M10 5l5 6H5l5-6z" /> : <path d="M10 15l-5-6h10l-5 6z" />}
            </svg>
          )}
        </button>
      </th>
    );
  }

  const densityRow = density === "compact" ? "py-2" : "py-3";

  // ====== UI ======
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-blue-50/30">
      <div className="w-full mx-auto p-3 sm:p-4 lg:p-6 xl:p-8 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
              Quản lý đơn hàng
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
              Theo dõi và xử lý thanh toán của khách hàng
            </p>
          </div>
          {loading && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-medium animate-pulse">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              <span>Đang tải...</span>
            </div>
          )}
        </div>

        {/* Error Alert */}
        {err && (
          <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-4 sm:p-5 flex items-start gap-3 shadow-sm">
            <svg className="h-6 w-6 text-red-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-red-900 text-sm sm:text-base">Có lỗi xảy ra</p>
              <p className="text-sm text-red-700 mt-1">{err}</p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            icon={<svg className="h-5 w-5 sm:h-6 sm:w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>}
            label="Tổng đơn"
            value={stats.total.toLocaleString("vi-VN")}
            color="blue"
          />
          <StatCard
            icon={<svg className="h-5 w-5 sm:h-6 sm:w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
            label="Đã thanh toán"
            value={stats.paid.toLocaleString("vi-VN")}
            subtext={`${((stats.paid / stats.total) * 100 || 0).toFixed(1)}%`}
            color="emerald"
          />
          <StatCard
            icon={<svg className="h-5 w-5 sm:h-6 sm:w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
            label="Chờ xử lý"
            value={stats.pending.toLocaleString("vi-VN")}
            subtext={stats.pending > 0 ? "Cần xử lý" : "Hoàn tất"}
            color="amber"
          />
          <StatCard
            icon={<svg className="h-5 w-5 sm:h-6 sm:w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
            label="Doanh thu"
            value={formatMoney(stats.totalRevenue, "VND")}
            color="violet"
          />
        </div>

        {/* Toolbar (sticky) */}
        <div className="sticky top-0 z-20 -mx-3 sm:mx-0 bg-white/95 backdrop-blur-lg border-y sm:border sm:rounded-2xl shadow-sm sm:shadow-md">
          <div className="p-3 sm:p-4 lg:p-5 space-y-3 sm:space-y-4">
            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {/* Search */}
              <div className="flex-1 min-w-0">
                <label className="block">
                  <span className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Tìm kiếm</span>
                  <div className="relative">
                    <input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Nhập mã đơn, người dùng, gói..."
                      className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 pl-11 text-sm bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                      aria-label="Tìm kiếm đơn hàng"
                    />
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                      <svg className="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeWidth="2" d="M21 21l-4.35-4.35M10 18a8 8 0 110-16 8 8 0 010 16z"/>
                      </svg>
                    </span>
                    {q && (
                      <button
                        onClick={() => setQ("")}
                        className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                      >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </button>
                    )}
                  </div>
                </label>
              </div>

              {/* Status */}
              <div className="w-full sm:w-48">
                <label className="block">
                  <span className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Trạng thái</span>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.icon} {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Density */}
                <div className="flex items-center gap-1 rounded-xl border-2 border-gray-200 bg-gray-50 p-1">
                  <button
                    onClick={() => setDensity("cozy")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      density === "cozy" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Rộng
                  </button>
                  <button
                    onClick={() => setDensity("compact")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      density === "compact" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Gọn
                  </button>
                </div>

                {/* View Mode (desktop) */}
                <div className="hidden lg:flex items-center gap-1 rounded-xl border-2 border-gray-200 bg-gray-50 p-1">
                  <button
                    onClick={() => setViewMode("table")}
                    className={`p-2 rounded-lg transition-all ${
                      viewMode === "table" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                    }`}
                    title="Xem dạng bảng"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode("card")}
                    className={`p-2 rounded-lg transition-all ${
                      viewMode === "card" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                    }`}
                    title="Xem dạng thẻ"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Page Size + count */}
              <div className="flex items-center gap-3">
                <label className="hidden sm:flex items-center gap-2 text-sm">
                  <span className="text-gray-600 font-medium">Hiển thị</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="border-2 border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-blue-500"
                  >
                    {[10, 20, 50, 100].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </label>
                <div className="text-xs sm:text-sm text-gray-600 font-medium">
                  <span className="hidden sm:inline">Tìm thấy </span>
                  <span className="text-blue-600 font-bold">{filtered.length}</span>
                  <span className="hidden sm:inline"> kết quả</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TABLE — Desktop/Laptop */}
        <div className={`${viewMode === "card" ? "hidden" : "hidden lg:block"} overflow-hidden rounded-2xl border-2 border-gray-200 bg-white shadow-lg`}>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <SortHeader label="Mã đơn" colKey="_id" />
                  <SortHeader label="Người dùng" colKey="userId" />
                  <SortHeader label="Gói" colKey="plan" />
                  <SortHeader label="SL" colKey="quantity" />
                  <SortHeader label="Tổng tiền" colKey="total" />
                  <SortHeader label="Trạng thái" colKey="status" />
                  <SortHeader label="Thời gian" colKey="createdAt" align="right" />
                  <th className="px-3 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading && Array.from({ length: 6 }).map((_, i) => (
                  <tr key={`sk-${i}`}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={`skc-${i}-${j}`} className={`px-3 ${densityRow}`}>
                        <div className="h-4 bg-gray-200 rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
                      </td>
                    ))}
                  </tr>
                ))}

                {!loading && pageData.map((o) => (
                  <tr key={o._id} className="hover:bg-blue-50/50 transition-colors duration-150">
                    <td className={`px-3 ${densityRow} font-mono text-xs text-gray-900 max-w-[150px] truncate`} title={o._id}>
                      {o._id}
                    </td>
                    <td className={`px-3 ${densityRow} text-gray-700`}>{o.userId || "—"}</td>
                    <td className={`px-3 ${densityRow} font-medium text-gray-900`}>
                      {o.planSnapshot?.name || o.planSnapshot?.code || "—"}
                    </td>
                    <td className={`px-3 ${densityRow} text-center text-gray-700`}>{o.quantity ?? 1}</td>
                    <td className={`px-3 ${densityRow} font-semibold text-gray-900`}>
                      {formatMoney(o.total, currencyFromOrder(o))}
                    </td>
                    <td className={`px-3 ${densityRow}`}>
                      <StatusPill status={o.status} />
                    </td>
                    <td className={`px-3 ${densityRow} text-right text-xs text-gray-500`}>
                      {o.createdAt ? new Date(o.createdAt).toLocaleDateString("vi-VN") : "—"}
                    </td>
                    <td className={`px-3 ${densityRow} text-right`}>
                      {o.status === "pending" ? (
                        <button
                          className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-medium hover:from-emerald-600 hover:to-emerald-700 shadow-sm hover:shadow-md transition-all duration-200"
                          onClick={() => {
                            if (window.confirm("Xác nhận đã nhận thanh toán?")) onMarkPaid(o._id);
                          }}
                        >
                          Xác nhận
                        </button>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}

                {!loading && pageData.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-3 py-16 text-center">
                      <svg className="h-16 w-16 text-gray-300 mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                      <p className="text-gray-500 font-medium text-lg">Không tìm thấy đơn hàng</p>
                      <p className="text-sm text-gray-400 mt-2">Thử thay đổi bộ lọc hoặc tìm kiếm khác</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* CARDS — Mobile/Tablet (hoặc khi chọn card) */}
        <div className={`${viewMode === "table" ? "hidden" : "lg:hidden"} grid gap-3 sm:gap-4`}>
          {loading && Array.from({ length: 5 }).map((_, i) => (
            <div key={`m-sk-${i}`} className="rounded-2xl border-2 border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
              <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse mb-3" />
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((__, j) => (
                  <div key={`m-sk-r-${i}-${j}`} className="h-3 bg-gray-200 rounded animate-pulse" />
                ))}
              </div>
            </div>
          ))}

          {!loading && pageData.map((o) => (
            <div key={o._id} className="rounded-2xl border-2 border-gray-200 bg-white p-4 sm:p-5 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all duration-300">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-xs sm:text-sm font-semibold text-gray-900 truncate mb-1" title={o._id}>
                    {o._id}
                  </div>
                  <div className="text-xs text-gray-500">
                    {o.createdAt ? new Date(o.createdAt).toLocaleString("vi-VN") : "—"}
                  </div>
                </div>
                <StatusPill status={o.status} />
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm mb-4">
                <div>
                  <div className="text-xs text-gray-500 mb-0.5">Người dùng</div>
                  <div className="text-gray-900 font-medium truncate">{o.userId || "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-0.5">Gói</div>
                  <div className="text-gray-900 font-medium truncate">
                    {o.planSnapshot?.name || o.planSnapshot?.code || "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-0.5">Số lượng</div>
                  <div className="text-gray-900 font-medium">{o.quantity ?? 1}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-0.5">Tổng tiền</div>
                  <div className="text-gray-900 font-bold">
                    {formatMoney(o.total, currencyFromOrder(o))}
                  </div>
                </div>
              </div>

              {o.status === "pending" && (
                <button
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-semibold hover:from-emerald-600 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                  onClick={() => {
                    if (window.confirm("Xác nhận đã nhận thanh toán?")) onMarkPaid(o._id);
                  }}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeWidth="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  Xác nhận thanh toán
                </button>
              )}
            </div>
          ))}

          {!loading && pageData.length === 0 && (
            <div className="rounded-2xl border-2 border-gray-200 bg-white p-8 sm:p-12 text-center shadow-sm">
              <svg className="h-16 w-16 sm:h-20 sm:w-20 text-gray-300 mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <p className="text-gray-500 font-medium text-base sm:text-lg">Không tìm thấy đơn hàng</p>
              <p className="text-sm text-gray-400 mt-2">Thử thay đổi bộ lọc hoặc tìm kiếm khác</p>
            </div>
          )}
        </div>

        {/* CARDS — Desktop khi chọn card */}
        <div className={`${viewMode === "card" ? "block" : "hidden"} hidden lg:grid lg:grid-cols-2 xl:grid-cols-3 gap-4`}>
          {loading && Array.from({ length: 6 }).map((_, i) => (
            <div key={`d-sk-${i}`} className="rounded-2xl border-2 border-gray-200 bg-white p-5 shadow-sm">
              <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse mb-3" />
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((__, j) => (
                  <div key={`d-sk-r-${i}-${j}`} className="h-3 bg-gray-200 rounded animate-pulse" />
                ))}
              </div>
            </div>
          ))}

          {!loading && pageData.map((o) => (
            <div key={o._id} className="rounded-2xl border-2 border-gray-200 bg-white p-5 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-sm font-semibold text-gray-900 truncate mb-1" title={o._id}>
                    {o._id}
                  </div>
                  <div className="text-xs text-gray-500">
                    {o.createdAt ? new Date(o.createdAt).toLocaleString("vi-VN") : "—"}
                  </div>
                </div>
                <StatusPill status={o.status} />
              </div>

              <div className="space-y-2.5 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Người dùng</span>
                  <span className="text-gray-900 font-medium truncate ml-2">{o.userId || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Gói</span>
                  <span className="text-gray-900 font-medium truncate ml-2">
                    {o.planSnapshot?.name || o.planSnapshot?.code || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Số lượng</span>
                  <span className="text-gray-900 font-medium">{o.quantity ?? 1}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                  <span className="text-gray-500 font-medium">Tổng tiền</span>
                  <span className="text-gray-900 font-bold text-base">
                    {formatMoney(o.total, currencyFromOrder(o))}
                  </span>
                </div>
              </div>

              {o.status === "pending" && (
                <button
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-semibold hover:from-emerald-600 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                  onClick={() => {
                    if (window.confirm("Xác nhận đã nhận thanh toán?")) onMarkPaid(o._id);
                  }}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeWidth="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  Xác nhận thanh toán
                </button>
              )}
            </div>
          ))}

          {!loading && pageData.length === 0 && (
            <div className="col-span-full rounded-2xl border-2 border-gray-200 bg-white p-12 text-center shadow-sm">
              <svg className="h-20 w-20 text-gray-300 mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <p className="text-gray-500 font-medium text-lg">Không tìm thấy đơn hàng</p>
              <p className="text-sm text-gray-400 mt-2">Thử thay đổi bộ lọc hoặc tìm kiếm khác</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
            Trang <span className="font-bold text-gray-900 text-base">{curPage}</span> / {totalPages}
            <span className="hidden sm:inline"> — </span>
            <span className="block sm:inline mt-1 sm:mt-0">
              Hiển thị <span className="font-semibold text-blue-600">{pageData.length}</span> / {sorted.length} đơn
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="px-4 py-2 rounded-xl border-2 border-gray-200 bg-white text-sm font-medium hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              onClick={() => setPage(1)}
              disabled={curPage <= 1}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/>
              </svg>
              <span className="hidden sm:inline">Đầu</span>
            </button>

            <button
              className="px-4 py-2 rounded-xl border-2 border-gray-200 bg-white text-sm font-medium hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={curPage <= 1}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="2" d="M15 19l-7-7 7-7"/>
              </svg>
              <span className="hidden sm:inline">Trước</span>
            </button>

            <div className="px-4 py-2 rounded-xl border-2 border-blue-500 bg-blue-50 text-sm font-bold text-blue-700 min-w-[60px] text-center">
              {curPage}
            </div>

            <button
              className="px-4 py-2 rounded-xl border-2 border-gray-200 bg-white text-sm font-medium hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={curPage >= totalPages}
            >
              <span className="hidden sm:inline">Sau</span>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="2" d="M9 5l7 7-7 7"/>
              </svg>
            </button>

            <button
              className="px-4 py-2 rounded-xl border-2 border-gray-200 bg-white text-sm font-medium hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              onClick={() => setPage(totalPages)}
              disabled={curPage >= totalPages}
            >
              <span className="hidden sm:inline">Cuối</span>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Quick jump (desktop) */}
        <div className="hidden lg:flex items-center justify-center gap-2 pt-2 pb-4">
          <span className="text-sm text-gray-600">Nhảy đến trang:</span>
          <input
            type="number"
            min="1"
            max={totalPages}
            value={curPage}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (val >= 1 && val <= totalPages) setPage(val);
            }}
            className="w-20 px-3 py-1.5 rounded-lg border-2 border-gray-200 text-sm text-center focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
          <span className="text-sm text-gray-400">/ {totalPages}</span>
        </div>
      </div>
    </div>
  );
}
