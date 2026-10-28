"use client";

import React, { useState, useEffect, useMemo } from "react";
import { EquipmentItem, KitDef, AvailabilityItemResult } from "@/types";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import {
  Search,
  Calendar,
  Filter,
  CheckCircle2,
  XCircle,
  Plus,
  ArrowRight,
  PackageCheck,
  Sparkles,
  Info,
  Clock,
  ShieldAlert,
  ChevronRight,
} from "lucide-react";

export default function CatalogPage() {
  const { currentUser } = useAuth();
  const { startDate, endDate, setDateRange, addItem, addKit, items: cartItems } = useCart();

  const [equipments, setEquipments] = useState<EquipmentItem[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [kits, setKits] = useState<KitDef[]>([]);
  const [availability, setAvailability] = useState<Record<string, AvailabilityItemResult>>({});

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("TODAS");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [loading, setLoading] = useState(true);

  // Cargar inventario y kits
  useEffect(() => {
    fetch("/api/equipments")
      .then((res) => res.json())
      .then((data) => {
        if (data.equipments) setEquipments(data.equipments);
        if (data.categories) setCategories(data.categories);
        if (data.kits) setKits(data.kits);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Consultar disponibilidad en tiempo real para las fechas elegidas
  const fetchAvailability = () => {
    if (!startDate || !endDate) return;
    const url = `/api/availability?startDate=${startDate}&endDate=${endDate}&affiliation=${currentUser.affiliation}`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.availability) setAvailability(data.availability);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchAvailability();
    const handleUpdate = () => fetchAvailability();
    window.addEventListener("blockout_updated", handleUpdate);
    return () => window.removeEventListener("blockout_updated", handleUpdate);
  }, [startDate, endDate, currentUser.affiliation]);

  // Filtrado de equipos
  const filteredEquipments = useMemo(() => {
    return equipments.filter((eq) => {
      // Búsqueda de texto
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          eq.name.toLowerCase().includes(q) ||
          eq.code.toLowerCase().includes(q) ||
          eq.brand.toLowerCase().includes(q) ||
          eq.model.toLowerCase().includes(q) ||
          eq.description.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Filtro de categoría
      if (selectedCategory !== "TODAS" && eq.categoryId !== selectedCategory) {
        return false;
      }

      // Filtro de "Solo disponibles"
      const avail = availability[eq.id];
      const isAvail = avail ? avail.isAvailable : eq.status === "AVAILABLE";
      if (onlyAvailable && !isAvail) {
        return false;
      }

      return true;
    });
  }, [equipments, search, selectedCategory, onlyAvailable, availability]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Banner de bienvenida y fechas */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 rounded-2xl text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="max-w-2xl relative z-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            Secretaría de Cultura y Comunicación — UNLa
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Préstamo de Equipamiento Audiovisual
          </h1>
          <p className="text-sm sm:text-base text-indigo-100/90 leading-relaxed">
            Elegí tus fechas de uso para ver en tiempo real el catálogo disponible, armar tu solicitud y retirar con tu DNI físico en la Secretaría.
          </p>
        </div>

        {/* Selector de rango de fechas destacado */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center gap-4 relative z-10 text-xs sm:text-sm">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/20">
            <Calendar className="w-4 h-4 text-indigo-300 shrink-0" />
            <span className="text-indigo-200 font-medium">Desde:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setDateRange(e.target.value, endDate)}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/20">
            <Calendar className="w-4 h-4 text-indigo-300 shrink-0" />
            <span className="text-indigo-200 font-medium">Hasta:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setDateRange(startDate, e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
            />
          </div>

          <span className="text-xs text-indigo-300 hidden lg:inline">
            Horario de atención: Lun a Vie 10 a 17 hs • Margen de revisión: 24 hs
          </span>
        </div>
      </div>

      {/* SECCIÓN KITS PREDEFINIDOS */}
      {kits.filter((k) => k.isActive !== false).length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Kits Predefinidos Rápidos
              </h2>
            </div>
            <span className="text-xs text-slate-500 hidden sm:inline">
              Equipamiento configurado listo para pedir en 1 clic
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {kits.filter((k) => k.isActive !== false).map((kit) => (
              <div
                key={kit.id}
                className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs hover:shadow-md hover:border-indigo-300 transition flex flex-col justify-between space-y-3"
              >
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                    Kit Completo
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base mt-1.5">{kit.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{kit.description}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">
                    {kit.items.length} equipos incluidos
                  </span>
                  <button
                    onClick={() => addKit(kit, equipments)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 text-xs font-semibold transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Kit al Pedido</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FILTROS Y BUSCADOR */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Buscador */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre, código (ej. CAM-001), marca o accesorio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Toggle Solo Disponibles */}
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 select-none">
            <input
              type="checkbox"
              checked={onlyAvailable}
              onChange={(e) => setOnlyAvailable(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            Solo equipos disponibles en estas fechas
          </label>
        </div>

        {/* Píldoras de Categorías */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
          <button
            onClick={() => setSelectedCategory("TODAS")}
            className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition ${
              selectedCategory === "TODAS"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Todas las categorías
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition ${
                selectedCategory === cat.id
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* GRILLA DE EQUIPOS */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-700">
            Mostrando {filteredEquipments.length} {filteredEquipments.length === 1 ? "equipo" : "equipos"}
          </h2>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm">
            Cargando catálogo audiovisual...
          </div>
        ) : filteredEquipments.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8 space-y-2">
            <Info className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-800 text-base">No se encontraron equipos</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Probá modificando el término de búsqueda o cambiando las fechas seleccionadas.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredEquipments.map((eq) => {
              const avail = availability[eq.id];
              const isAvailable = avail ? avail.isAvailable : eq.status === "AVAILABLE";
              const inCart = cartItems.some((i) => i.equipment.id === eq.id);

              return (
                <div
                  key={eq.id}
                  className={`bg-white rounded-2xl border overflow-hidden flex flex-col justify-between transition group ${
                    isAvailable
                      ? "border-slate-200 shadow-2xs hover:shadow-md hover:border-indigo-300"
                      : "border-slate-200/80 bg-slate-50/50 opacity-80"
                  }`}
                >
                  {/* Foto con badges */}
                  <div className="relative aspect-4/3 bg-slate-100 overflow-hidden">
                    {eq.imageUrl ? (
                      <img
                        src={eq.imageUrl}
                        alt={eq.name}
                        className="w-full h-full object-cover group-hover:scale-102 transition duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">
                        Sin foto
                      </div>
                    )}

                    {/* Código del equipo */}
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-slate-900/80 text-white font-mono text-[10px] font-bold backdrop-blur-xs">
                      {eq.code}
                    </span>

                    {/* Badge de disponibilidad */}
                    <div className="absolute top-2.5 right-2.5">
                      {isAvailable ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white shadow-xs">
                          <CheckCircle2 className="w-3 h-3" />
                          Disponible ({avail ? avail.availableUnits : eq.totalUnits})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-600 text-white shadow-xs">
                          <XCircle className="w-3 h-3" />
                          No disponible
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Cuerpo */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                        <span>{eq.brand}</span>
                        <span>•</span>
                        <span>{eq.categoryName}</span>
                      </div>

                      <a
                        href={`/equipo/${eq.id}`}
                        className="font-bold text-slate-900 text-sm hover:text-indigo-600 transition block mt-0.5 leading-snug"
                      >
                        {eq.name}
                      </a>

                      <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                        {eq.description}
                      </p>

                      {eq.accessoriesSummary && (
                        <p className="text-[11px] text-indigo-700 bg-indigo-50/70 p-1.5 rounded-md mt-2 line-clamp-1">
                          Accesorios: {eq.accessoriesSummary}
                        </p>
                      )}

                      {/* Advertencias de rol o aprobación */}
                      {eq.staffOnly && (
                        <span className="inline-block mt-2 text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                          Solo docentes / nodocentes
                        </span>
                      )}
                      {eq.requiresSpecialApproval && (
                        <span className="inline-block mt-2 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 ml-1">
                          Requiere aprobación especial
                        </span>
                      )}

                      {!isAvailable && avail?.reason && (
                        <p className="text-[11px] text-slate-500 mt-2 italic">
                          {avail.reason}
                        </p>
                      )}
                    </div>

                    {/* Botón de acción */}
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                      <a
                        href={`/equipo/${eq.id}`}
                        className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium transition"
                        title="Ver detalles"
                      >
                        Detalles
                      </a>
                      <button
                        onClick={() => addItem(eq)}
                        disabled={!isAvailable}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition shadow-xs ${
                          !isAvailable
                            ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                            : inCart
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200"
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{inCart ? "Sumar otra unidad" : "Agregar al pedido"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
