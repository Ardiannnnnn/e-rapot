import Link from "next/link";

interface PlaceholderPageProps {
  title: string;
  badge: string;
  description: string;
  backHref: string;
}

export default function PlaceholderPage({
  title,
  badge,
  description,
  backHref,
}: PlaceholderPageProps) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-8 sm:p-12 text-center shadow-xs">
      <div className="inline-block px-3 py-1 rounded-full bg-[#e9f0ec] text-[#1b4332] text-xs font-semibold font-mono border border-[#c2d7ca] mb-4">
        {badge}
      </div>
      <h1 className="text-2xl font-bold text-zinc-900 font-poppins">{title}</h1>
      <p className="mt-2 text-sm text-zinc-600 max-w-md mx-auto">{description}</p>

      <div className="mt-8 flex items-center justify-center gap-3">
        <Link
          href={backHref}
          className="text-xs font-semibold px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-zinc-700 transition"
        >
          &larr; Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
