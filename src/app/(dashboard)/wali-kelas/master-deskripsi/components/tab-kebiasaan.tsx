"use client";

import { MasterTabProps } from "@/types/wali-kelas/master-deskripsi";
import { TemplateItemCard } from "./template-item-card";

export function TabKebiasaan({
  items,
  isSubmitting,
  onUpdate,
  onDelete,
}: MasterTabProps) {
  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-stone-300 bg-white text-zinc-500 text-xs">
          Belum ada template kebiasaan. Klik &quot;Tambah Opsi Kebiasaan&quot; di atas untuk menambahkan.
        </div>
      ) : (
        items.map((item, idx) => (
          <TemplateItemCard
            key={item.id}
            item={item}
            index={idx}
            isSubmitting={isSubmitting}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        ))
      )}
    </div>
  );
}
