"use client";

import React, { useState, useEffect, useMemo } from "react";
import { LoanRequestDetail, EquipmentItem, BlockoutDetail } from "@/types";
import { useAuth } from "@/lib/auth-context";
import { STATUS_CONFIG } from "@/lib/config";
import { ChecklistModal } from "@/components/ChecklistModal";
import { BlockoutModal } from "@/components/BlockoutModal";
import { LoanDetailModal } from "@/components/LoanDetailModal";
import {
  Clock,
  Truck,
  RotateCcw,
  AlertCircle,
  Wrench,
  Lock,
  Plus,
  Eye,
  CheckCircle,
  Download,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  Info,
} from "lucide-react";

export default function AdminDashboardPage() {
  const { currentUser } = useAuth();
  const [loans, setLoans] = useState<LoanRequestDetail[]>([]);
  const [equipments, setEquipments] = useState<EquipmentItem[]>([]);
  const [blockouts, setBlockouts] = useState<BlockoutDetail[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab seleccionada en el dashboard
  const [selectedMetric, setSelectedMetric] = useState<
    "PENDING" | "PICKUPS" | "RETURNS" | "OVERDUE" | "MAINTENANCE" | "BLOCKOUTS"
  >("PENDING");

  // Modales
  const [selectedLoanForDetail, setSelectedLoanForDetail] = useState<LoanRequestDetail | null>(null);
  const [checklistModal, setChecklistModal] = useState<{
    isOpen: boolean;
    loan: LoanRequestDetail | null;
    type: "PICKUP" | "RETURN";
  }>({ isOpen: false, loan: null, type: "PICKUP" });
  const [isBlockoutModalOpen, setIsBlockoutModalOpen] = useState(false);

  const fetchData = () => {
    Promise.all([
      fetch("/api/loans").then((r) => r.json()),
      fetch("/api/equipments").then((r) => r.json()),
      fetch("/api/blockouts").then((r) => r.json()),
    ])
      .then(([loansData, eqData, blkData]) => {
        if (loansData.loans) setLoans(loansData.loans);
        if (eqData.equipments) setEquipments(eqData.equipments);
        if (blkData.blockouts) setBlockouts(blkData.blockouts);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Métricas calculadas para hoy
  const todayStr = new Date().toISOString().split("T")[0];

  const pendingLoans = useMemo(() => loans.filter((l) => l.status === "PENDING"), [loans]);
  const overdueLoans = useMemo(() => loans.filter((l) => l.status === "OVERDUE"), [loans]);
  const pickupsToday = useMemo(
    () => loans.filter((l) => l.status === "APPROVED"),
    [loans]
  );
  const returnsToday = useMemo(
    () => loans.filter((l) => l.status === "IN_LOAN"),
    [loans]
  );
  const maintenanceEquipments = useMemo(
    () => equipments.filter((e) => e.status === "MAINTENANCE"),
    [equipments]
  );
  const activeBlockouts = useMemo(() => blockouts, [blockouts]);

  const metrics = [
    {
      id: "PENDING" as const,
      label: "Pendientes de aprobar",
      count: pendingLoans.length,
      icon: Clock,
      color: "border-amber-200 bg-amber-50/50 text-amber-800",
      activeColor: "ring-2 ring-amber-500 bg-amber-50",
      badgeColor: "bg-amber-100 text-amber-800",
      description: "Solicitudes a evaluar",
    },
    {
      id: "PICKUPS" as const,
      label: "Retiros de hoy",
      count: pickupsToday.length,
      icon: Truck,
      color: "border-blue-200 bg-blue-50/50 text-blue-800",
      activeColor: "ring-2 ring-blue-500 bg-blue-50",
      badgeColor: "bg-blue-100 text-blue-800",
      description: "Aprobados listos para entrega",
    },
    {
      id: "RETURNS" as const,
      label: "Devoluciones de hoy",
      count: returnsToday.length,
      icon: RotateCcw,
      color: "border-indigo-200 bg-indigo-50/50 text-indigo-800",
      activeColor: "ring-2 ring-indigo-500 bg-indigo-50",
      badgeColor: "bg-indigo-100 text-indigo-800",
      description: "Equipos en préstamo",
    },
    {
      id: "OVERDUE" as const,
      label: "Atrasados",
      count: overdueLoans.length,
      icon: AlertCircle,
      color: "border-red-200 bg-red-50/50 text-red-800",
      activeColor: "ring-2 ring-red-500 bg-red-50",
      badgeColor: "bg-red-100 text-red-800",
      description: "Reclamo y regularización",
    },
    {
      id: "MAINTENANCE" as const,
      label: "En mantenimiento",
      count: maintenanceEquipments.length,
      icon: Wrench,
      color: "border-orange-200 bg-orange-50/50 text-orange-800",
      activeColor: "ring-2 ring-orange-500 bg-orange-50",
      badgeColor: "bg-orange-100 text-orange-800",
      description: "Calibración o service",
    },
    {
      id: "BLOCKOUTS" as const,
      label: "Bloqueos vigentes",
      count: activeBlockouts.length,
      icon: Lock,
      color: "border-purple-200 bg-purple-50/50 text-purple-800",
      activeColor: "ring-2 ring-purple-500 bg-purple-50",
      badgeColor: "bg-purple-100 text-purple-800",
      description: "Reservas institucionales",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Cabecera del Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Panel de Hoy
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
              {new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Gestión operativa diaria de préstamos, entregas, reintegros y bloqueos de la UNLa.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsBlockoutModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-200 transition"
          >
            <Lock className="w-4 h-4" />
            <span>Bloquear Fechas</span>
          </button>
        </div>
      </div>

      {/* 6 TARJETAS MÉTRICAS ACCIONABLES */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          const isSelected = selectedMetric === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setSelectedMetric(m.id)}
              className={`text-left p-3.5 sm:p-4 rounded-2xl border transition flex flex-col justify-between space-y-3 cursor-pointer ${
                m.color
              } ${isSelected ? m.activeColor : "hover:shadow-xs"}`}
            >
              <div className="flex items-center justify-between">
                <Icon className="w-5 h-5 shrink-0 opacity-80" />
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${m.badgeColor}`}>
                  {m.count}
                </span>
              </div>
              <div>
                <span className="text-xs font-bold block leading-tight">{m.label}</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">{m.description}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* LISTA ACCIONABLE DE LA TARJETA SELECCIONADA */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            {selectedMetric === "PENDING" && <Clock className="w-4 h-4 text-amber-600" />}
            {selectedMetric === "PICKUPS" && <Truck className="w-4 h-4 text-blue-600" />}
            {selectedMetric === "RETURNS" && <RotateCcw className="w-4 h-4 text-indigo-600" />}
            {selectedMetric === "OVERDUE" && <AlertCircle className="w-4 h-4 text-red-600" />}
            {selectedMetric === "MAINTENANCE" && <Wrench className="w-4 h-4 text-orange-600" />}
            {selectedMetric === "BLOCKOUTS" && <Lock className="w-4 h-4 text-purple-600" />}
            <span>
              {selectedMetric === "PENDING" && "Solicitudes Pendientes de Aprobación"}
              {selectedMetric === "PICKUPS" && "Retiros y Entregas Programadas"}
              {selectedMetric === "RETURNS" && "Equipos en Préstamo para Devolución"}
              {selectedMetric === "OVERDUE" && "Pedidos con Fecha de Devolución Vencida"}
              {selectedMetric === "MAINTENANCE" && "Equipamiento en Mantenimiento Técnico"}
              {selectedMetric === "BLOCKOUTS" && "Bloqueos y Reservas Institucionales Vigentes"}
            </span>
          </h2>
        </div>

        {/* CONTENIDO SEGÚN LA TAB */}
        <div className="p-4 sm:p-6">
          {/* TAB 1: PENDIENTES */}
          {selectedMetric === "PENDING" && (
            pendingLoans.length === 0 ? (
              <p className="text-center py-8 text-xs text-slate-400">No hay pedidos pendientes de revisión en este momento.</p>
            ) : (
              <div className="space-y-3">
                {pendingLoans.map((loan) => (
                  <div
                    key={loan.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-indigo-600">{loan.code}</span>
                        <span className="font-semibold text-slate-900 text-sm">{loan.userName}</span>
                        <span className="text-xs text-slate-500">({loan.departmentName})</span>
                        {loan.hasBlockoutConflict && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            Choca con Bloqueo
                          </span>
                        )}
                        {loan.wasModifiedByApplicant && (
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300 flex items-center gap-1"
                            title={loan.lastModificationSummary || "Modificado por el solicitante"}
                          >
                            <Info className="w-3 h-3 text-sky-600" />
                            Modificado
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 font-medium">{loan.projectName}</p>
                      <p className="text-xs text-slate-500">
                        Fechas: {new Date(loan.startDate).toLocaleDateString("es-AR")} al {new Date(loan.endDate).toLocaleDateString("es-AR")} • {loan.items.length} equipos solicitados
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedLoanForDetail(loan)}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold"
                      >
                        Revisar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* TAB 2: RETIROS DE HOY */}
          {selectedMetric === "PICKUPS" && (
            pickupsToday.length === 0 ? (
              <p className="text-center py-8 text-xs text-slate-400">No hay retiros pendientes para hoy.</p>
            ) : (
              <div className="space-y-3">
                {pickupsToday.map((loan) => (
                  <div
                    key={loan.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-indigo-600">{loan.code}</span>
                        <span className="font-semibold text-slate-900 text-sm">Retira: {loan.pickupPersonName}</span>
                        <span className="text-xs text-slate-500">DNI: {loan.pickupPersonDni}</span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Horario pactado: <strong>{loan.pickupTime} hs</strong> • {loan.departmentName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {loan.items.map((i) => `${i.equipmentCode} (x${i.quantityApproved})`).join(", ")}
                      </p>
                    </div>

                    <button
                      onClick={() => setChecklistModal({ isOpen: true, loan, type: "PICKUP" })}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Registrar Entrega (Checklist)</span>
                    </button>
                  </div>
                ))}
              </div>
            )
          )}

          {/* TAB 3: DEVOLUCIONES DE HOY */}
          {selectedMetric === "RETURNS" && (
            returnsToday.length === 0 ? (
              <p className="text-center py-8 text-xs text-slate-400">No hay equipos en préstamo pendientes de devolución.</p>
            ) : (
              <div className="space-y-3">
                {returnsToday.map((loan) => (
                  <div
                    key={loan.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-indigo-600">{loan.code}</span>
                        <span className="font-semibold text-slate-900 text-sm">Devuelve: {loan.returnPersonName}</span>
                        <span className="text-xs text-slate-500">DNI: {loan.returnPersonDni}</span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Vence: {new Date(loan.endDate).toLocaleDateString("es-AR")} ({loan.returnTime} hs) • {loan.departmentName}
                      </p>
                    </div>

                    <button
                      onClick={() => setChecklistModal({ isOpen: true, loan, type: "RETURN" })}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Registrar Devolución (Checklist)</span>
                    </button>
                  </div>
                ))}
              </div>
            )
          )}

          {/* TAB 4: ATRASADOS */}
          {selectedMetric === "OVERDUE" && (
            overdueLoans.length === 0 ? (
              <p className="text-center py-8 text-xs text-slate-400">¡Excelente! No hay ningún préstamo atrasado.</p>
            ) : (
              <div className="space-y-3">
                {overdueLoans.map((loan) => (
                  <div
                    key={loan.id}
                    className="p-4 rounded-xl border border-red-200 bg-red-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-red-700">{loan.code}</span>
                        <span className="font-bold text-slate-900 text-sm">{loan.userName}</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-red-600 text-white animate-pulse">
                          Atrasado
                        </span>
                      </div>
                      <p className="text-xs text-slate-700">
                        Debía devolver el {new Date(loan.endDate).toLocaleDateString("es-AR")} a las {loan.returnTime} hs.
                      </p>
                      <p className="text-xs text-slate-500">
                        Tel: {loan.applicantPhone} • Email: {loan.userEmail}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setChecklistModal({ isOpen: true, loan, type: "RETURN" })}
                        className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
                      >
                        Recibir Devolución
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* TAB 5: EN MANTENIMIENTO */}
          {selectedMetric === "MAINTENANCE" && (
            maintenanceEquipments.length === 0 ? (
              <p className="text-center py-8 text-xs text-slate-400">No hay equipos en mantenimiento técnico actualmente.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {maintenanceEquipments.map((eq) => (
                  <div key={eq.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                      {eq.code}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm">{eq.name}</h4>
                    <p className="text-xs text-slate-500">{eq.notes || "En revisión técnica programada"}</p>
                    <span className="inline-block text-[10px] font-semibold text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                      Mantenimiento activo
                    </span>
                  </div>
                ))}
              </div>
            )
          )}

          {/* TAB 6: BLOQUEOS */}
          {selectedMetric === "BLOCKOUTS" && (
            activeBlockouts.length === 0 ? (
              <p className="text-center py-8 text-xs text-slate-400">No hay bloqueos activos cargados.</p>
            ) : (
              <div className="space-y-3">
                {activeBlockouts.map((blk) => (
                  <div
                    key={blk.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{blk.title}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                          {blk.reason}
                        </span>
                        {blk.isRecurring && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            Recurrente
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        Del {new Date(blk.startDate).toLocaleDateString("es-AR")} al {new Date(blk.endDate).toLocaleDateString("es-AR")}
                      </p>
                      <p className="text-xs text-slate-600">
                        Equipos afectados: {blk.items.map((i) => `${i.equipmentCode} (x${i.quantityBlocked})`).join(", ")}
                      </p>
                    </div>

                    <a
                      href="/admin/bloqueos"
                      className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold"
                    >
                      Gestionar
                    </a>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {/* Modales */}
      {selectedLoanForDetail && (
        <LoanDetailModal
          isOpen={!!selectedLoanForDetail}
          onClose={() => setSelectedLoanForDetail(null)}
          loan={selectedLoanForDetail}
          equipments={equipments}
          onOpenChecklist={(type) => {
            setChecklistModal({ isOpen: true, loan: selectedLoanForDetail, type });
          }}
          onRefresh={() => {
            fetchData();
            setSelectedLoanForDetail(null);
          }}
        />
      )}

      {checklistModal.isOpen && checklistModal.loan && (
        <ChecklistModal
          isOpen={checklistModal.isOpen}
          onClose={() => setChecklistModal({ isOpen: false, loan: null, type: "PICKUP" })}
          loan={checklistModal.loan}
          equipments={equipments}
          type={checklistModal.type}
          onSuccess={() => fetchData()}
        />
      )}

      <BlockoutModal
        isOpen={isBlockoutModalOpen}
        onClose={() => setIsBlockoutModalOpen(false)}
        equipments={equipments}
        onSuccess={() => fetchData()}
      />
    </div>
  );
}
