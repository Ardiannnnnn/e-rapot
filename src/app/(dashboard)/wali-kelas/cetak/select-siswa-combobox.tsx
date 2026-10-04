"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { SearchIcon, XIcon, CheckIcon } from "@/components/shared/icons";

interface SiswaOption {
  id: string;
  nama: string;
  nisn: string;
}

interface SelectSiswaComboboxProps {
  siswaList: SiswaOption[];
  selectedId: string;
  onChange: (id: string) => void;
}

function ChevronDownIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export function SelectSiswaCombobox({
  siswaList,
  selectedId,
  onChange,
}: SelectSiswaComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setSearch("");
    }
  }, [isOpen]);

  // Keyboard navigation: Escape to close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const selectedSiswa = useMemo(() => {
    if (selectedId === "ALL") return null;
    const idx = siswaList.findIndex((s) => s.id === selectedId);
    if (idx === -1) return null;
    return {
      siswa: siswaList[idx],
      no: idx + 1,
    };
  }, [selectedId, siswaList]);

  const filteredSiswa = useMemo(() => {
    if (!search.trim()) {
      return siswaList.map((s, idx) => ({ ...s, no: idx + 1 }));
    }
    const q = search.toLowerCase().trim();
    return siswaList
      .map((s, idx) => ({ ...s, no: idx + 1 }))
      .filter(
        (s) =>
          s.nama.toLowerCase().includes(q) ||
          (s.nisn && s.nisn.toLowerCase().includes(q)) ||
          String(s.no) === q
      );
  }, [siswaList, search]);

  const handleSelect = (id: string) => {
    onChange(id);
    setIsOpen(false);
  };

  const isAllSelected = selectedId === "ALL";
  const matchesAll =
    !search.trim() ||
    "semua".includes(search.toLowerCase().trim()) ||
    "bulk".includes(search.toLowerCase().trim()) ||
    "cetak semua".includes(search.toLowerCase().trim());

  return (
    <div ref={containerRef} className="relative w-full sm:w-auto">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center justify-between gap-3 px-3.5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border transition-all shadow-2xs w-full sm:min-w-[340px] text-left cursor-pointer ${
          isOpen
            ? "border-emerald-600 bg-white ring-2 ring-emerald-600/20"
            : "border-stone-300 bg-stone-50 hover:bg-white hover:border-stone-400 text-zinc-900"
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          {isAllSelected ? (
            <>
              <span className="text-base leading-none">📄</span>
              <span className="truncate text-zinc-800">
                Cetak Semua Siswa Sekelas ({siswaList.length} Siswa - Bulk Print)
              </span>
            </>
          ) : selectedSiswa ? (
            <>
              <span className="inline-flex items-center justify-center h-5 w-5 rounded-md bg-emerald-100 text-emerald-800 font-mono text-xs font-bold shrink-0">
                {selectedSiswa.no}
              </span>
              <span className="truncate font-bold text-zinc-900">
                {selectedSiswa.siswa.nama}
              </span>
              <span className="text-xs font-mono text-zinc-500 shrink-0">
                ({selectedSiswa.siswa.nisn || "-"})
              </span>
            </>
          ) : (
            <span className="text-zinc-500">Pilih Siswa...</span>
          )}
        </div>

        <ChevronDownIcon
          className={`h-4 w-4 text-zinc-500 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-emerald-700" : ""
          }`}
        />
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-full sm:w-[420px] rounded-2xl border border-stone-200 bg-white shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Search Box Header */}
          <div className="p-2.5 border-b border-stone-100 bg-stone-50/70">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama, NISN, atau no absen..."
                className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-stone-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent font-medium"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-0.5 rounded-md"
                >
                  <XIcon className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-72 overflow-y-auto py-1 divide-y divide-stone-50">
            {/* Option Cetak Semua (Bulk) */}
            {matchesAll && (
              <div className="p-1">
                <button
                  type="button"
                  onClick={() => handleSelect("ALL")}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition cursor-pointer ${
                    isAllSelected
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "hover:bg-emerald-50 text-zinc-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">📄</span>
                    <div>
                      <p className="leading-tight">
                        Cetak Semua Siswa Sekelas (Bulk Print)
                      </p>
                      <p
                        className={`text-[10px] mt-0.5 ${
                          isAllSelected ? "text-emerald-100" : "text-zinc-500"
                        }`}
                      >
                        Total {siswaList.length} peserta didik
                      </p>
                    </div>
                  </div>
                  {isAllSelected && <CheckIcon className="h-4 w-4 text-white" />}
                </button>
              </div>
            )}

            {/* Section Header */}
            <div className="px-3.5 py-1.5 bg-stone-50/50 flex items-center justify-between text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              <span>Pilih Individu Siswa</span>
              <span>{filteredSiswa.length} Siswa</span>
            </div>

            {/* List Siswa */}
            <div className="p-1 space-y-0.5">
              {filteredSiswa.length === 0 ? (
                <div className="py-6 px-4 text-center text-xs text-zinc-400 italic">
                  Tidak ada siswa yang cocok dengan &quot;{search}&quot;.
                </div>
              ) : (
                filteredSiswa.map((s) => {
                  const isSelected = selectedId === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSelect(s.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition cursor-pointer ${
                        isSelected
                          ? "bg-emerald-600 text-white font-semibold shadow-xs"
                          : "hover:bg-emerald-50/80 text-zinc-800"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span
                          className={`inline-flex items-center justify-center h-5 w-5 rounded-md font-mono text-[11px] font-bold shrink-0 ${
                            isSelected
                              ? "bg-white/20 text-white"
                              : "bg-stone-100 text-zinc-600"
                          }`}
                        >
                          {s.no}
                        </span>
                        <div className="truncate">
                          <p
                            className={`truncate ${
                              isSelected ? "font-bold text-white" : "font-medium text-zinc-900"
                            }`}
                          >
                            {s.nama}
                          </p>
                          <p
                            className={`text-[10px] font-mono ${
                              isSelected ? "text-emerald-100" : "text-zinc-400"
                            }`}
                          >
                            NISN: {s.nisn || "-"}
                          </p>
                        </div>
                      </div>

                      {isSelected && (
                        <CheckIcon className="h-4 w-4 text-white shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Footer Info */}
          <div className="px-3.5 py-2 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-[11px] text-zinc-400">
            <span>Gunakan pencarian untuk mempercepat</span>
            <span className="font-mono">ESC untuk tutup</span>
          </div>
        </div>
      )}
    </div>
  );
}
