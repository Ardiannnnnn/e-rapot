"use client";

import { useTransition } from "react";
import { logoutAction } from "@/actions/auth";

export default function LogoutButton() {
  const [isPending, startLogout] = useTransition();

  return (
    <button
      disabled={isPending}
      onClick={() => startLogout(() => { logoutAction(); })}
      className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5"
    >
      {isPending && (
        <span className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
      )}
      {isPending ? "Keluar..." : "Keluar"}
    </button>
  );
}