"use client";

import React, { useState } from "react";
import { LoanRequestDetail, EquipmentItem } from "@/types";
import { useAuth } from "@/lib/auth-context";
import { STATUS_CONFIG } from "@/lib/config";
import { LoanEditModal } from "@/components/LoanEditModal";
import {
  X,
  Calendar,
  Clock,
  User,
  MapPin,
  FileText,
  Download,
  CheckCircle,
  XCircle,
  Truck,
  RotateCcw,
  AlertTriangle,
  History,
  Shield,
  FileCheck2,
  Edit,
  Info,
} from "@/components/icons";

interface LoanDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: LoanRequestDetail;
  equipments: EquipmentItem[];
  onOpenChecklist: (type: "PICKUP" | "RETURN") => void;
  onRefresh: () => void;
}

export function LoanDetailModal({
  isOpen,
  onClose,
  loan,
  equipments,
  onOpenChecklist,
  onRefresh,
}: LoanDetailModalProps) {
  const { currentUser, isAdmin } = useAuth();
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionType, setActionType] = useState<"APPROVE" | "REJECT" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  if (!isOpen) return null;

  const statusInfo = STATUS_CONFIG[loan.status] || STATUS_CONFIG.PENDING;

  const handleStatusChange = async (action: "APPROVE" | "REJECT" | "CANCEL") => {
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/loans/${loan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          comment: comment || undefined,
          adminUser: isAdmin ? { id: currentUser.id, name: currentUser.name } : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Error al actualizar el estado de la solicitud");
        return;
      }

      setActionType(null);
      setComment("");
      onRefresh();
      onClose();
    } catch {
      setErrorMessage("Error de conexión al actualizar el pedido.");
    } finally {
      setSubmitting(false);
    }
  };

  const canEdit = loan.status === "PENDING" || loan.status === "APPROVED";

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
          {/* Cabecera */}
          <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-mono text-lg font-bold text-indigo-400">{loan.code}</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${statusInfo.badgeClass}`}
              >
                <span className={`w-2 h-2 rounded-full ${statusInfo.dotClass}`} />
                {statusInfo.label}
              </span>
              {loan.wasModifiedByApplicant && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30 flex items-center gap-1">
                  <Info className="w-3 h-3 text-sky-400" />
                  Modificado por Solicitante
                </span>
              )}
            </div>
            <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Alerta de modificación por el solicitante */}
          {loan.wasModifiedByApplicant && (
            <div className="bg-sky-50 border-b border-sky-200 px-6 py-3 flex items-start gap-3 text-xs text-sky-950">
              <div className="p-1 rounded-lg bg-sky-100 text-sky-700 shrink-0 mt-0.5">
                <Info className="w-4 h-4" />
              </div>
              <div className="space-y-0.5 flex-1">
                <div className="flex items-center justify-between">
                  <strong className="font-bold text-sky-950 text-xs">
                    Solicitud modificada por el solicitante:
                  </strong>
                  {loan.lastModifiedAt && (
                    <span className="text-[10px] text-sky-600 font-medium">
                      {new Date(loan.lastModifiedAt).toLocaleString("es-AR")}
                    </span>
                  )}
                </div>
                <p className="text-sky-800 text-[11px] leading-relaxed">
                  {loan.lastModificationSummary ||
                    "El solicitante actualizó datos del pedido. Las modificaciones se detallan en el historial."}
                </p>
              </div>
            </div>
          )}

          {/* Alerta de choque con bloqueo */}
          {loan.hasBlockoutConflict && loan.status === "PENDING" && (
            <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center gap-2.5 text-xs text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Alerta de superposición:</strong> Este pedido pendiente coincide en fechas con un bloqueo
                institucional de la Secretaría. Para aprobarlo, debés ajustar o resolver el bloqueo antes.
              </span>
            </div>
          )}

          {/* Alerta de error si falla la aprobación o rechazo */}
          {errorMessage && (
            <div className="bg-rose-50 border-b border-rose-200 px-6 py-3 text-xs text-rose-800 flex items-start gap-2.5">
              <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <strong className="font-bold block">No se pudo completar la acción:</strong>
                <span>{errorMessage}</span>
              </div>
              <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-700">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Contenido en Scroll */}
          <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
            {/* Fechas de Uso y Horarios */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-indigo-600 mt-0.5" />
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Fechas de Préstamo
                  </span>
                  <p className="text-xs font-semibold text-slate-800 mt-0.5">
                    {new Date(loan.startDate).toLocaleDateString("es-AR")} al{" "}
                    {new Date(loan.endDate).toLocaleDateString("es-AR")}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-indigo-600 mt-0.5" />
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Horarios de Atención
                  </span>
                  <p className="text-xs font-semibold text-slate-800 mt-0.5">
                    Retiro: {loan.pickupTime} hs • Devolución: {loan.returnTime} hs
                  </p>
                </div>
              </div>
            </div>

            {/* Solicitante y aval */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Datos del Solicitante y Aval
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                  <p className="font-semibold text-slate-900">{loan.userName}</p>
                  <p className="text-slate-500">DNI: {loan.applicantDni}</p>
                  <p className="text-slate-500">Email: {loan.userEmail}</p>
                  <p className="text-slate-500">Tel: {loan.applicantPhone}</p>
                  <span className="inline-block px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 rounded mt-1">
                    {loan.applicantAffiliation} • {loan.departmentName}
                  </span>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                  <span className="text-slate-400 font-medium block text-[11px]">Responsable que retira:</span>
                  <p className="font-semibold text-slate-900">{loan.pickupPersonName}</p>
                  <p className="text-slate-500">DNI: {loan.pickupPersonDni}</p>
                  <p className="text-slate-500">Tel: {loan.pickupPersonPhone}</p>
                  <div className="pt-1 text-[11px] text-slate-500 border-t border-slate-100 mt-1">
                    <span>Devuelve: {loan.returnPersonName}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Proyecto y Destino */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Actividad y Proyecto
              </span>
              <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1.5 text-xs">
                <h4 className="font-bold text-slate-900 text-sm">{loan.projectName}</h4>
                <p className="text-slate-600">{loan.projectDescription}</p>
                <div className="pt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
                  <span className="bg-slate-100 px-2 py-0.5 rounded">
                    Locación: {loan.usageLocationType === "INTERNAL" ? "Dentro de la UNLa" : "Fuera de la UNLa"} (
                    {loan.usageLocationDetails})
                  </span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded">Tipo: {loan.usageType}</span>
                </div>
              </div>
              {loan.requiresTravelWarning && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  Requiere traslado fuera del área metropolitana
                </span>
              )}
            </div>

            {/* Equipos solicitados */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Equipamiento Asignado ({loan.items.length} ítems)
              </span>
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {loan.items.map((it) => {
                  const eq = equipments.find((e) => e.id === it.equipmentId);
                  return (
                    <div key={it.id} className="p-3 flex items-center justify-between bg-white text-xs">
                      <div>
                        <span className="font-bold text-indigo-600 mr-2">{it.equipmentCode || eq?.code}</span>
                        <span className="font-semibold text-slate-800">{it.equipmentName || eq?.name}</span>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {eq?.accessoriesSummary || "Con accesorios básicos"}
                        </p>
                      </div>
                      <span className="font-bold text-slate-700 px-2.5 py-1 bg-slate-100 rounded-md">
                        {it.quantityApproved} un.
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Historial y Auditoría */}
            {loan.history && loan.history.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <History className="w-3.5 h-3.5" /> Historial y Trazabilidad de Cambios
                </span>
                <div className="space-y-2">
                  {loan.history.map((h) => {
                    const isModification =
                      h.comment?.includes("Modificación") || h.comment?.includes("modificado");
                    return (
                      <div
                        key={h.id}
                        className={`text-xs p-2.5 rounded-lg border ${
                          isModification
                            ? "bg-sky-50/70 border-sky-200 text-sky-900"
                            : "bg-slate-50 border-slate-200/60 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-bold text-[11px] ${
                              isModification ? "text-sky-800" : "text-indigo-600"
                            }`}
                          >
                            {isModification ? "Modificación del Solicitante" : h.statusTo}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(h.createdAt).toLocaleString("es-AR")}
                          </span>
                        </div>
                        <p className="mt-1 text-slate-700">{h.comment}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Por: {h.userName || "Sistema"}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Formulario de Rechazo (si se presiona Rechazar) */}
          {actionType === "REJECT" && (
            <div className="p-4 bg-rose-50 border-t border-rose-200 animate-in fade-in space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-rose-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Rechazar solicitud de préstamo {loan.code}
                </span>
                <button onClick={() => setActionType(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <input
                type="text"
                required
                placeholder="Motivo del rechazo (obligatorio para informar al solicitante)..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white text-slate-800"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setActionType(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 text-xs font-semibold hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleStatusChange("REJECT")}
                  disabled={submitting || !comment.trim()}
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50"
                >
                  {submitting ? "Rechazando..." : "Confirmar Rechazo"}
                </button>
              </div>
            </div>
          )}

          {/* Acciones principales en pie */}
          <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <a
                href={`/api/loans/${loan.id}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition"
              >
                <Download className="w-3.5 h-3.5" />
                Descargar Acta (PDF)
              </a>

              {/* Botón de modificación */}
              {canEdit && (
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold transition"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Modificar pedido</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Si es solicitante y está pendiente: botón cancelar */}
              {!isAdmin && loan.status === "PENDING" && (
                <button
                  onClick={() => handleStatusChange("CANCEL")}
                  disabled={submitting}
                  className="px-3 py-2 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-semibold"
                >
                  Cancelar solicitud
                </button>
              )}

              {/* Acciones de administración */}
              {isAdmin && loan.status === "PENDING" && actionType !== "REJECT" && (
                <>
                  <button
                    onClick={() => setActionType("REJECT")}
                    disabled={submitting}
                    className="px-3.5 py-2 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition"
                  >
                    Rechazar
                  </button>
                  <button
                    onClick={() => handleStatusChange("APPROVE")}
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{submitting ? "Aprobando..." : "Aprobar Pedido"}</span>
                  </button>
                </>
              )}

              {isAdmin && loan.status === "APPROVED" && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenChecklist("PICKUP");
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition"
                >
                  <Truck className="w-3.5 h-3.5" />
                  Registrar Entrega (Checklist)
                </button>
              )}

              {isAdmin && (loan.status === "IN_LOAN" || loan.status === "OVERDUE") && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenChecklist("RETURN");
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Registrar Devolución (Checklist)
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de edición */}
      {isEditModalOpen && (
        <LoanEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          loan={loan}
          onSuccess={() => {
            setIsEditModalOpen(false);
            onRefresh();
          }}
        />
      )}
    </>
  );
}
