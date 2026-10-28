"use client";

import React, { useState, useEffect } from "react";
import { EquipmentItem, KitDef } from "@/types";
import { useAuth } from "@/lib/auth-context";
import { BlockoutModal } from "@/components/BlockoutModal";
import { EquipmentFormModal } from "@/components/EquipmentFormModal";
import {
  Camera,
  Plus,
  QrCode,
  Lock,
  Search,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  PackageCheck,
  X,
  Printer,
  Edit,
  Trash2,
  Sparkles,
} from "@/components/icons";

export default function AdminInventarioPage() {
  const { isSuperAdmin, currentUser } = useAuth();

  const [equipments, setEquipments] = useState<EquipmentItem[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [kits, setKits] = useState<KitDef[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [activeTab, setActiveTab] = useState<"EQUIPOS" | "KITS">("EQUIPOS");

  // Modales
  const [isBlockoutModalOpen, setIsBlockoutModalOpen] = useState(false);
  const [blockoutEqId, setBlockoutEqId] = useState<string | undefined>(undefined);
  const [qrModalItem, setQrModalItem] = useState<EquipmentItem | null>(null);

  // Modal Crear / Editar Equipamiento
  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
  const [equipmentToEdit, setEquipmentToEdit] = useState<EquipmentItem | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchData = () => {
    fetch("/api/equipments")
      .then((res) => res.json())
      .then((data) => {
        if (data.equipments) setEquipments(data.equipments);
        if (data.categories) setCategories(data.categories);
        if (data.kits) setKits(data.kits);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStatus = async (eqId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/equipments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: eqId, status: newStatus }),
      });
      if (res.ok) {
        fetchData();
        setActionMessage("Estado técnico actualizado");
        setTimeout(() => setActionMessage(null), 2500);
      }
    } catch {}
  };

  const handleDeleteEquipment = async (eq: EquipmentItem) => {
    if (
      !confirm(
        `¿Confirma que desea eliminar permanentemente el equipo "${eq.code} — ${eq.name}" del inventario de la UNLa?`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/equipments?id=${eq.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "No se pudo eliminar el equipo");
        return;
      }
      setActionMessage(`Equipo ${eq.code} eliminado correctamente.`);
      setTimeout(() => setActionMessage(null), 3000);
      fetchData();
    } catch (err: any) {
      alert(err.message || "Error al conectar con el servidor");
    }
  };

  const filteredEquipments = equipments.filter((eq) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        eq.name.toLowerCase().includes(q) ||
        eq.code.toLowerCase().includes(q) ||
        eq.brand.toLowerCase().includes(q) ||
        eq.model.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (selectedCategory !== "ALL" && eq.categoryId !== selectedCategory) {
      return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Toast Feedback */}
      {actionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Inventario de Equipamiento y Kits
            </h1>
            {isSuperAdmin && (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] uppercase tracking-wider">
                Superadmin
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Alta, edición técnica, control de stock, etiquetas QR y bloqueo rápido de equipamiento UNLa.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Botón Crear Nuevo Equipo (Exclusivo Superadmin) */}
          {isSuperAdmin ? (
            <button
              onClick={() => {
                setEquipmentToEdit(null);
                setIsEquipmentModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Equipamiento</span>
            </button>
          ) : (
            <span
              className="text-[11px] text-slate-400 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200"
              title="Para dar de alta, editar o eliminar equipamientos, cambie al rol Superadmin en la barra superior"
            >
              Altas/Bajas: Rol Superadmin
            </span>
          )}

          <div className="inline-flex rounded-xl bg-slate-200/60 p-1 text-xs font-semibold">
            <button
              onClick={() => setActiveTab("EQUIPOS")}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === "EQUIPOS" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Equipos ({equipments.length})
            </button>
            <button
              onClick={() => setActiveTab("KITS")}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === "KITS" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Kits Predefinidos ({kits.length})
            </button>
          </div>
        </div>
      </div>

      {activeTab === "EQUIPOS" ? (
        <>
          {/* Barra de Filtros */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por código (ej. CAM-001), marca, modelo o nombre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="sm:w-64">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="ALL">Todas las categorías</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tabla de Equipamiento */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            {loading ? (
              <div className="py-20 text-center text-slate-400 text-sm">Cargando inventario...</div>
            ) : filteredEquipments.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-sm">
                No se encontraron equipos que coincidan con la búsqueda.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-3.5 px-4">Código</th>
                      <th className="py-3.5 px-4">Equipo / Marca</th>
                      <th className="py-3.5 px-4">Categoría</th>
                      <th className="py-3.5 px-4">N° Serie</th>
                      <th className="py-3.5 px-4">Stock</th>
                      <th className="py-3.5 px-4">Estado Técnico</th>
                      <th className="py-3.5 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredEquipments.map((eq) => (
                      <tr key={eq.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                          {eq.code}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-900 block">{eq.name}</span>
                          <span className="text-[11px] text-slate-400">
                            {eq.brand} {eq.model}
                            {eq.requiresSpecialApproval && (
                              <span className="ml-1.5 text-amber-600 font-medium">• Aprobación especial</span>
                            )}
                            {eq.staffOnly && (
                              <span className="ml-1.5 text-indigo-600 font-medium">• Solo Personal</span>
                            )}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{eq.categoryName}</td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                          {eq.serialNumber || "S/N"}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800">
                          {eq.totalUnits} un.
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={eq.status}
                            onChange={(e) => handleUpdateStatus(eq.id, e.target.value)}
                            className={`px-2 py-1 rounded-md text-[11px] font-bold border ${
                              eq.status === "AVAILABLE"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : eq.status === "MAINTENANCE"
                                ? "bg-orange-50 text-orange-800 border-orange-200"
                                : eq.status === "IN_LOAN"
                                ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                                : "bg-rose-50 text-rose-800 border-rose-200"
                            }`}
                          >
                            <option value="AVAILABLE">Disponible</option>
                            <option value="IN_LOAN">En préstamo</option>
                            <option value="MAINTENANCE">En mantenimiento</option>
                            <option value="OUT_OF_SERVICE">Fuera de servicio</option>
                          </select>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            {/* Acción rápida Bloquear en 1 clic */}
                            <button
                              onClick={() => {
                                setBlockoutEqId(eq.id);
                                setIsBlockoutModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 hover:bg-purple-100 font-semibold text-[11px] border border-purple-200 transition"
                              title="Bloquear fechas para este equipo"
                            >
                              <Lock className="w-3 h-3" />
                              <span>Bloquear</span>
                            </button>

                            {/* Etiqueta QR */}
                            <button
                              onClick={() => setQrModalItem(eq)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                              title="Imprimir etiqueta con código QR"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                            </button>

                            {/* Opciones exclusivas de Superadmin: Editar y Eliminar */}
                            {isSuperAdmin && (
                              <>
                                <button
                                  onClick={() => {
                                    setEquipmentToEdit(eq);
                                    setIsEquipmentModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg border border-indigo-200 hover:bg-indigo-50 text-indigo-700 transition"
                                  title="Editar equipamiento (Superadmin)"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => handleDeleteEquipment(eq)}
                                  className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 transition"
                                  title="Eliminar equipamiento (Superadmin)"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        /* GESTIÓN DE KITS */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {kits.map((kit) => (
            <div key={kit.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                  Kit Predefinido
                </span>
                <h3 className="font-bold text-slate-900 text-base mt-2">{kit.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{kit.description}</p>
              </div>

              <div className="border border-slate-100 rounded-xl p-3 bg-slate-50 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-700 block">Equipos incluidos:</span>
                {kit.items.map((i, idx) => (
                  <div key={idx} className="flex justify-between text-xs text-slate-600">
                    <span>{i.equipment?.name || i.equipmentId}</span>
                    <span className="font-bold text-slate-800">x{i.quantity}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  setBlockoutEqId(undefined);
                  setIsBlockoutModalOpen(true);
                }}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 text-xs font-semibold transition"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Bloquear Kit Completo</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* MODAL IMPRIMIR ETIQUETA QR */}
      {qrModalItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Etiqueta QR de Inventario
              </span>
              <button onClick={() => setQrModalItem(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 space-y-2">
              <div className="w-28 h-28 mx-auto bg-white border border-slate-300 rounded-lg flex items-center justify-center p-2 shadow-xs">
                <svg className="w-full h-full text-slate-900" viewBox="0 0 100 100" fill="currentColor">
                  <path d="M10,10 h30 v30 h-30 z M15,15 v20 h20 v-20 z M20,20 h10 v10 h-10 z" />
                  <path d="M60,10 h30 v30 h-30 z M65,15 v20 h20 v-20 z M70,20 h10 v10 h-10 z" />
                  <path d="M10,60 h30 v30 h-30 z M15,65 v20 h20 v-20 z M20,70 h10 v10 h-10 z" />
                  <rect x="45" y="15" width="8" height="20" />
                  <rect x="15" y="45" width="20" height="8" />
                  <rect x="55" y="55" width="15" height="15" />
                  <rect x="75" y="65" width="15" height="20" />
                  <rect x="50" y="75" width="15" height="15" />
                </svg>
              </div>

              <span className="font-mono text-base font-bold text-indigo-700 block">
                {qrModalItem.code}
              </span>
              <h4 className="font-bold text-xs text-slate-800 leading-tight">
                {qrModalItem.name}
              </h4>
              <p className="text-[10px] text-slate-400">
                UNLa • Secretaría de Cultura y Comunicación
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Etiqueta</span>
              </button>
              <button
                onClick={() => setQrModalItem(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CREAR / EDITAR EQUIPAMIENTO */}
      <EquipmentFormModal
        isOpen={isEquipmentModalOpen}
        onClose={() => setIsEquipmentModalOpen(false)}
        equipmentToEdit={equipmentToEdit}
        categories={categories}
        onSuccess={() => {
          setActionMessage(
            equipmentToEdit
              ? `Equipo ${equipmentToEdit.code} actualizado con éxito.`
              : "Nuevo equipamiento creado e incorporado al inventario."
          );
          setTimeout(() => setActionMessage(null), 3500);
          fetchData();
        }}
      />

      {/* MODAL BLOQUEO */}
      <BlockoutModal
        isOpen={isBlockoutModalOpen}
        onClose={() => setIsBlockoutModalOpen(false)}
        equipments={equipments}
        kits={kits}
        preselectedEquipmentId={blockoutEqId}
        onSuccess={() => fetchData()}
      />
    </div>
  );
}
