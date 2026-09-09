"use client";

import { useState } from "react";
import { SaveIcon, Trash2Icon } from "@/components/shared/icons";
import { TemplateItem } from "@/types/wali-kelas/master-deskripsi";

interface TemplateItemCardProps {
  item: TemplateItem;
  index: number;
  isEkskul?: boolean;
  isSubmitting: boolean;
  onUpdate: (id: string, teks: string, judul?: string) => Promise<boolean>;
  onDelete: (item: TemplateItem) => void;
}

export function TemplateItemCard({
  item,
  index,
  isEkskul = false,
  isSubmitting,
  onUpdate,
  onDelete,
}: TemplateItemCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editJudul, setEditJudul] = useState(item.judul || "");
  const [editTeks, setEditTeks] = useState(item.teks);

  const handleStartEdit = () => {
    setEditJudul(item.judul || "");
    setEditTeks(item.teks);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditJudul(item.judul || "");
    setEditTeks(item.teks);
  };

  const handleSave = async () => {
    if (!editTeks.trim()) return;
    const success = await onUpdate(
      item.id,
      editTeks.trim(),
      isEkskul ? editTeks.trim() : editJudul.trim() || undefined
    );
    if (success) {
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    onDelete(item);
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl border border-stone-200 bg-white shadow-xs hover:border-emerald-300 transition-all space-y-3">
      {isEditing ? (
        /* Mode Edit Inline */
        <div className="space-y-3">
          {isEkskul ? (
            <div className="space-y-1">
              <span className="text-xs font-bold text-zinc-700">Nama Ekstrakurikuler:</span>
              <input
                type="text"
                value={editTeks}
                onChange={(e) => {
                  setEditTeks(e.target.value);
                  setEditJudul(e.target.value);
                }}
                className="w-full p-2.5 border border-stone-300 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-700">Label / Judul:</span>
                <input
                  type="text"
                  value={editJudul}
                  onChange={(e) => setEditJudul(e.target.value)}
                  className="flex-1 p-2 border border-stone-300 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-zinc-700">Isi Deskripsi / Teks:</span>
                <textarea
                  rows={3}
                  value={editTeks}
                  onChange={(e) => setEditTeks(e.target.value)}
                  className="w-full p-2.5 border border-stone-300 rounded-lg text-xs leading-relaxed focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-3 py-1.5 rounded-lg border border-stone-300 text-zinc-600 text-xs font-medium hover:bg-stone-50 transition"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={isSubmitting || !editTeks.trim()}
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1b4332] text-white text-xs font-semibold hover:bg-[#143225] disabled:opacity-50 transition"
            >
              <SaveIcon className="h-3.5 w-3.5" />
              Simpan Perubahan
            </button>
          </div>
        </div>
      ) : (
        /* Mode Tampil Normal */
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            {isEkskul ? (
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold text-xs">
                  {index + 1}
                </span>
                <h3 className="font-bold text-zinc-900 text-sm">
                  {item.teks}
                </h3>
                <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200">
                  Ekstrakurikuler
                </span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold text-xs">
                    {index + 1}
                  </span>
                  <h3 className="font-bold text-zinc-900 text-xs sm:text-sm">
                    {item.judul || `Pilihan ${index + 1}`}
                  </h3>
                </div>
                <p className="text-xs text-zinc-700 leading-relaxed pl-8 font-sans">
                  {item.teks}
                </p>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-start pl-8 sm:pl-0">
            <button
              type="button"
              onClick={handleStartEdit}
              className="px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-zinc-700 text-xs font-medium transition"
            >
              Ubah
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleDelete}
              className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition disabled:opacity-50"
              title="Hapus"
            >
              <Trash2Icon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
