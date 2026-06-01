"use client";

import { useState } from "react";
import { GarmentForm } from "./GarmentForm";

export function GarmentFormModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl bg-[#c84a10] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-[#c84a10]/20 hover:bg-[#a83a08] transition-all"
      >
        + Añadir prenda
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="w-full max-w-md rounded-2xl border-2 border-[#c4906a]/30 bg-[#fdf4e0] p-6 shadow-2xl">
            <GarmentForm onClose={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
