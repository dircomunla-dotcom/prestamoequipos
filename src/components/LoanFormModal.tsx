"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { APP_CONFIG, USAGE_TYPES, AFFILIATION_LABELS } from "@/lib/config";
import { Department } from "@prisma/client";
import {
  X,
  Calendar,
  User,
  Users,
  Film,
  FileCheck2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  Download,
  Info,
} from "lucide-react";

interface LoanFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (loanCode: string) => void;
}

export function LoanFormModal({ isOpen, onClose, onSuccess }: LoanFormModalProps) {
  const { currentUser } = useAuth();
  const { items, startDate, endDate, setDateRange, clearCart } = useCart();

  const [step, setStep] = useState(1);
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdLoan, setCreatedLoan] = useState<{ id: string; code: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    // Paso 1: Fechas y Horarios
    startDate: startDate,
    endDate: endDate,
    pickupTime: "10:30",
    returnTime: "16:00",

    // Paso 2: Quién solicita
    applicantName: currentUser.name,
    applicantEmail: currentUser.email,
    applicantDni: currentUser.dni || "",
    applicantPhone: currentUser.phone || "",
    departmentId: currentUser.departmentId || "dep-dha",
    applicantAffiliation: currentUser.affiliation || "DOCENTE",
    sponsorName: "",
    sponsorRole: "",
    sponsorEmail: "",

    // Paso 3: Retiro y Devolución
    isPickupApplicant: true,
    pickupPersonName: currentUser.name,
    pickupPersonDni: currentUser.dni || "",
    pickupPersonPhone: currentUser.phone || "",
    isReturnPickupSame: true,
    returnPersonName: currentUser.name,
    returnPersonDni: currentUser.dni || "",
    returnPersonPhone: currentUser.phone || "",

    // Paso 4: Uso
    projectName: "",
    projectDescription: "",
    usageLocationType: "INTERNAL" as "INTERNAL" | "EXTERNAL",
    usageLocationDetails: "",
    usageType: USAGE_TYPES[0],
    operatorsCount: 1,
    operatorsExperience: "Básico / Manejo general",
    requiresTravelWarning: false,
    specialNotes: "",

    // Paso 5: Términos
    termsAccepted: false,
  });

  // Cargar departamentos disponibles
  useEffect(() => {
    fetch("/api/equipments")
      .then((res) => res.json())
      .then((data) => {
        if (data.departments) setDepartments(data.departments);
      })
      .catch(() => {});
  }, []);

  // Actualizar datos al cambiar de usuario demo
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      applicantName: currentUser.name,
      applicantEmail: currentUser.email,
      applicantDni: currentUser.dni || "",
      applicantPhone: currentUser.phone || "",
      departmentId: currentUser.departmentId || prev.departmentId,
      applicantAffiliation: currentUser.affiliation || prev.applicantAffiliation,
      pickupPersonName: prev.isPickupApplicant ? currentUser.name : prev.pickupPersonName,
      pickupPersonDni: prev.isPickupApplicant ? currentUser.dni || "" : prev.pickupPersonDni,
      pickupPersonPhone: prev.isPickupApplicant ? currentUser.phone || "" : prev.pickupPersonPhone,
    }));
  }, [currentUser]);

  if (!isOpen) return null;

  const handleNext = () => {
    setErrorMessage(null);

    if (step === 1) {
      if (!formData.startDate || !formData.endDate) {
        setErrorMessage("Por favor seleccioná las fechas de retiro y devolución.");
        return;
      }
      if (new Date(formData.startDate) > new Date(formData.endDate)) {
        setErrorMessage("La fecha de retiro no puede ser posterior a la de devolución.");
        return;
      }
    }

    if (step === 2) {
      if (!formData.applicantDni || !formData.applicantPhone) {
        setErrorMessage("Por favor completá tu DNI y teléfono de contacto.");
        return;
      }
      if (formData.applicantAffiliation === "ESTUDIANTE" && !formData.sponsorName) {
        setErrorMessage("Los estudiantes deben indicar el nombre del docente o autoridad que avala la solicitud.");
        return;
      }
    }

    if (step === 3) {
      if (!formData.pickupPersonName || !formData.pickupPersonDni) {
        setErrorMessage("Por favor completá los datos de la persona autorizada para retirar.");
        return;
      }
      if (!formData.returnPersonName || !formData.returnPersonDni) {
        setErrorMessage("Por favor completá los datos de la persona que devolverá los equipos.");
        return;
      }
    }

    if (step === 4) {
      if (!formData.projectName || !formData.projectDescription || !formData.usageLocationDetails) {
        setErrorMessage("Por favor completá el nombre del proyecto, descripción y lugar de uso.");
        return;
      }
    }

    setStep(step + 1);
  };

  const handlePrev = () => {
    setErrorMessage(null);
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!formData.termsAccepted) {
      setErrorMessage("Debés aceptar los términos y condiciones de custodia para enviar la solicitud.");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    const payload = {
      userId: currentUser.id,
      userName: formData.applicantName,
      userEmail: formData.applicantEmail,
      departmentId: formData.departmentId,
      departmentName:
        departments.find((d) => d.id === formData.departmentId)?.name ||
        currentUser.departmentName ||
        "Departamento UNLa",
      applicantAffiliation: formData.applicantAffiliation,
      applicantDni: formData.applicantDni,
      applicantPhone: formData.applicantPhone,
      sponsorName: formData.sponsorName || null,
      sponsorRole: formData.sponsorRole || null,
      sponsorEmail: formData.sponsorEmail || null,
      pickupPersonName: formData.pickupPersonName,
      pickupPersonDni: formData.pickupPersonDni,
      pickupPersonPhone: formData.pickupPersonPhone,
      isPickupApplicant: formData.isPickupApplicant,
      returnPersonName: formData.returnPersonName,
      returnPersonDni: formData.returnPersonDni,
      returnPersonPhone: formData.returnPersonPhone,
      isReturnPickupSame: formData.isReturnPickupSame,
      startDate: formData.startDate,
      endDate: formData.endDate,
      pickupTime: formData.pickupTime,
      returnTime: formData.returnTime,
      projectName: formData.projectName,
      projectDescription: formData.projectDescription,
      usageLocationType: formData.usageLocationType,
      usageLocationDetails: formData.usageLocationDetails,
      usageType: formData.usageType,
      operatorsCount: Number(formData.operatorsCount) || 1,
      operatorsExperience: formData.operatorsExperience,
      requiresTravelWarning: formData.requiresTravelWarning,
      specialNotes: formData.specialNotes || null,
      items: items.map((it) => ({
        equipmentId: it.equipment.id,
        quantityRequested: it.quantity,
      })),
    };

    try {
      const res = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Ocurrió un error al procesar el pedido.");
        return;
      }

      setCreatedLoan(data.loan);
      clearCart();
      if (onSuccess) onSuccess(data.loan.code);
    } catch {
      setErrorMessage("Error de red al conectar con el servidor.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Cabecera del modal */}
        <div className="bg-indigo-700 px-6 py-4 text-white flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider font-semibold text-indigo-200">
              Solicitud de Préstamo UNLa
            </span>
            <h3 className="text-lg font-bold">
              {createdLoan ? "¡Solicitud Confirmada!" : `Paso ${step} de 5: ${
                step === 1
                  ? "Fechas y Horarios"
                  : step === 2
                  ? "Quién Solicita"
                  : step === 3
                  ? "Retiro y Devolución"
                  : step === 4
                  ? "Destino del Equipamiento"
                  : "Resumen y Aceptación"
              }`}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-indigo-200 hover:text-white p-1 rounded-lg hover:bg-indigo-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Indicador de pasos */}
        {!createdLoan && (
          <div className="bg-indigo-50/70 px-6 py-2.5 border-b border-indigo-100 flex items-center justify-between text-xs">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`flex items-center gap-1.5 font-medium ${
                  s === step
                    ? "text-indigo-700 font-bold"
                    : s < step
                    ? "text-emerald-600"
                    : "text-slate-400"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    s === step
                      ? "bg-indigo-600 text-white"
                      : s < step
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {s < step ? "✓" : s}
                </div>
                <span className="hidden sm:inline">
                  {s === 1 ? "Fechas" : s === 2 ? "Solicitante" : s === 3 ? "Retiro" : s === 4 ? "Uso" : "Términos"}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Contenido del formulario */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>{errorMessage}</div>
            </div>
          )}

          {/* CASO ÉXITO */}
          {createdLoan ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">¡Tu pedido fue recibido con éxito!</h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Registramos tu solicitud en la Secretaría de Cultura y Comunicación. Te enviamos una copia a{" "}
                <strong>{formData.applicantEmail}</strong>.
              </p>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-w-sm mx-auto">
                <span className="text-xs text-slate-500 block">Código de seguimiento oficial:</span>
                <span className="text-2xl font-mono font-bold text-indigo-700 tracking-wider">
                  {createdLoan.code}
                </span>
              </div>

              <div className="pt-4 flex flex-wrap justify-center gap-3">
                <a
                  href={`/api/loans/${createdLoan.id}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs sm:text-sm shadow-sm transition"
                >
                  <Download className="w-4 h-4" />
                  Descargar Acta de Préstamo (PDF)
                </a>
                <button
                  onClick={() => {
                    onClose();
                    window.location.href = "/mis-pedidos";
                  }}
                  className="px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs sm:text-sm transition"
                >
                  Ver en Mis Pedidos
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* PASO 1: FECHAS Y HORARIOS */}
              {step === 1 && (
                <div className="space-y-4 text-xs sm:text-sm">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-blue-800 text-xs flex items-center gap-2">
                    <Info className="w-4 h-4 shrink-0 text-blue-600" />
                    <span>
                      Horarios de retiro y devolución: <strong>{APP_CONFIG.businessHours.daysText}</strong>.
                      Anticipación mínima: {APP_CONFIG.minNoticeHours} hs.
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Fecha de inicio (retiro)</label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => {
                          setFormData({ ...formData, startDate: e.target.value });
                          setDateRange(e.target.value, formData.endDate);
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Fecha de fin (devolución)</label>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => {
                          setFormData({ ...formData, endDate: e.target.value });
                          setDateRange(formData.startDate, e.target.value);
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Horario estimado de retiro</label>
                      <select
                        value={formData.pickupTime}
                        onChange={(e) => setFormData({ ...formData, pickupTime: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-slate-800"
                      >
                        <option value="10:00">10:00 hs</option>
                        <option value="10:30">10:30 hs</option>
                        <option value="11:00">11:00 hs</option>
                        <option value="12:00">12:00 hs</option>
                        <option value="14:00">14:00 hs</option>
                        <option value="15:30">15:30 hs</option>
                        <option value="16:30">16:30 hs</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Horario estimado de devolución</label>
                      <select
                        value={formData.returnTime}
                        onChange={(e) => setFormData({ ...formData, returnTime: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-slate-800"
                      >
                        <option value="11:00">11:00 hs</option>
                        <option value="13:00">13:00 hs</option>
                        <option value="15:00">15:00 hs</option>
                        <option value="16:00">16:00 hs</option>
                        <option value="16:45">16:45 hs</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* PASO 2: QUIÉN SOLICITA */}
              {step === 2 && (
                <div className="space-y-4 text-xs sm:text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Nombre y Apellido</label>
                      <input
                        type="text"
                        value={formData.applicantName}
                        onChange={(e) => setFormData({ ...formData, applicantName: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">DNI (Físico obligatorio al retirar)</label>
                      <input
                        type="text"
                        value={formData.applicantDni}
                        onChange={(e) => setFormData({ ...formData, applicantDni: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Email institucional</label>
                      <input
                        type="email"
                        value={formData.applicantEmail}
                        onChange={(e) => setFormData({ ...formData, applicantEmail: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Teléfono / WhatsApp</label>
                      <input
                        type="tel"
                        value={formData.applicantPhone}
                        onChange={(e) => setFormData({ ...formData, applicantPhone: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Espacio / Área de la UNLa</label>
                      <select
                        value={formData.departmentId}
                        onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-slate-800"
                      >
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Vínculo con la UNLa</label>
                      <select
                        value={formData.applicantAffiliation}
                        onChange={(e) => setFormData({ ...formData, applicantAffiliation: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-slate-800"
                      >
                        {Object.entries(AFFILIATION_LABELS).map(([k, label]) => (
                          <option key={k} value={k}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {formData.applicantAffiliation === "ESTUDIANTE" && (
                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
                      <div className="flex items-center gap-2 text-amber-800 font-semibold text-xs">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span>Aval Institucional Obligatorio para Estudiantes</span>
                      </div>
                      <p className="text-xs text-amber-700">
                        Indicar el docente responsable o autoridad de la carrera que avala esta solicitud.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="Nombre y apellido del docente *"
                          value={formData.sponsorName}
                          onChange={(e) => setFormData({ ...formData, sponsorName: e.target.value })}
                          className="px-2.5 py-1.5 rounded-lg border border-amber-300 bg-white text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Cargo / Cátedra"
                          value={formData.sponsorRole}
                          onChange={(e) => setFormData({ ...formData, sponsorRole: e.target.value })}
                          className="px-2.5 py-1.5 rounded-lg border border-amber-300 bg-white text-xs"
                        />
                        <input
                          type="email"
                          placeholder="Email institucional aval"
                          value={formData.sponsorEmail}
                          onChange={(e) => setFormData({ ...formData, sponsorEmail: e.target.value })}
                          className="px-2.5 py-1.5 rounded-lg border border-amber-300 bg-white text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* PASO 3: RETIRO Y DEVOLUCIÓN */}
              {step === 3 && (
                <div className="space-y-5 text-xs sm:text-sm">
                  {/* Persona que retira */}
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-800">Persona autorizada para retirar</h4>
                      <label className="flex items-center gap-2 cursor-pointer text-indigo-700 text-xs font-semibold">
                        <input
                          type="checkbox"
                          checked={formData.isPickupApplicant}
                          onChange={(e) => {
                            const isMe = e.target.checked;
                            setFormData({
                              ...formData,
                              isPickupApplicant: isMe,
                              pickupPersonName: isMe ? formData.applicantName : "",
                              pickupPersonDni: isMe ? formData.applicantDni : "",
                              pickupPersonPhone: isMe ? formData.applicantPhone : "",
                            });
                          }}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        Soy yo
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input
                        type="text"
                        placeholder="Nombre y Apellido *"
                        value={formData.pickupPersonName}
                        onChange={(e) => setFormData({ ...formData, pickupPersonName: e.target.value })}
                        className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs"
                      />
                      <input
                        type="text"
                        placeholder="DNI *"
                        value={formData.pickupPersonDni}
                        onChange={(e) => setFormData({ ...formData, pickupPersonDni: e.target.value })}
                        className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs"
                      />
                      <input
                        type="tel"
                        placeholder="Teléfono *"
                        value={formData.pickupPersonPhone}
                        onChange={(e) => setFormData({ ...formData, pickupPersonPhone: e.target.value })}
                        className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs"
                      />
                    </div>
                  </div>

                  {/* Persona que devuelve */}
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-800">Persona que realizará la devolución</h4>
                      <label className="flex items-center gap-2 cursor-pointer text-indigo-700 text-xs font-semibold">
                        <input
                          type="checkbox"
                          checked={formData.isReturnPickupSame}
                          onChange={(e) => {
                            const same = e.target.checked;
                            setFormData({
                              ...formData,
                              isReturnPickupSame: same,
                              returnPersonName: same ? formData.pickupPersonName : "",
                              returnPersonDni: same ? formData.pickupPersonDni : "",
                              returnPersonPhone: same ? formData.pickupPersonPhone : "",
                            });
                          }}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        Es la misma persona que retira
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input
                        type="text"
                        placeholder="Nombre y Apellido *"
                        value={formData.returnPersonName}
                        onChange={(e) => setFormData({ ...formData, returnPersonName: e.target.value })}
                        className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs"
                      />
                      <input
                        type="text"
                        placeholder="DNI *"
                        value={formData.returnPersonDni}
                        onChange={(e) => setFormData({ ...formData, returnPersonDni: e.target.value })}
                        className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs"
                      />
                      <input
                        type="tel"
                        placeholder="Teléfono *"
                        value={formData.returnPersonPhone}
                        onChange={(e) => setFormData({ ...formData, returnPersonPhone: e.target.value })}
                        className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* PASO 4: USO DEL EQUIPAMIENTO */}
              {step === 4 && (
                <div className="space-y-4 text-xs sm:text-sm">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nombre del proyecto o actividad *</label>
                    <input
                      type="text"
                      placeholder="Ej: Registro Jornadas de Memoria y Derechos Humanos"
                      value={formData.projectName}
                      onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Descripción breve del uso *</label>
                    <textarea
                      rows={2}
                      placeholder="Describí brevemente la actividad audiovisual a realizar..."
                      value={formData.projectDescription}
                      onChange={(e) => setFormData({ ...formData, projectDescription: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Tipo de uso</label>
                      <select
                        value={formData.usageType}
                        onChange={(e) => setFormData({ ...formData, usageType: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-slate-800"
                      >
                        {USAGE_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Ámbito de uso</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, usageLocationType: "INTERNAL" })}
                          className={`flex-1 py-2 px-3 rounded-lg border text-xs font-semibold ${
                            formData.usageLocationType === "INTERNAL"
                              ? "bg-indigo-50 border-indigo-500 text-indigo-700"
                              : "border-slate-300 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          Dentro de la UNLa
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, usageLocationType: "EXTERNAL" })}
                          className={`flex-1 py-2 px-3 rounded-lg border text-xs font-semibold ${
                            formData.usageLocationType === "EXTERNAL"
                              ? "bg-indigo-50 border-indigo-500 text-indigo-700"
                              : "border-slate-300 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          Fuera de la UNLa
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {formData.usageLocationType === "INTERNAL"
                        ? "Edificio / Aula / Espacio UNLa *"
                        : "Dirección exacta / Localidad fuera de la UNLa *"}
                    </label>
                    <input
                      type="text"
                      placeholder={
                        formData.usageLocationType === "INTERNAL"
                          ? "Ej: Edificio José Hernández - Aula 12"
                          : "Ej: Hipólito Yrigoyen 5600, Lanús Oeste"
                      }
                      value={formData.usageLocationDetails}
                      onChange={(e) => setFormData({ ...formData, usageLocationDetails: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-slate-800"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="travelCheck"
                      checked={formData.requiresTravelWarning}
                      onChange={(e) => setFormData({ ...formData, requiresTravelWarning: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="travelCheck" className="text-xs text-slate-700 cursor-pointer">
                      Requiere traslado fuera del Área Metropolitana / Provincia (alerta para evaluación de la Secretaría)
                    </label>
                  </div>
                </div>
              )}

              {/* PASO 5: RESUMEN Y ACEPTACIÓN */}
              {step === 5 && (
                <div className="space-y-4 text-xs sm:text-sm">
                  {/* Resumen de equipos */}
                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2">
                    <h4 className="font-bold text-slate-800 text-xs">Equipamiento solicitado ({items.length} ítems):</h4>
                    <div className="space-y-1">
                      {items.map((it) => (
                        <div key={it.equipment.id} className="flex justify-between text-xs text-slate-700 py-0.5 border-b border-slate-100 last:border-0">
                          <span>
                            <strong className="text-indigo-600">{it.equipment.code}</strong> — {it.equipment.name}
                          </span>
                          <span className="font-semibold">{it.quantity} un.</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Observaciones */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Observaciones o pedidos especiales (opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Necesitamos 1 trípode extra para plano cenital o cables más largos."
                      value={formData.specialNotes}
                      onChange={(e) => setFormData({ ...formData, specialNotes: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                    />
                  </div>

                  {/* Caja de términos y condiciones */}
                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 max-h-36 overflow-y-auto text-[11px] text-slate-600 space-y-1.5">
                    <p className="font-bold text-slate-800 uppercase text-[10px]">
                      Términos y Condiciones de Responsabilidad — UNLa
                    </p>
                    <p>
                      1. El equipamiento prestado es propiedad de la Universidad Nacional de Lanús y debe destinarse exclusivamente a los fines institucionales declarados.
                    </p>
                    <p>
                      2. El solicitante asume el compromiso de custodia y reintegro en tiempo y forma en la Secretaría de Cultura y Comunicación.
                    </p>
                    <p>
                      3. En caso de daño por negligencia, rotura o pérdida de equipos o accesorios, el solicitante y su espacio asumen la obligación de su reparación o reposición.
                    </p>
                  </div>

                  <label className="flex items-start gap-2.5 p-3 rounded-xl bg-indigo-50/60 border border-indigo-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.termsAccepted}
                      onChange={(e) => setFormData({ ...formData, termsAccepted: e.target.checked })}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs text-indigo-900 font-medium">
                      He leído y acepto los <strong>términos y condiciones</strong> de préstamo y asumo la responsabilidad por la custodia del equipamiento.
                    </span>
                  </label>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer con botones de navegación */}
        {!createdLoan && (
          <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="flex items-center gap-1 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs sm:text-sm font-medium transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Anterior
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-slate-500 hover:text-slate-700 text-xs sm:text-sm font-medium transition"
              >
                Cancelar
              </button>
            )}

            {step < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition"
              >
                <span>Siguiente</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-200 transition"
              >
                {submitting ? "Enviando solicitud..." : "Confirmar y Enviar Solicitud"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
