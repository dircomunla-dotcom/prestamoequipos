"use client";

import React, { useState } from "react";
import { LoanRequestDetail, EquipmentItem } from "@/types";
import { STATUS_CONFIG } from "@/lib/config";
import { LoanDetailModal } from "@/components/LoanDetailModal";
import { Search, Calendar, Download, AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";

export default function ConsultarCodigoPage() {
  const [code, setCode] = useState("");
  const [loan, setLoan] = useState<LoanRequestDetail | null>(null);
  const [equipments, setEquipments] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const res = await fetch(`/api/loans?code=${encodeURIComponent(code.trim().toUpperCase())}`);
      const data = await res.json();

      if (!res.ok || !data.loan) {
        setLoan(null);
        setError("No se encontró ninguna solicitud con el código ingresado. Verificá que el formato sea PRE-2026-XXXX.");
        return;
      }

      setLoan(data.loan);

      // Cargar lista de equipos para el modal
      const eqRes = await fetch("/api/equipments");
      const eqData = await eqRes.json();
      if (eqData.equipments) setEquipments(eqData.equipments);
    } catch {
      setError("Error de red al consultar el código");
    } finally {
      setLoading(false);
    }
  };

  const statusInfo = loan ? STATUS_CONFIG[loan.status] || STATUS_CONFIG.PENDING : null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Consultar Solicitud por Código
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Ingresá el código alfanumérico que recibiste al enviar tu pedido para conocer el estado y descargar tu acta.
        </p>
      </div>

      {/* Formulario de búsqueda */}
      <form onSubmit={handleSearch} className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex gap-2">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Ej: PRE-2026-0001"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-sm transition"
        >
          {loading ? "Buscando..." : "Consultar"}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* Resultado */}
      {loan && statusInfo && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5 animate-in fade-in">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Código de seguimiento
              </span>
              <span className="font-mono text-xl font-bold text-indigo-700">{loan.code}</span>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${statusInfo.badgeClass}`}
            >
              <span className={`w-2 h-2 rounded-full ${statusInfo.dotClass}`} />
              {statusInfo.label}
            </span>
          </div>

          <div className="space-y-3 text-xs sm:text-sm">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Solicitante:</span>
                <span className="font-bold text-slate-800">{loan.userName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Espacio institucional:</span>
                <span className="font-semibold text-slate-700">{loan.departmentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Fechas de uso:</span>
                <span className="font-semibold text-indigo-700">
                  {new Date(loan.startDate).toLocaleDateString("es-AR")} al{" "}
                  {new Date(loan.endDate).toLocaleDateString("es-AR")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Horarios:</span>
                <span className="text-slate-700">
                  Retiro: {loan.pickupTime} hs | Devolución: {loan.returnTime} hs
                </span>
              </div>
            </div>

            <div>
              <span className="font-bold text-slate-700 block mb-1">Proyecto declarado:</span>
              <p className="text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200/60">
                {loan.projectName} — {loan.projectDescription}
              </p>
            </div>

            <div>
              <span className="font-bold text-slate-700 block mb-1">
                Equipos incluidos ({loan.items.length}):
              </span>
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
                {loan.items.map((it) => (
                  <div key={it.id} className="p-2.5 flex justify-between text-xs bg-white">
                    <span>
                      <strong className="text-indigo-600">{it.equipmentCode}</strong> — {it.equipmentName}
                    </span>
                    <span className="font-bold">{it.quantityApproved} un.</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap gap-2 border-t border-slate-100">
            <a
              href={`/api/loans/${loan.id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold shadow-xs transition"
            >
              <Download className="w-4 h-4" />
              <span>Descargar Acta de Préstamo (PDF)</span>
            </a>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition"
            >
              Ver historial completo
            </button>
          </div>
        </div>
      )}

      {loan && isModalOpen && (
        <LoanDetailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          loan={loan}
          equipments={equipments}
          onOpenChecklist={() => {}}
          onRefresh={() => {}}
        />
      )}
    </div>
  );
}
