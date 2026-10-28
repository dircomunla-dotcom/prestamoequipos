"use client";

import React, { useState, useEffect } from "react";
import { LoanRequestDetail, EquipmentItem } from "@/types";
import { useAuth } from "@/lib/auth-context";
import { STATUS_CONFIG } from "@/lib/config";
import { LoanDetailModal } from "@/components/LoanDetailModal";
import { LoanEditModal } from "@/components/LoanEditModal";
import {
  ClipboardList,
  Calendar,
  Download,
  Eye,
  XCircle,
  Clock,
  ArrowRight,
  Sparkles,
  Edit,
  Info,
} from "@/components/icons";

export default function MisPedidosPage() {
  const { currentUser } = useAuth();
  const [loans, setLoans] = useState<LoanRequestDetail[]>([]);
  const [equipments, setEquipments] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState<LoanRequestDetail | null>(null);
  const [loanToEdit, setLoanToEdit] = useState<LoanRequestDetail | null>(null);

  const fetchLoans = () => {
    fetch(`/api/loans?userId=${currentUser.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.loans) setLoans(data.loans);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchLoans();
    fetch("/api/equipments")
      .then((res) => res.json())
      .then((data) => {
        if (data.equipments) setEquipments(data.equipments);
      })
      .catch(() => {});
  }, [currentUser.id]);

  const handleCancelLoan = async (loanId: string) => {
    if (!confirm("¿Estás seguro de que deseás cancelar esta solicitud de préstamo?")) return;
    try {
      const res = await fetch(`/api/loans/${loanId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CANCEL", comment: "Cancelado por el solicitante" }),
      });
      if (res.ok) fetchLoans();
    } catch {}
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Mis Solicitudes de Préstamo
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Seguimiento de pedidos activos, modificación de solicitudes y descarga de actas de la UNLa.
          </p>
        </div>

        <a
          href="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition"
        >
          <span>Nueva Solicitud</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">Cargando tus pedidos...</div>
      ) : loans.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <ClipboardList className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Aún no realizaste ningún pedido</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Explorá el catálogo de equipamiento audiovisual de la UNLa y solicitá lo que necesites para tu actividad.
          </p>
          <a
            href="/"
            className="inline-block mt-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold"
          >
            Ir al catálogo
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {loans.map((loan) => {
            const statusInfo = STATUS_CONFIG[loan.status] || STATUS_CONFIG.PENDING;
            const startFmt = new Date(loan.startDate).toLocaleDateString("es-AR");
            const endFmt = new Date(loan.endDate).toLocaleDateString("es-AR");
            const canEdit = loan.status === "PENDING" || loan.status === "APPROVED";

            return (
              <div
                key={loan.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-sm transition space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono font-bold text-sm sm:text-base text-indigo-700">
                      {loan.code}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${statusInfo.badgeClass}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotClass}`} />
                      {statusInfo.label}
                    </span>

                    {loan.wasModifiedByApplicant && (
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 flex items-center gap-1 cursor-help"
                        title={loan.lastModificationSummary || "Solicitud modificada"}
                      >
                        <Info className="w-3 h-3 text-sky-600" />
                        Modificado
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>
                      {startFmt} ({loan.pickupTime} hs) — {endFmt} ({loan.returnTime} hs)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="md:col-span-2 space-y-1">
                    <h4 className="font-bold text-slate-900 text-sm">{loan.projectName}</h4>
                    <p className="text-slate-600 line-clamp-2">{loan.projectDescription}</p>
                    <p className="text-slate-400 text-[11px] pt-1">
                      Destino: [{loan.usageLocationType === "INTERNAL" ? "Dentro de la UNLa" : "Fuera de la UNLa"}]{" "}
                      {loan.usageLocationDetails}
                    </p>
                    {loan.lastModificationSummary && (
                      <p className="text-[11px] text-sky-700 bg-sky-50/70 p-1.5 rounded-lg border border-sky-100 mt-1">
                        Último cambio: {loan.lastModificationSummary}
                      </p>
                    )}
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 space-y-1">
                    <span className="font-bold text-slate-700 text-[11px] block">
                      Equipos solicitados ({loan.items.length}):
                    </span>
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {loan.items.map((it) => (
                        <div key={it.id} className="flex justify-between text-[11px] text-slate-600">
                          <span className="truncate">{it.equipmentName || it.equipmentCode}</span>
                          <span className="font-semibold text-slate-800 ml-2">x{it.quantityApproved}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedLoan(loan)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver detalles y seguimiento</span>
                    </button>

                    {canEdit && (
                      <button
                        onClick={() => setLoanToEdit(loan)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition"
                        title="Modificar fechas, horarios o datos del proyecto"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Modificar pedido</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`/api/loans/${loan.id}/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Acta (PDF)
                    </a>

                    {loan.status === "PENDING" && (
                      <button
                        onClick={() => handleCancelLoan(loan.id)}
                        className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedLoan && (
        <LoanDetailModal
          isOpen={!!selectedLoan}
          onClose={() => setSelectedLoan(null)}
          loan={selectedLoan}
          equipments={equipments}
          onOpenChecklist={() => {}}
          onRefresh={() => {
            fetchLoans();
            setSelectedLoan(null);
          }}
        />
      )}

      {loanToEdit && (
        <LoanEditModal
          isOpen={!!loanToEdit}
          onClose={() => setLoanToEdit(null)}
          loan={loanToEdit}
          onSuccess={() => {
            setLoanToEdit(null);
            fetchLoans();
          }}
        />
      )}
    </div>
  );
}
