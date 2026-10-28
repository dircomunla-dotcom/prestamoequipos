"use client";

import React, { useState, useEffect } from "react";
import { LoanRequestDetail } from "@/types";
import { useAuth } from "@/lib/auth-context";
import {
  X,
  Calendar,
  Clock,
  User,
  MapPin,
  Check,
  AlertCircle,
  FileText,
  AlertTriangle,
  Info,
} from "@/components/icons";

interface LoanEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: LoanRequestDetail;
  onSuccess: () => void;
}

export function LoanEditModal({ isOpen, onClose, loan, onSuccess }: LoanEditModalProps) {
  const { currentUser } = useAuth();

  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    pickupTime: "10:00",
    returnTime: "17:00",
    projectName: "",
    projectDescription: "",
    usageLocationType: "INTERNAL" as "INTERNAL" | "EXTERNAL",
    usageLocationDetails: "",
    usageType: "Registro de evento",
    requiresTravelWarning: false,
    pickupPersonName: "",
    pickupPersonDni: "",
    pickupPersonPhone: "",
    returnPersonName: "",
    returnPersonDni: "",
    returnPersonPhone: "",
    specialNotes: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loan) {
      const sDate = loan.startDate ? loan.startDate.substring(0, 10) : "";
      const eDate = loan.endDate ? loan.endDate.substring(0, 10) : "";

      setFormData({
        startDate: sDate,
        endDate: eDate,
        pickupTime: loan.pickupTime || "10:00",
        returnTime: loan.returnTime || "17:00",
        projectName: loan.projectName || "",
        projectDescription: loan.projectDescription || "",
        usageLocationType: loan.usageLocationType || "INTERNAL",
        usageLocationDetails: loan.usageLocationDetails || "",
        usageType: loan.usageType || "Registro de evento",
        requiresTravelWarning: Boolean(loan.requiresTravelWarning),
        pickupPersonName: loan.pickupPersonName || "",
        pickupPersonDni: loan.pickupPersonDni || "",
        pickupPersonPhone: loan.pickupPersonPhone || "",
        returnPersonName: loan.returnPersonName || "",
        returnPersonDni: loan.returnPersonDni || "",
        returnPersonPhone: loan.returnPersonPhone || "",
        specialNotes: loan.specialNotes || "",
      });
      setError(null);
    }
  }, [loan, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.projectName.trim() || !formData.projectDescription.trim()) {
      setError("Por favor complete el nombre del proyecto y la descripción del uso.");
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      setError("La fecha de devolución debe ser igual o posterior a la fecha de inicio.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/loans/${loan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "EDIT",
          data: formData,
          modifierUser: {
            id: currentUser.id,
            name: currentUser.name,
          },
        }),
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.error || "Error al actualizar la solicitud");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al procesar la actualización");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Modificar Solicitud: <span className="text-indigo-600">{loan.code}</span>
              </h2>
              <p className="text-xs text-slate-500">
                Actualice las fechas, personas de retiro o detalles de la actividad institucional.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerta de re-aprobación si ya estaba aprobado */}
        {loan.status === "APPROVED" && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <strong className="font-semibold block">Aviso sobre pedidos aprobados:</strong>
              Al modificar un pedido ya aprobado, el sistema registrará los cambios de manera transparente en la
              auditoría y la Secretaría de Cultura y Comunicación revisará la actualización para reconfirmar el retiro.
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[72vh] overflow-y-auto text-xs">
          {/* SECCIÓN 1: FECHAS Y HORARIOS */}
          <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5" />
              <span>1. Fechas y Horarios de Uso</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Fecha de retiro (Desde) *</label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Fecha de devolución (Hasta) *</label>
                <input
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Horario de retiro (10 a 17 hs) *</label>
                <input
                  type="time"
                  required
                  min="10:00"
                  max="17:00"
                  value={formData.pickupTime}
                  onChange={(e) => setFormData({ ...formData, pickupTime: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Horario de devolución (10 a 17 hs) *</label>
                <input
                  type="time"
                  required
                  min="10:00"
                  max="17:00"
                  value={formData.returnTime}
                  onChange={(e) => setFormData({ ...formData, returnTime: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-xs"
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: PERSONAS DE RETIRO Y DEVOLUCIÓN */}
          <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider">
              <User className="w-3.5 h-3.5" />
              <span>2. Personas que Retiran y Devuelven</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Nombre quien retira *</label>
                <input
                  type="text"
                  required
                  value={formData.pickupPersonName}
                  onChange={(e) => setFormData({ ...formData, pickupPersonName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">DNI quien retira *</label>
                <input
                  type="text"
                  required
                  value={formData.pickupPersonDni}
                  onChange={(e) => setFormData({ ...formData, pickupPersonDni: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Teléfono / WhatsApp *</label>
                <input
                  type="text"
                  required
                  value={formData.pickupPersonPhone}
                  onChange={(e) => setFormData({ ...formData, pickupPersonPhone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Nombre quien devuelve *</label>
                <input
                  type="text"
                  required
                  value={formData.returnPersonName}
                  onChange={(e) => setFormData({ ...formData, returnPersonName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">DNI quien devuelve *</label>
                <input
                  type="text"
                  required
                  value={formData.returnPersonDni}
                  onChange={(e) => setFormData({ ...formData, returnPersonDni: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Teléfono quien devuelve *</label>
                <input
                  type="text"
                  required
                  value={formData.returnPersonPhone}
                  onChange={(e) => setFormData({ ...formData, returnPersonPhone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-xs"
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: DETALLE DEL PROYECTO */}
          <div className="space-y-3 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5" />
              <span>3. Datos de la Actividad / Uso</span>
            </div>

            <div className="space-y-2">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Nombre del proyecto / evento *</label>
                <input
                  type="text"
                  required
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Descripción breve del uso *</label>
                <textarea
                  rows={2}
                  required
                  value={formData.projectDescription}
                  onChange={(e) => setFormData({ ...formData, projectDescription: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Ámbito de uso *</label>
                  <select
                    value={formData.usageLocationType}
                    onChange={(e) =>
                      setFormData({ ...formData, usageLocationType: e.target.value as "INTERNAL" | "EXTERNAL" })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-xs bg-white"
                  >
                    <option value="INTERNAL">Dentro de la UNLa (aula, edificio, radio)</option>
                    <option value="EXTERNAL">Fuera de la UNLa (locación externa)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Lugar específico / dirección *</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Edificio Homero Manzi, Aula 12"
                    value={formData.usageLocationDetails}
                    onChange={(e) => setFormData({ ...formData, usageLocationDetails: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <label className="font-semibold text-slate-700">Observaciones o requerimientos especiales</label>
                <textarea
                  rows={2}
                  placeholder="Aclaraciones sobre baterías extra, cables especiales, horarios específicos..."
                  value={formData.specialNotes}
                  onChange={(e) => setFormData({ ...formData, specialNotes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm transition"
            >
              {loading ? (
                <span>Guardando...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Guardar Modificaciones</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
