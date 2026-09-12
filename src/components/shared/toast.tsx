"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { CheckCircle2Icon, AlertCircleIcon, XIcon } from "@/components/shared/icons";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  title?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, title?: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Standalone global trigger so any action or function can invoke toast without passing props
let globalShowToast: ((message: string, type?: ToastType, title?: string, duration?: number) => void) | null = null;

export const toast = {
  success: (message: string, title = "Berhasil!") => globalShowToast?.(message, "success", title, 5000),
  error: (message: string, title = "Gagal!") => globalShowToast?.(message, "error", title, 5000),
  info: (message: string, title = "Informasi") => globalShowToast?.(message, "info", title, 5000),
  warning: (message: string, title = "Perhatian") => globalShowToast?.(message, "warning", title, 5000),
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "success", title?: string, duration = 5000) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newToast: ToastItem = { id, message, type, title, duration };
      setToasts((prev) => [...prev, newToast]);
    },
    []
  );

  useEffect(() => {
    globalShowToast = showToast;
    return () => {
      globalShowToast = null;
    };
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}

      {/* Floating Container di Pojok Kanan Bawah */}
      <aside 
        aria-label="Notifikasi sistem"
        className="fixed bottom-5 right-5 z-[9999] flex flex-col-reverse gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onClose={() => removeToast(t.id)} />
        ))}
      </aside>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Fallback to global if called outside provider
    return {
      showToast: (message: string, type?: ToastType, title?: string, duration?: number) => {
        globalShowToast?.(message, type, title, duration);
      },
      removeToast: () => {},
    };
  }
  return context;
}

function ToastCard({ toast: item, onClose }: { toast: ToastItem; onClose: () => void }) {
  const duration = item.duration ?? 5000;
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onClose();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [duration, onClose]);

  const typeConfig = {
    success: {
      bg: "bg-white/95 border-emerald-200/90 text-zinc-900",
      iconBg: "bg-emerald-100 text-emerald-700",
      barBg: "bg-emerald-600",
      titleColor: "text-emerald-900",
      Icon: CheckCircle2Icon,
      defaultTitle: "Berhasil!",
    },
    error: {
      bg: "bg-white/95 border-rose-200/90 text-zinc-900",
      iconBg: "bg-rose-100 text-rose-700",
      barBg: "bg-rose-600",
      titleColor: "text-rose-900",
      Icon: AlertCircleIcon,
      defaultTitle: "Terjadi Kesalahan",
    },
    warning: {
      bg: "bg-white/95 border-amber-200/90 text-zinc-900",
      iconBg: "bg-amber-100 text-amber-700",
      barBg: "bg-amber-500",
      titleColor: "text-amber-900",
      Icon: AlertCircleIcon,
      defaultTitle: "Perhatian",
    },
    info: {
      bg: "bg-white/95 border-blue-200/90 text-zinc-900",
      iconBg: "bg-blue-100 text-blue-700",
      barBg: "bg-blue-600",
      titleColor: "text-blue-900",
      Icon: AlertCircleIcon,
      defaultTitle: "Informasi",
    },
  }[item.type];

  const IconComponent = typeConfig.Icon;

  return (
    <div
      role="alert"
      className={`pointer-events-auto relative overflow-hidden rounded-2xl border shadow-xl backdrop-blur-md transition-all animate-in slide-in-from-bottom-4 fade-in duration-200 ${typeConfig.bg}`}
    >
      <div className="p-3.5 sm:p-4 flex items-start gap-3">
        <div className={`p-2 rounded-xl shrink-0 ${typeConfig.iconBg}`}>
          <IconComponent className="h-4 w-4" />
        </div>

        <div className="flex-1 min-w-0 pt-0.5">
          <h4 className={`text-xs font-bold font-poppins leading-none ${typeConfig.titleColor}`}>
            {item.title || typeConfig.defaultTitle}
          </h4>
          <p className="text-xs text-zinc-600 mt-1 leading-relaxed break-words font-sans">
            {item.message}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-stone-100 transition shrink-0 ml-1"
          aria-label="Tutup notifikasi"
        >
          <XIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Progress Bar 5 Detik */}
      <div className="w-full bg-stone-100 h-1 overflow-hidden">
        <div
          className={`h-full transition-[width] duration-75 ease-linear ${typeConfig.barBg}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
