"use client";

export interface TablePaginationInfoProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageSizeChange: (size: number) => void;
  onPageChange?: (page: number) => void;
  label?: string;
  pageSizeOptions?: number[];
}

export function TablePaginationInfo({
  currentPage,
  pageSize,
  totalItems,
  onPageSizeChange,
  onPageChange,
  label = "data",
  pageSizeOptions = [10, 20, 30, 50],
}: TablePaginationInfoProps) {
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="inline-flex flex-wrap items-center gap-2.5 px-3 py-1.5 bg-white rounded-xl border border-stone-200 text-xs text-zinc-600 shadow-2xs">
      <span className="text-zinc-500 font-medium">Tampilkan:</span>
      <select
        value={pageSize}
        onChange={(e) => {
          onPageSizeChange(Number(e.target.value));
          if (onPageChange) onPageChange(1);
        }}
        className="rounded-lg border border-stone-200 bg-stone-50 px-2 py-1 text-xs font-semibold text-zinc-800 focus:outline-none focus:ring-1 focus:ring-emerald-600 cursor-pointer"
      >
        {pageSizeOptions.map((opt) => (
          <option key={opt} value={opt}>
            {opt} data
          </option>
        ))}
      </select>
      <span className="text-zinc-300">|</span>
      <span>
        Menampilkan{" "}
        <strong className="font-mono text-zinc-900">
          {start} - {end}
        </strong>{" "}
        dari{" "}
        <strong className="font-mono text-zinc-900">{totalItems}</strong>{" "}
        {label}
      </span>
    </div>
  );
}

export interface TablePaginationNavProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export function TablePaginationNav({
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
}: TablePaginationNavProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalItems === 0) return null;

  // Generate page numbers with smart ellipsis
  const pages: (number | string)[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    const pStart = Math.max(2, currentPage - 1);
    const pEnd = Math.min(totalPages - 1, currentPage + 1);
    for (let i = pStart; i <= pEnd; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-center gap-1.5 pt-2 pb-1">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage <= 1}
        className="px-3 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition text-zinc-700 text-xs shadow-2xs"
      >
        ← Sebelumnya
      </button>

      {pages.map((p, i) =>
        typeof p === "string" ? (
          <span key={i} className="px-2 text-zinc-400 font-mono text-xs">
            ...
          </span>
        ) : (
          <button
            key={i}
            type="button"
            onClick={() => onPageChange(p)}
            className={`h-8 w-8 rounded-xl text-xs font-mono font-bold transition flex items-center justify-center ${
              currentPage === p
                ? "bg-emerald-700 text-white shadow-xs"
                : "border border-stone-200 bg-white hover:bg-stone-50 text-zinc-700 shadow-2xs"
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage >= totalPages}
        className="px-3 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition text-zinc-700 text-xs shadow-2xs"
      >
        Selanjutnya →
      </button>
    </div>
  );
}

export interface TablePaginationProps extends TablePaginationInfoProps {
  onPageChange: (page: number) => void;
}

// Full combined pagination for standard use
export function TablePagination({
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  label = "data",
  pageSizeOptions = [10, 20, 30, 50],
}: TablePaginationProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white rounded-2xl border border-stone-200 text-xs text-zinc-600 shadow-xs">
      <TablePaginationInfo
        currentPage={currentPage}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageSizeChange={onPageSizeChange}
        onPageChange={onPageChange}
        label={label}
        pageSizeOptions={pageSizeOptions}
      />
      <TablePaginationNav
        currentPage={currentPage}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={onPageChange}
      />
    </div>
  );
}
