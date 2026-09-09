"use client";

import { MasterTabProps } from "@/types/wali-kelas/master-deskripsi";
import { TemplateItemCard } from "./template-item-card";

export function TabEkskul({
  items,
  isSubmitting,
  onUpdate,
  onDelete,
}: MasterTabProps) {
  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-stone-300 bg-white text-zinc-500 text-xs">
          Belum ada data ekstrakurikuler. Klik &quot;Tambah Ekstrakurikuler Baru&quot; di atas untuk menambahkan.
        </div>
      ) : (
        items.map((item, idx) => (
          <TemplateItemCard
            key={item.id}
            item={item}
            index={idx}
            isEkskul={true}
            isSubmitting={isSubmitting}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        ))
      )}
    </div>
  );
}
