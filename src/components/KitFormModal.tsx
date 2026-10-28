"use client";

import React, { useState, useEffect } from "react";
import { EquipmentItem, KitDef } from "@/types";
import {
  X,
  Check,
  AlertCircle,
  PackageCheck,
  Plus,
  Trash2,
  Search,
} from "@/components/icons";

interface KitFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  kitToEdit?: KitDef | null;
  equipments: EquipmentItem[];
  onSuccess: () => void;
}

export function KitFormModal({
  isOpen,
  onClose,
  kitToEdit,
  equipments,
  onSuccess,
}: KitFormModalProps) {
  const isEditing = Boolean(kitToEdit);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [items, setItems] = useState<Array<{ equipmentId: string; quantity: number }>>([]);
  const [searchEq, setSearchEq] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (kitToEdit) {
      setName(kitToEdit.name || "");
      setDescription(kitToEdit.description || "");
      setIsActive(kitToEdit.isActive !== false);
      setItems(
        (kitToEdit.items || []).map((it) => ({
          equipmentId: it.equipmentId,
          quantity: it.quantity || 1,
        }))
      );
    } else {
      setName("");
      setDescription("");
      setIsActive(true);
      setItems([]);
    }
    setSearchEq("");
    setError(null);
  }, [kitToEdit, isOpen]);

  if (!isOpen) return null;

  const handleAddEquipment = (eqId: string) => {
    const existing = items.find((i) => i.equipmentId === eqId);
    const eq = equipments.find((e) => e.id === eqId);
    const maxUnits = eq?.totalUnits || 1;

    if (existing) {
      if (existing.quantity < maxUnits) {
        setItems(
          items.map((i) =>
            i.equipmentId === eqId ? { ...i, quantity: i.quantity + 1 } : i
          )
        );
      }
    } else {
      setItems([...items, { equipmentId: eqId, quantity: 1 }]);
    }
  };

  const handleUpdateQuantity = (eqId: string, newQty: number) => {
    const eq = equipments.find((e) => e.id === eqId);
    const maxUnits = eq?.totalUnits || 99;
    const validQty = Math.max(1, Math.min(maxUnits, newQty));
    setItems(
      items.map((i) =>
        i.equipmentId === eqId ? { ...i, quantity: validQty } : i
      )
    );
  };

  const handleRemoveEquipment = (eqId: string) => {
    setItems(items.filter((i) => i.equipmentId !== eqId));
  };

  const filteredAvailableEquipments = equipments.filter((eq) => {
    if (!searchEq.trim()) return true;
    const q = searchEq.toLowerCase();
    return (
      eq.name.toLowerCase().includes(q) ||
      eq.code.toLowerCase().includes(q) ||
      eq.brand.toLowerCase().includes(q) ||
      (eq.categoryName || "").toLowerCase().includes(q)
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || name.trim().length < 2) {
      setError("Por favor ingresá un nombre válido para el kit.");
      return;
    }

    if (!description.trim() || description.trim().length < 5) {
      setError("Por favor ingresá una breve descripción del propósito del kit.");
      return;
    }

    if (items.length === 0) {
      setError("Debés seleccionar al menos un equipamiento para integrar el kit.");
      return;
    }

    setLoading(true);

    try {
      const method = isEditing ? "PATCH" : "POST";
      const payload = isEditing
        ? { id: kitToEdit?.id, name: name.trim(), description: description.trim(), isActive, items }
        : { name: name.trim(), description: description.trim(), isActive, items };

      const res = await fetch("/api/kits", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo guardar el kit");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al guardar el kit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isEditing ? `Editar Kit: ${kitToEdit?.name}` : "Crear Nuevo Kit Predefinido"}
              </h2>
              <p className="text-xs text-slate-500">
                {isEditing
                  ? "Modificá el nombre, descripción o los equipos que integran este combo."
                  : "Armá un combo de equipos para que los solicitantes lo agreguen al carrito en 1 clic."}
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

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[78vh] overflow-y-auto text-xs">
          <div className="space-y-3">
            {/* Nombre del Kit */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Nombre del Kit *</label>
              <input
                type="text"
                required
                placeholder="ej. Kit Podcast / Entrevista Multipista"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-xs"
              />
            </div>

            {/* Descripción */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Descripción del combo *</label>
              <textarea
                rows={2}
                required
                placeholder="Explicá brevemente para qué tipo de actividad o producción está pensado este kit..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-xs"
              />
            </div>

            {/* Estado Activo */}
            <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              <div>
                <span className="font-semibold text-slate-800 block">
                  Visible en el catálogo público
                </span>
                <span className="text-[10px] text-slate-500">
                  Si está activo, aparecerá en la sección "Kits Predefinidos Rápidos" de la portada.
                </span>
              </div>
            </label>
          </div>

          {/* Equipos actualmente en el Kit */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800">
                Equipos incluidos en este Kit ({items.length}) *
              </label>
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={() => setItems([])}
                  className="text-[11px] text-rose-600 hover:underline font-medium"
                >
                  Vaciar lista
                </button>
              )}
            </div>

            {items.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center text-slate-400">
                Todavía no agregaste equipos al kit. Seleccioná los equipos en el buscador de abajo.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {items.map((item) => {
                  const eq = equipments.find((e) => e.id === item.equipmentId);
                  return (
                    <div
                      key={item.equipmentId}
                      className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-200/80"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded bg-indigo-600 text-white">
                            {eq?.code || item.equipmentId}
                          </span>
                          <span className="font-semibold text-slate-900 truncate">
                            {eq?.name || "Equipo"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <label className="text-[11px] text-slate-600 font-medium">Cant.:</label>
                        <input
                          type="number"
                          min={1}
                          max={eq?.totalUnits || 99}
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateQuantity(
                              item.equipmentId,
                              parseInt(e.target.value, 10) || 1
                            )
                          }
                          className="w-14 px-2 py-1 rounded-lg border border-slate-300 bg-white text-center font-bold text-slate-800"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveEquipment(item.equipmentId)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-100 transition"
                          title="Quitar del kit"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Buscador para agregar equipos del inventario */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="font-bold text-slate-800 block">
              Agregar equipamiento del inventario:
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrar inventario por código (CAM-001), nombre o categoría..."
                value={searchEq}
                onChange={(e) => setSearchEq(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-48 overflow-y-auto bg-white">
              {filteredAvailableEquipments.map((eq) => {
                const selectedItem = items.find((i) => i.equipmentId === eq.id);
                return (
                  <div
                    key={eq.id}
                    className="flex items-center justify-between px-3 py-2 hover:bg-slate-50 transition"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-indigo-700 text-[11px]">
                          {eq.code}
                        </span>
                        <span className="font-medium text-slate-800 truncate">
                          {eq.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {eq.categoryName} • Stock máx.: {eq.totalUnits} un.
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddEquipment(eq.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition shrink-0 ${
                        selectedItem
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                          : "bg-slate-100 text-slate-700 hover:bg-indigo-600 hover:text-white"
                      }`}
                    >
                      <Plus className="w-3 h-3" />
                      <span>
                        {selectedItem ? `En kit (x${selectedItem.quantity})` : "Incluir"}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
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
                  <span>{isEditing ? "Guardar Cambios" : "Crear Kit"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
