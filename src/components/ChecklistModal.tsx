"use client";

import React, { useState } from "react";
import { LoanRequestDetail, EquipmentItem } from "@/types";
import { useAuth } from "@/lib/auth-context";
import {
  X,
  CheckCircle,
  AlertTriangle,
  FileCheck,
  UserCheck,
  CheckSquare,
  Square,
  ShieldCheck,
} from "lucide-react";

interface ChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: LoanRequestDetail;
  equipments: EquipmentItem[];
  type: "PICKUP" | "RETURN";
  onSuccess: () => void;
}

export function ChecklistModal({
  isOpen,
  onClose,
  loan,
  equipments,
  type,
  onSuccess,
}: ChecklistModalProps) {
  const { currentUser } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Persona que retira o devuelve
  const [personName, setPersonName] = useState(
    type === "PICKUP" ? loan.pickupPersonName : loan.returnPersonName
  );
  const [personDni, setPersonDni] = useState(
    type === "PICKUP" ? loan.pickupPersonDni : loan.returnPersonDni
  );
  const [verifiedIdentity, setVerifiedIdentity] = useState(true);
  const [observations, setObservations] = useState("");

  // Construir checklist con cada equipo y sus accesorios
  const initialChecklist = loan.items.flatMap((item) => {
    const eq = equipments.find((e) => e.id === item.equipmentId);
    const list = [
      {
        id: `chk-eq-${item.equipmentId}`,
        name: `${item.equipmentCode || eq?.code || "EQ"} — ${item.equipmentName || eq?.name || "Equipo"} (x${item.quantityApproved})`,
        type: "EQUIPMENT" as const,
        status: "OK" as "OK" | "DETAIL" | "MISSING" | "DAMAGED",
        notes: "",
      },
    ];

    if (eq?.accessories && eq.accessories.length > 0) {
      for (const acc of eq.accessories) {
        list.push({
          id: `chk-acc-${acc.id}`,
          name: `Accesorio: ${acc.name} (${acc.quantity} un.)`,
          type: "ACCESSORY" as const,
          status: "OK" as const,
          notes: "",
        });
      }
    }

    return list;
  });

  const [checklist, setChecklist] = useState(initialChecklist);

  if (!isOpen) return null;

  const updateItemStatus = (id: string, status: "OK" | "DETAIL" | "MISSING" | "DAMAGED") => {
    setChecklist((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status } : c))
    );
  };

  const updateItemNotes = (id: string, notes: string) => {
    setChecklist((prev) =>
      prev.map((c) => (c.id === id ? { ...c, notes } : c))
    );
  };

  const handleSubmit = async () => {
    if (!personName || !personDni) {
      setErrorMessage("Por favor completá el nombre y DNI de quien se presenta.");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/loans/${loan.id}/checklist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          performedById: currentUser.id,
          performedByName: currentUser.name,
          personName,
          personDni,
          verifiedIdentity,
          checklist,
          observations: observations || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Error al registrar la inspección.");
        return;
      }

      onSuccess();
      onClose();
    } catch {
      setErrorMessage("Error de conexión al guardar el checklist.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Cabecera */}
        <div
          className={`px-6 py-4 text-white flex items-center justify-between ${
            type === "PICKUP" ? "bg-indigo-700" : "bg-emerald-700"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider font-semibold opacity-80">
                {type === "PICKUP" ? "Registro de Entrega al Solicitante" : "Registro de Devolución y Cierre"}
              </span>
              <h3 className="text-base sm:text-lg font-bold">
                Pedido {loan.code} — {loan.departmentName}
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-5 text-xs sm:text-sm">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Verificación de identidad */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                {type === "PICKUP" ? "Persona que retira el equipo" : "Persona que reintegra el equipo"}
              </span>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={verifiedIdentity}
                  onChange={(e) => setVerifiedIdentity(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                DNI Físico verificado
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-0.5">Nombre y apellido</label>
                <input
                  type="text"
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-0.5">Número de DNI</label>
                <input
                  type="text"
                  value={personDni}
                  onChange={(e) => setPersonDni(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Checklist interactivo */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800">
                Checklist de estado ({checklist.length} elementos a verificar):
              </h4>
              <button
                type="button"
                onClick={() =>
                  setChecklist((prev) => prev.map((c) => ({ ...c, status: "OK" })))
                }
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                Marcar todo OK
              </button>
            </div>

            <div className="space-y-2">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border transition ${
                    item.status === "OK"
                      ? "border-slate-200 bg-white"
                      : item.status === "DETAIL"
                      ? "border-amber-200 bg-amber-50/40"
                      : "border-rose-200 bg-rose-50/40"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-slate-900 text-xs sm:text-sm">
                      {item.name}
                    </span>

                    {/* Selector de estado */}
                    <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
                      <button
                        type="button"
                        onClick={() => updateItemStatus(item.id, "OK")}
                        className={`px-2.5 py-1 rounded-md font-semibold transition ${
                          item.status === "OK"
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "text-slate-600 hover:bg-slate-200/60"
                        }`}
                      >
                        ✓ Correcto
                      </button>
                      <button
                        type="button"
                        onClick={() => updateItemStatus(item.id, "DETAIL")}
                        className={`px-2.5 py-1 rounded-md font-semibold transition ${
                          item.status === "DETAIL"
                            ? "bg-amber-500 text-white shadow-xs"
                            : "text-slate-600 hover:bg-slate-200/60"
                        }`}
                      >
                        Con detalle
                      </button>
                      <button
                        type="button"
                        onClick={() => updateItemStatus(item.id, "DAMAGED")}
                        className={`px-2.5 py-1 rounded-md font-semibold transition ${
                          item.status === "DAMAGED"
                            ? "bg-rose-600 text-white shadow-xs"
                            : "text-slate-600 hover:bg-slate-200/60"
                        }`}
                      >
                        Dañado / Faltante
                      </button>
                    </div>
                  </div>

                  {item.status !== "OK" && (
                    <input
                      type="text"
                      placeholder="Detalle o daño observado en este ítem..."
                      value={item.notes}
                      onChange={(e) => updateItemNotes(item.id, e.target.value)}
                      className="mt-2 w-full px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-xs"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Observaciones generales */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Observaciones generales de la inspección
            </label>
            <textarea
              rows={2}
              placeholder="Notas técnicas adicionales sobre la entrega o estado general..."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-slate-500 hover:text-slate-700 text-xs sm:text-sm font-medium transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmit}
            className={`px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white shadow-md transition ${
              type === "PICKUP"
                ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200"
                : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
            }`}
          >
            {submitting
              ? "Guardando inspección..."
              : type === "PICKUP"
              ? "Confirmar Entrega (Pasa a En Préstamo)"
              : "Confirmar Devolución (Cerrar Préstamo)"}
          </button>
        </div>
      </div>
    </div>
  );
}
