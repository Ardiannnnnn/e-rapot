export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* 1. Skeleton Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-stone-200 via-stone-100 to-stone-200 p-6 sm:p-8 border border-stone-200/80 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-5 w-32 rounded-full bg-stone-300" />
          <div className="h-5 w-24 rounded-full bg-stone-300" />
        </div>
        <div className="h-7 w-72 sm:w-96 rounded-xl bg-stone-300" />
        <div className="h-4 w-full max-w-xl rounded-lg bg-stone-300/80" />
      </div>

      {/* 2. Skeleton Filter & Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-40 rounded-xl bg-stone-200" />
          <div className="h-9 w-28 rounded-xl bg-stone-100" />
          <div className="h-9 w-28 rounded-xl bg-stone-100 hidden md:block" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-32 rounded-xl bg-stone-100" />
          <div className="h-9 w-36 rounded-xl bg-emerald-900/20" />
        </div>
      </div>

      {/* 3. Skeleton Search & Pagination Info Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1">
        <div className="h-9 w-full sm:w-72 rounded-xl bg-stone-200" />
        <div className="h-8 w-56 rounded-xl bg-stone-200" />
      </div>

      {/* 4. Skeleton Table Card */}
      <div className="rounded-2xl border border-stone-200 bg-white shadow-xs overflow-hidden">
        {/* Table Header */}
        <div className="border-b border-stone-200 bg-stone-50/80 px-6 py-4 flex items-center justify-between">
          <div className="h-4 w-12 rounded bg-stone-200" />
          <div className="h-4 w-48 rounded bg-stone-200" />
          <div className="h-4 w-20 rounded bg-stone-200 hidden sm:block" />
          <div className="h-4 w-28 rounded bg-stone-200" />
          <div className="h-4 w-24 rounded bg-stone-200" />
        </div>

        {/* Table Rows (6 Dummy Shimmer Rows) */}
        <div className="divide-y divide-stone-100">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="px-6 py-4 flex items-center justify-between gap-4">
              {/* No & Identitas */}
              <div className="flex items-center gap-4">
                <div className="h-4 w-6 rounded bg-stone-200" />
                <div className="space-y-1.5">
                  <div
                    className="h-4 rounded bg-stone-200"
                    style={{ width: `${140 + (i % 3) * 40}px` }}
                  />
                  <div className="h-3 w-28 rounded bg-stone-100" />
                </div>
              </div>

              {/* Status / Badge */}
              <div className="h-6 w-20 rounded-lg bg-stone-100 hidden sm:block" />

              {/* Skor / Kolom Tengah */}
              <div className="flex items-center gap-2">
                <div className="h-7 w-12 rounded-lg bg-stone-100" />
                <div className="h-7 w-12 rounded-lg bg-stone-100" />
                <div className="h-7 w-12 rounded-lg bg-stone-100 hidden md:block" />
              </div>

              {/* Aksi / Tombol */}
              <div className="h-8 w-24 rounded-xl bg-stone-200" />
            </div>
          ))}
        </div>

        {/* Table Footer */}
        <div className="p-4 bg-stone-50/60 border-t border-stone-200 flex items-center justify-between">
          <div className="h-4 w-44 rounded bg-stone-200" />
          <div className="h-8 w-36 rounded-xl bg-stone-200" />
        </div>
      </div>

      {/* 5. Skeleton Centered Pagination Nav */}
      <div className="flex items-center justify-center gap-2 pt-2">
        <div className="h-8 w-24 rounded-xl bg-stone-200" />
        <div className="h-8 w-8 rounded-xl bg-emerald-900/20" />
        <div className="h-8 w-8 rounded-xl bg-stone-200" />
        <div className="h-8 w-8 rounded-xl bg-stone-200" />
        <div className="h-8 w-24 rounded-xl bg-stone-200" />
      </div>
    </div>
  );
}
