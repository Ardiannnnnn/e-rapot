"use client";

import { logoutAction } from "@/actions/auth";

export default function LogoutButton() {
  return (
    <button
      onClick={() => logoutAction()}
      className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100"
    >
      Keluar
    </button>
  );
}