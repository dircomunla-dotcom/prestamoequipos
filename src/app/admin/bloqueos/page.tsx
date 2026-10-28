"use client";

import React, { useState, useEffect, useMemo } from "react";
import { BlockoutDetail, EquipmentItem } from "@/types";
import { BLOCKOUT_REASONS } from "@/lib/config";
import { BlockoutModal } from "@/components/BlockoutModal";
import {
  Lock,
  Plus,
  Trash2,
  Calendar,
  AlertTriangle,
  Info,
  Clock,
  Shield,
  Search,
  Filter,
} from "lucide-react";

export default function AdminBloqueosPage() {
  const [blockouts, setBlockouts] = useState<BlockoutDetail[]>([]);
  const [equipments, setEquipments] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [reasonFilter, setReasonFilter] = useState("ALL");
  const [tab, setTab] = useState<"ACTIVE" | "PAST">("ACTIVE");

  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = () => {
    Promise.all([
      fetch("/api/blockouts").then((r) => r.json()),
      fetch("/api/equipments").then((r) => r.json()),
    ])
      .then(([blkData, eqData]) => {
        if (blkData.blockouts) setBlockouts(blkData.blockouts);
        if (eqData.equipments) setEquipments(eqData.equipments);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`¿Eliminar el bloqueo "${title}"? Los equipos volverán a estar disponibles inmediatamente para los solicitantes.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/blockouts?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
      }
    } catch {}
  };

  const today = new Date().setHours(0, 0, 0, 0);

  const filteredBlockouts = useMemo(() => {
    return blockouts.filter((b) => {
      const bEnd = new Date(b.endDate).setHours(23, 59, 59, 999);
      const isPast = bEnd < today;

      if (tab === "ACTIVE" && isPast) return false;
      if (tab === "PAST" && !isPast) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          b.title.toLowerCase().includes(q) ||
          b.items.some((i) => i.equipmentName.toLowerCase().includes(q) || i.equipmentCode.toLowerCase().includes(q));
        if (!matches) return false;
      }

      if (reasonFilter !== "ALL" && b.reason !== reasonFilter) {
        return false;
      }

      return true;
    });
  }, [blockouts, search, reasonFilter, tab, today]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Bloqueos de Equipamiento
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Reservas internas de la Secretaría, eventos institucionales UNLa, mantenimiento y coberturas propias.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-200 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Bloqueo de Fechas</span>
        </button>
      </div>

      {/* Tabs y Filtros */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
            <button
              onClick={() => setTab("ACTIVE")}
              className={`px-3 py-1.5 rounded-lg transition ${
                tab === "ACTIVE" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Vigentes y Programados
            </button>
            <button
              onClick={() => setTab("PAST")}
              className={`px-3 py-1.5 rounded-lg transition ${
                tab === "PAST" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Historial Pasado
            </button>
          </div>

          <div className="flex items-center gap-2 flex-1 sm:max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por título o equipo bloqueado..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <select
              value={reasonFilter}
              onChange={(e) => setReasonFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">Todos los motivos</option>
              {Object.entries(BLOCKOUT_REASONS).map(([key, item]) => (
                <option key={key} value={key}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lista de bloqueos */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">Cargando bloqueos...</div>
      ) : filteredBlockouts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-2">
          <Lock className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-base">No hay bloqueos en esta sección</h3>
          <p className="text-xs max-w-sm mx-auto">
            Podés reservar equipos para eventos institucionales o mantenimiento con el botón superior.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBlockouts.map((blk) => {
            const reasonObj = BLOCKOUT_REASONS[blk.reason] || BLOCKOUT_REASONS.OTHER;
            const startFmt = new Date(blk.startDate).toLocaleDateString("es-AR");
            const endFmt = new Date(blk.endDate).toLocaleDateString("es-AR");

            return (
              <div
                key={blk.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-sm transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-base">{blk.title}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${reasonObj.color}`}>
                      {reasonObj.label}
                    </span>
                    {blk.isRecurring && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        Recurrente ({blk.recurringRule})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>
                      Rango bloqueado: <strong>{startFmt}</strong> al <strong>{endFmt}</strong>
                    </span>
                    <span>•</span>
                    <span>Creado por: {blk.createdByName}</span>
                  </div>

                  {blk.internalNotes && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 inline-block">
                      <strong>Nota interna:</strong> {blk.internalNotes}
                    </p>
                  )}

                  <div className="pt-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Equipos y unidades bloqueadas:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {blk.items.map((it, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-50 text-purple-800 text-xs font-semibold border border-purple-200"
                        >
                          <Lock className="w-3 h-3" />
                          <span>{it.equipmentCode} — {it.equipmentName}</span>
                          <span className="bg-purple-200 text-purple-900 px-1 py-0.2 rounded font-bold text-[10px] ml-1">
                            {it.quantityBlocked} un.
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <button
                    onClick={() => handleDelete(blk.id, blk.title)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition"
                    title="Eliminar bloqueo y liberar equipos"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar Bloqueo</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <BlockoutModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        equipments={equipments}
        onSuccess={() => fetchData()}
      />
    </div>
  );
}
