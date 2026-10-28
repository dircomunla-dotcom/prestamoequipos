"use client";

import React, { useState, useEffect } from "react";
import { EquipmentItem, KitDef, ConflictLoan } from "@/types";
import { useAuth } from "@/lib/auth-context";
import { BLOCKOUT_REASONS } from "@/lib/config";
import {
  X,
  Lock,
  AlertTriangle,
  Calendar,
  Check,
  Send,
  ShieldAlert,
} from "lucide-react";

interface BlockoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipments: EquipmentItem[];
  kits?: KitDef[];
  preselectedEquipmentId?: string;
  onSuccess: () => void;
}

export function BlockoutModal({
  isOpen,
  onClose,
  equipments,
  kits = [],
  preselectedEquipmentId,
  onSuccess,
}: BlockoutModalProps) {
  const { currentUser } = useAuth();

  const [title, setTitle] = useState("");
  const [reason, setReason] = useState<string>("SECRETARIA_INTERNAL");
  const [internalNotes, setInternalNotes] = useState("");

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 4);

  const [startDate, setStartDate] = useState(tomorrow.toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(nextWeek.toISOString().split("T")[0]);
  const [allDay, setAllDay] = useState(true);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringRule, setRecurringRule] = useState("TUESDAYS_10_14");

  const [selectedEqIds, setSelectedEqIds] = useState<string[]>(
    preselectedEquipmentId ? [preselectedEquipmentId] : []
  );
  const [quantityBlocked, setQuantityBlocked] = useState(1);

  const [conflicts, setConflicts] = useState<ConflictLoan[] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (preselectedEquipmentId && !selectedEqIds.includes(preselectedEquipmentId)) {
      setSelectedEqIds([preselectedEquipmentId]);
    }
  }, [preselectedEquipmentId]);

  if (!isOpen) return null;

  const toggleEquipment = (id: string) => {
    if (selectedEqIds.includes(id)) {
      setSelectedEqIds(selectedEqIds.filter((e) => e !== id));
    } else {
      setSelectedEqIds([...selectedEqIds, id]);
    }
  };

  const handleSelectKit = (kit: KitDef) => {
    const ids = kit.items.map((i) => i.equipmentId);
    setSelectedEqIds(ids);
    setTitle(`Bloqueo de Kit: ${kit.name}`);
  };

  const handleSubmit = async (confirmConflicts = false) => {
    if (!title) {
      setErrorMessage("Por favor ingresá un título o motivo breve para el bloqueo.");
      return;
    }
    if (selectedEqIds.length === 0) {
      setErrorMessage("Debés seleccionar al menos un equipo para bloquear.");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    const payload = {
      title,
      reason,
      internalNotes: internalNotes || null,
      startDate,
      endDate,
      allDay,
      isRecurring,
      recurringRule: isRecurring ? recurringRule : null,
      createdById: currentUser.id,
      createdByName: currentUser.name,
      equipmentIds: selectedEqIds,
      quantityBlocked,
      confirmConflicts,
    };

    try {
      const res = await fetch("/api/blockouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.status === 409 && data.conflicts) {
        // Colisión detectada: se despliega la advertencia con los pedidos afectados
        setConflicts(data.conflicts);
        return;
      }

      if (!res.ok) {
        setErrorMessage(data.error || "Error al crear el bloqueo.");
        return;
      }

      onSuccess();
      onClose();
    } catch {
      setErrorMessage("Error de conexión al guardar el bloqueo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Cabecera */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider font-semibold text-indigo-300">
                Administración de Ocupación
              </span>
              <h3 className="text-base font-bold">Bloquear Fechas de Equipamiento</h3>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal de conflicto activo */}
        {conflicts ? (
          <div className="p-6 space-y-4">
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
              <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-amber-900 text-sm">
                  ¡Atención! Este bloqueo colisiona con {conflicts.length} pedido(s) vigente(s)
                </h4>
                <p className="text-xs text-amber-800 mt-1">
                  Existen reservas previamente aprobadas o en curso en estas mismas fechas. La UNLa nunca pisa pedidos en silencio.
                </p>
              </div>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              <span className="text-xs font-semibold text-slate-700">Pedidos afectados:</span>
              {conflicts.map((conf) => (
                <div key={conf.id} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs space-y-1">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span className="text-indigo-600">{conf.code}</span>
                    <span className="text-emerald-700 font-semibold">{conf.status}</span>
                  </div>
                  <div className="text-slate-600">
                    Solicitante: <strong>{conf.applicantName}</strong> ({conf.departmentName})
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Fechas: {new Date(conf.startDate).toLocaleDateString("es-AR")} al {new Date(conf.endDate).toLocaleDateString("es-AR")}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
              <strong>Opciones a seguir:</strong>
              <p>• Cancelar o ajustar las fechas del bloqueo para no afectar las reservas previas.</p>
              <p>• O continuar: se creará el bloqueo y se enviará automáticamente un email formal de reprogramación a los solicitantes afectados.</p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConflicts(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition"
              >
                Ajustar fechas
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSubmit(true)}
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition"
              >
                {submitting ? "Aplicando..." : "Continuar y Notificar a Afectados"}
              </button>
            </div>
          </div>
        ) : (
          /* Formulario estándar de bloqueo */
          <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4 text-xs sm:text-sm">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Título del bloqueo / Actividad *</label>
              <input
                type="text"
                placeholder="Ej: Cobertura Jornada Institucional Rectorado"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Motivo administrativo</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500"
                >
                  {Object.entries(BLOCKOUT_REASONS).map(([key, item]) => (
                    <option key={key} value={key}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  El solicitante verá únicamente "No disponible", sin detalles internos.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cantidad de unidades a bloquear</label>
                <input
                  type="number"
                  min={1}
                  value={quantityBlocked}
                  onChange={(e) => setQuantityBlocked(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Fecha de inicio</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Fecha de finalización</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-800 text-xs"
                />
              </div>
            </div>

            {/* Recurrencia opcional */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 text-xs">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                Bloqueo recurrente (semanal)
              </label>

              {isRecurring && (
                <div className="pt-1">
                  <select
                    value={recurringRule}
                    onChange={(e) => setRecurringRule(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                  >
                    <option value="TUESDAYS_10_14">Todos los Martes de 10:00 a 14:00 hs</option>
                    <option value="MONDAY_10_14">Todos los Lunes de 10:00 a 14:00 hs</option>
                    <option value="WEDNESDAY_10_14">Todos los Miércoles de 10:00 a 14:00 hs</option>
                    <option value="THURSDAY_10_14">Todos los Jueves de 10:00 a 14:00 hs</option>
                    <option value="FRIDAY_10_14">Todos los Viernes de 10:00 a 14:00 hs</option>
                  </select>
                </div>
              )}
            </div>

            {/* Atajos de Kits */}
            {kits.length > 0 && (
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                  Atajo: Bloquear Kit completo:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {kits.map((kit) => (
                    <button
                      key={kit.id}
                      type="button"
                      onClick={() => handleSelectKit(kit)}
                      className="px-2.5 py-1 rounded-md text-[11px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 transition"
                    >
                      + {kit.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Lista de selección de equipos */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">
                  Equipos seleccionados ({selectedEqIds.length}):
                </label>
                <button
                  type="button"
                  onClick={() => setSelectedEqIds([])}
                  className="text-[11px] text-slate-400 hover:text-slate-600"
                >
                  Desmarcar todos
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl p-2 max-h-40 overflow-y-auto space-y-1 bg-slate-50">
                {equipments.map((eq) => {
                  const isChecked = selectedEqIds.includes(eq.id);
                  return (
                    <label
                      key={eq.id}
                      className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition text-xs ${
                        isChecked ? "bg-indigo-50 border border-indigo-200 font-semibold text-indigo-900" : "hover:bg-white text-slate-700"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleEquipment(eq.id)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-200/70 px-1 py-0.2 rounded">
                        {eq.code}
                      </span>
                      <span className="truncate flex-1">{eq.name}</span>
                      <span className="text-[10px] text-slate-400">Stock: {eq.totalUnits}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nota interna (visible solo para administración)</label>
              <textarea
                rows={2}
                placeholder="Observaciones de auditoría o motivo de la reserva..."
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
              />
            </div>

            <div className="bg-slate-50 px-6 py-3.5 -mx-6 -mb-6 border-t border-slate-200 flex items-center justify-between mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-slate-500 hover:text-slate-700 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSubmit(false)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-200 transition"
              >
                {submitting ? "Verificando..." : "Crear Bloqueo de Fechas"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
