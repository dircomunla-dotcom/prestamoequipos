"use client";

import React from "react";
import { useCart } from "@/lib/cart-context";
import { X, Trash2, Plus, Minus, Calendar, ArrowRight, ArrowLeft, ShoppingBag } from "lucide-react";

export function CartDrawer({ onProceedToForm }: { onProceedToForm: () => void }) {
  const { items, isOpen, setIsOpen, updateQuantity, removeItem, clearCart, startDate, endDate } = useCart();

  if (!isOpen) return null;

  const totalValue = items.reduce(
    (sum, item) => sum + (item.equipment.replacementValue || 0) * item.quantity,
    0
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop: permite tocar afuera en móvil o escritorio para cerrar */}
      <div
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-xs transition-opacity cursor-pointer"
        onClick={() => setIsOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-12 sm:pl-16 pointer-events-none">
        <div className="w-[86vw] sm:w-screen max-w-md bg-white shadow-2xl flex flex-col pointer-events-auto">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                  Mi Pedido de Equipos
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-500">
                  {items.length === 0
                    ? "Sin equipos seleccionados"
                    : `${items.length} ${items.length === 1 ? "ítem seleccionado" : "ítems seleccionados"}`}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition shrink-0"
              aria-label="Cerrar panel"
            >
              <span>Cerrar</span>
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Fechas elegidas banner */}
          <div className="bg-indigo-50/70 border-b border-indigo-100/80 px-4 sm:px-5 py-2 flex items-center justify-between text-xs text-indigo-900">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>
                <strong>Fechas de uso:</strong> {new Date(startDate).toLocaleDateString("es-AR")} al{" "}
                {new Date(endDate).toLocaleDateString("es-AR")}
              </span>
            </div>
          </div>

          {/* Lista de ítems */}
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-3">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 text-slate-400">
                <ShoppingBag className="w-12 h-12 stroke-1 text-slate-300 mb-3" />
                <p className="text-sm font-medium text-slate-600">Tu pedido está vacío</p>
                <p className="text-xs text-slate-400 max-w-xs mt-1">
                  Elegí las fechas deseadas en el catálogo y agregá las cámaras, luces o kits que necesites.
                </p>
                <button
                  onClick={() => setIsOpen(false)}
                  className="mt-4 px-4 py-2 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-semibold hover:bg-indigo-100 transition"
                >
                  Explorar catálogo
                </button>
              </div>
            ) : (
              items.map(({ equipment, quantity }) => (
                <div
                  key={equipment.id}
                  className="flex gap-3 p-3 rounded-xl border border-slate-200 bg-white shadow-2xs hover:border-slate-300 transition"
                >
                  {/* Foto miniatura */}
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-slate-100 shrink-0 overflow-hidden border border-slate-100">
                    {equipment.imageUrl ? (
                      <img
                        src={equipment.imageUrl}
                        alt={equipment.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">
                        Foto
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded">
                          {equipment.code}
                        </span>
                        <h4 className="text-xs sm:text-sm font-semibold text-slate-900 truncate mt-0.5">
                          {equipment.name}
                        </h4>
                      </div>
                      <button
                        onClick={() => removeItem(equipment.id)}
                        className="text-slate-400 hover:text-rose-500 p-1 transition shrink-0"
                        title="Quitar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {equipment.accessoriesSummary || "Incluye accesorios básicos"}
                    </p>

                    {/* Controles de cantidad */}
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-50">
                      <div className="flex items-center border border-slate-200 rounded-md bg-slate-50">
                        <button
                          onClick={() => updateQuantity(equipment.id, quantity - 1)}
                          className="p-1 hover:bg-slate-200 text-slate-600 rounded-l"
                          aria-label="Disminuir"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-semibold text-slate-800">
                          {quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(equipment.id, quantity + 1)}
                          disabled={quantity >= equipment.totalUnits}
                          className="p-1 hover:bg-slate-200 text-slate-600 rounded-r disabled:opacity-30"
                          aria-label="Aumentar"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="text-[11px] text-slate-400">
                        Stock disp: {equipment.totalUnits}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer con resumen y CTAs claros para móvil y escritorio */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Valor estimado de custodia:</span>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-700">USD ${totalValue}</span>
                  <button
                    onClick={clearCart}
                    className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold underline transition"
                  >
                    Vaciar
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsOpen(false);
                  onProceedToForm();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-200 transition"
              >
                <span>Continuar con la solicitud</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold text-xs transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Seguir agregando equipos</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
