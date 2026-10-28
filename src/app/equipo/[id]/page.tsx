"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { EquipmentItem, AvailabilityItemResult } from "@/types";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  XCircle,
  Plus,
  Minus,
  Shield,
  Layers,
  Info,
  DollarSign,
  AlertTriangle,
} from "lucide-react";

export default function EquipmentDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { currentUser } = useAuth();
  const { startDate, endDate, addItem, items: cartItems } = useCart();

  const [equipment, setEquipment] = useState<EquipmentItem | null>(null);
  const [availability, setAvailability] = useState<AvailabilityItemResult | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/equipments")
      .then((res) => res.json())
      .then((data) => {
        const found = data.equipments?.find((e: EquipmentItem) => e.id === id || e.code === id);
        if (found) setEquipment(found);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id || !startDate || !endDate) return;
    fetch(`/api/availability?startDate=${startDate}&endDate=${endDate}&affiliation=${currentUser.affiliation}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.availability && data.availability[id]) {
          setAvailability(data.availability[id]);
        }
      })
      .catch(() => {});
  }, [id, startDate, endDate, currentUser.affiliation]);

  if (loading) {
    return <div className="py-20 text-center text-slate-400 text-sm">Cargando ficha del equipo...</div>;
  }

  if (!equipment) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Equipo no encontrado</h2>
        <a href="/" className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">
          <ArrowLeft className="w-4 h-4" /> Volver al catálogo
        </a>
      </div>
    );
  }

  const isAvailable = availability ? availability.isAvailable : equipment.status === "AVAILABLE";
  const inCart = cartItems.find((i) => i.equipment.id === equipment.id);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Botón Volver */}
      <a
        href="/"
        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-indigo-600 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al Catálogo
      </a>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8 p-6 sm:p-8">
        {/* Columna Izquierda: Imagen */}
        <div className="space-y-4">
          <div className="aspect-4/3 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 relative">
            {equipment.imageUrl ? (
              <img src={equipment.imageUrl} alt={equipment.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                Sin foto disponible
              </div>
            )}
            <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-slate-900/80 text-white font-mono text-xs font-bold backdrop-blur-xs">
              {equipment.code}
            </span>
          </div>

          {/* Información técnica resumida */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Marca y Modelo:</span>
              <span className="font-semibold text-slate-800">{equipment.brand} {equipment.model}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Número de Serie:</span>
              <span className="font-mono font-medium text-slate-700">{equipment.serialNumber || "Registrado en UNLa"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Valor de reposición:</span>
              <span className="font-semibold text-slate-800">USD ${equipment.replacementValue}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Stock total de la Secretaría:</span>
              <span className="font-semibold text-slate-800">{equipment.totalUnits} un.</span>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Detalles y Disponibilidad */}
        <div className="space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                {equipment.categoryName}
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5">
                {equipment.name}
              </h1>
            </div>

            {/* Badges de estado */}
            <div className="flex flex-wrap items-center gap-2">
              {isAvailable ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Disponible para tus fechas ({availability ? availability.availableUnits : equipment.totalUnits} un.)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-700">
                  <XCircle className="w-4 h-4 text-slate-500" />
                  No disponible para estas fechas
                </span>
              )}

              {equipment.staffOnly && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                  Exclusivo Personal UNLa
                </span>
              )}
              {equipment.requiresSpecialApproval && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                  Aprobación Especial Requerida
                </span>
              )}
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              {equipment.description}
            </p>

            {/* Accesorios incluidos */}
            {equipment.accessories && equipment.accessories.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <h3 className="font-bold text-slate-800 text-xs sm:text-sm">
                  Accesorios incluidos con el préstamo:
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {equipment.accessories.map((acc) => (
                    <div
                      key={acc.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-700"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>{acc.name} ({acc.quantity} un.)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Disponibilidad y margen */}
            <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-900 space-y-1">
              <div className="flex items-center gap-2 font-semibold">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>Rango seleccionado: {new Date(startDate).toLocaleDateString("es-AR")} al {new Date(endDate).toLocaleDateString("es-AR")}</span>
              </div>
              <p className="text-indigo-800/80 text-[11px]">
                Incluye 24 hs de margen entre préstamos para recarga y control de accesorios.
              </p>
            </div>
          </div>

          {/* CTA para agregar */}
          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center gap-3">
            <div className="flex items-center border border-slate-300 rounded-lg bg-white">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2 hover:bg-slate-100 text-slate-600 rounded-l-lg"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-3 font-bold text-sm text-slate-900">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(Math.min(equipment.totalUnits, quantity + 1))}
                className="p-2 hover:bg-slate-100 text-slate-600 rounded-r-lg"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => addItem(equipment, quantity)}
              disabled={!isAvailable}
              className={`flex-1 py-3 px-6 rounded-xl font-bold text-sm text-white shadow-md transition flex items-center justify-center gap-2 ${
                !isAvailable
                  ? "bg-slate-300 cursor-not-allowed"
                  : inCart
                  ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                  : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200"
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>{inCart ? "Sumar unidades al pedido" : "Agregar a mi pedido"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
