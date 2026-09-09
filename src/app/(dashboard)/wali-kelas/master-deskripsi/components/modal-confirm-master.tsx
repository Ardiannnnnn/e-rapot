"use client";

import {
  AlertCircleIcon,
  RotateCcwIcon,
  PlusIcon,
  Trash2Icon,
  XIcon,
} from "@/components/shared/icons";

interface ModalConfirmMasterProps {
  isOpen: boolean;
  type: "ADD" | "DELETE" | "RESET";
  title: string;
  message: string;
  itemText?: string;
  isSubmitting?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export function ModalConfirmMaster({
  isOpen,
  type,
  title,
  message,
  itemText,
  isSubmitting = false,
  onConfirm,
  onClose,
}: ModalConfirmMasterProps) {
  if (!isOpen) return null;

  const isAdd = type === "ADD";
  const isDelete = type === "DELETE";
  const isReset = type === "RESET";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl ${
                isAdd
                  ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                  : isDelete
                  ? "bg-rose-50 text-rose-600 border border-rose-200"
                  : "bg-amber-50 text-amber-600 border border-amber-200"
              }`}
            >
              {isReset ? (
                <RotateCcwIcon className="h-5 w-5" />
              ) : (
                <AlertCircleIcon className="h-5 w-5" />
              )}
            </div>
            <h3 className="text-sm font-bold text-zinc-900 font-poppins">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 p-1"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="text-xs text-zinc-600 leading-relaxed space-y-2.5">
          <p>{message}</p>

          {itemText && (
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-zinc-800 font-medium line-clamp-3">
              &ldquo;{itemText}&rdquo;
            </div>
          )}

          <p className="text-[11px] text-zinc-400">
            {isDelete
              ? "Data ini akan langsung dihapus dari database."
              : isReset
              ? "Seluruh tema dan opsi kustom akan di-reset ke standar Kurikulum Merdeka."
              : "Perubahan ini akan langsung disimpan ke database."}
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl border border-stone-300 text-zinc-600 text-xs font-semibold hover:bg-stone-50 transition"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onConfirm}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition shadow-xs disabled:opacity-50 ${
              isAdd
                ? "bg-emerald-600 hover:bg-emerald-700"
                : isDelete
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-amber-600 hover:bg-amber-700"
            }`}
          >
            {isAdd ? (
              <>
                <PlusIcon className="h-3.5 w-3.5" />
                <span>{isSubmitting ? "Menyimpan..." : "Ya, Tambahkan"}</span>
              </>
            ) : isDelete ? (
              <>
                <Trash2Icon className="h-3.5 w-3.5" />
                <span>{isSubmitting ? "Menghapus..." : "Ya, Hapus"}</span>
              </>
            ) : (
              <>
                <RotateCcwIcon className="h-3.5 w-3.5" />
                <span>{isSubmitting ? "Mereset..." : "Ya, Reset Standar"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
