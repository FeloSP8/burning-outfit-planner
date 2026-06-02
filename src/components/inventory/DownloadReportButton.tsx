"use client";

import { useState } from "react";

export function DownloadReportButton() {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const res = await fetch("/api/inventory-pdf");
      if (!res.ok) throw new Error("Error generando el PDF");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `inventario-${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("No se pudo generar el informe. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="flex items-center gap-2 rounded-xl border-2 border-[#c4906a]/40 bg-[#fdf4e0] px-4 py-2.5 text-sm font-bold text-[#7a2e08] shadow-sm transition-all hover:border-[#c84a10]/60 hover:bg-[#f5e0b8] hover:shadow-md disabled:opacity-50"
      title="Descargar informe PDF"
    >
      {loading ? (
        <>
          <span className="animate-spin text-base">⏳</span>
          Generando…
        </>
      ) : (
        <>
          <span className="text-base">📄</span>
          Informe PDF
        </>
      )}
    </button>
  );
}
