"use client";

import React, { useState, useEffect, useMemo } from "react";
import { EquipmentItem, LoanRequestDetail, BlockoutDetail } from "@/types";
import { BlockoutModal } from "@/components/BlockoutModal";
import { LoanDetailModal } from "@/components/LoanDetailModal";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Lock,
  Plus,
  Info,
  Layers,
} from "lucide-react";

export default function AdminCalendarioPage() {
  const [equipments, setEquipments] = useState<EquipmentItem[]>([]);
  const [loans, setLoans] = useState<LoanRequestDetail[]>([]);
  const [blockouts, setBlockouts] = useState<BlockoutDetail[]>([]);
  const [loading, setLoading] = useState(true);

  // Fecha base para la visualización del calendario (por defecto hoy)
  const [baseDate, setBaseDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const daysToShow = 14; // Mostramos 14 días en la cuadrícula Gantt

  // Modales
  const [isBlockoutModalOpen, setIsBlockoutModalOpen] = useState(false);
  const [preselectedEqId, setPreselectedEqId] = useState<string | undefined>(undefined);
  const [selectedLoan, setSelectedLoan] = useState<LoanRequestDetail | null>(null);

  const fetchData = () => {
    Promise.all([
      fetch("/api/equipments").then((r) => r.json()),
      fetch("/api/loans").then((r) => r.json()),
      fetch("/api/blockouts").then((r) => r.json()),
    ])
      .then(([eqData, loansData, blkData]) => {
        if (eqData.equipments) setEquipments(eqData.equipments);
        if (loansData.loans) setLoans(loansData.loans);
        if (blkData.blockouts) setBlockouts(blkData.blockouts);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Generar array de días
  const days = useMemo(() => {
    const list = [];
    for (let i = 0; i < daysToShow; i++) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + i);
      list.push(d);
    }
    return list;
  }, [baseDate]);

  const prevPeriod = () => {
    const d = new Date(baseDate);
    d.setDate(d.getDate() - 7);
    setBaseDate(d);
  };

  const nextPeriod = () => {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + 7);
    setBaseDate(d);
  };

  const todayPeriod = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    setBaseDate(d);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Calendario de Ocupación y Bloqueos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Vista horizontal tipo Gantt por equipo. Hacé clic en cualquier celda para crear un bloqueo inmediato.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1 text-xs">
            <button
              onClick={prevPeriod}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600"
              title="Semana anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={todayPeriod}
              className="px-3 py-1 font-semibold text-slate-800 hover:bg-slate-100 rounded-lg"
            >
              Hoy
            </button>
            <button
              onClick={nextPeriod}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600"
              title="Semana siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => {
              setPreselectedEqId(undefined);
              setIsBlockoutModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Bloquear Rango</span>
          </button>
        </div>
      </div>

      {/* Leyenda de colores */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <span className="font-bold text-slate-700">Referencias:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-indigo-500" />
          <span>Préstamo Activo / Aprobado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-purple-600" />
          <span>Bloqueo Secretaría / Mantenimiento</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-emerald-50 border border-emerald-200" />
          <span>Disponible (Clic para bloquear)</span>
        </div>
      </div>

      {/* Grilla Gantt */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm">Cargando cronograma audiovisual...</div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[900px] text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="py-3 px-4 w-64 font-bold uppercase text-[10px] tracking-wider bg-slate-50 sticky left-0 z-10 border-r border-slate-200 shadow-2xs">
                  Equipo Audiovisual
                </th>
                {days.map((day, idx) => {
                  const isToday =
                    day.toISOString().split("T")[0] === new Date().toISOString().split("T")[0];
                  return (
                    <th
                      key={idx}
                      className={`py-2 px-1 text-center font-bold border-r border-slate-200 last:border-0 ${
                        isToday ? "bg-indigo-50 text-indigo-700" : ""
                      }`}
                    >
                      <div className="text-[10px] uppercase font-semibold text-slate-400">
                        {day.toLocaleDateString("es-AR", { weekday: "narrow" })}
                      </div>
                      <div className="text-xs font-bold text-slate-800">{day.getDate()}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {equipments.map((eq) => (
                <tr key={eq.id} className="hover:bg-slate-50/50 transition">
                  {/* Celda fija con nombre y código */}
                  <td className="py-2.5 px-4 sticky left-0 z-10 bg-white border-r border-slate-200 shadow-2xs">
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1 py-0.2 rounded font-mono">
                      {eq.code}
                    </span>
                    <span className="font-semibold text-slate-900 block truncate max-w-[210px] text-xs mt-0.5">
                      {eq.name}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Stock: {eq.totalUnits} un. • {eq.categoryName}
                    </span>
                  </td>

                  {/* Celdas de días */}
                  {days.map((day, dIdx) => {
                    const dayMidnight = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();

                    // Comprobar préstamos activos en este día
                    const loanMatch = loans.find((l) => {
                      if (!["APPROVED", "IN_LOAN", "OVERDUE"].includes(l.status)) return false;
                      const hasEq = l.items.some((i) => i.equipmentId === eq.id);
                      if (!hasEq) return false;
                      const lStart = new Date(l.startDate).setHours(0, 0, 0, 0);
                      const lEnd = new Date(l.endDate).setHours(0, 0, 0, 0);
                      return dayMidnight >= lStart && dayMidnight <= lEnd;
                    });

                    // Comprobar bloqueos en este día
                    const blockoutMatch = blockouts.find((b) => {
                      const hasEq = b.items.some((i) => i.equipmentId === eq.id);
                      if (!hasEq) return false;
                      const bStart = new Date(b.startDate).setHours(0, 0, 0, 0);
                      const bEnd = new Date(b.endDate).setHours(0, 0, 0, 0);
                      return dayMidnight >= bStart && dayMidnight <= bEnd;
                    });

                    let cellBg = "bg-white hover:bg-indigo-50/40 cursor-pointer";
                    let content = null;

                    if (blockoutMatch) {
                      cellBg = "bg-purple-600 text-white font-bold cursor-pointer";
                      content = (
                        <div
                          className="w-full h-8 flex items-center justify-center text-[10px] font-bold px-1 rounded shadow-2xs truncate"
                          title={`Bloqueo: ${blockoutMatch.title} (${blockoutMatch.reason})`}
                        >
                          <Lock className="w-3 h-3 shrink-0 mr-0.5" />
                          <span className="truncate hidden sm:inline">{blockoutMatch.title}</span>
                        </div>
                      );
                    } else if (loanMatch) {
                      cellBg = "bg-indigo-500 text-white font-bold cursor-pointer";
                      content = (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLoan(loanMatch);
                          }}
                          className="w-full h-8 flex items-center justify-center text-[10px] font-bold px-1 rounded shadow-2xs truncate hover:bg-indigo-600"
                          title={`Préstamo: ${loanMatch.code} - ${loanMatch.userName} (${loanMatch.projectName})`}
                        >
                          <span className="truncate">{loanMatch.code}</span>
                        </div>
                      );
                    }

                    return (
                      <td
                        key={dIdx}
                        onClick={() => {
                          if (!blockoutMatch && !loanMatch) {
                            setPreselectedEqId(eq.id);
                            setIsBlockoutModalOpen(true);
                          }
                        }}
                        className={`p-1 border-r border-slate-100 last:border-0 text-center transition ${cellBg}`}
                      >
                        {content}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <BlockoutModal
        isOpen={isBlockoutModalOpen}
        onClose={() => setIsBlockoutModalOpen(false)}
        equipments={equipments}
        preselectedEquipmentId={preselectedEqId}
        onSuccess={() => fetchData()}
      />

      {selectedLoan && (
        <LoanDetailModal
          isOpen={!!selectedLoan}
          onClose={() => setSelectedLoan(null)}
          loan={selectedLoan}
          equipments={equipments}
          onOpenChecklist={() => {}}
          onRefresh={() => {
            fetchData();
            setSelectedLoan(null);
          }}
        />
      )}
    </div>
  );
}
