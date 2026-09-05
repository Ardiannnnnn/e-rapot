"use client";

import { useState } from "react";
import ButtonHijau, { ButtonAmber } from "./button";
import LoginModal from "./login";

export default function HeroActions() {
    const [isLoginOpen, setIsLoginOpen] = useState(false);

    return (
        <>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <ButtonHijau
                    title="Buka Portal Rapor"
                    onClick={() => setIsLoginOpen(true)}
                    classname="px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors text-center shadow-xs cursor-pointer"
                />
                <ButtonAmber
                    title="Cek Nilai Siswa"
                    href="/cari"
                    classname="px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors text-center"
                />
            </div>

            <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
        </>
    );
}
