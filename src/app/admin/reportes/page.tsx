"use client";

import React, { useState, useEffect, useMemo } from "react";
import { LoanRequestDetail, EquipmentItem, BlockoutDetail } from "@/types";
import { BLOCKOUT_REASONS } from "@/lib/config";
import {
  BarChart3,
  Download,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Clock,
  Layers,
  Building2,
  Lock,
} from "lucide-react";

export default function AdminReportesPage() {
  const [loans, setLoans] = useState<LoanRequestDetail[]>([]);
  const [equipments, setEquipments] = useState<EquipmentItem[]>([]);
  const [blockouts, setBlockouts] = useState<BlockoutDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/loans").then((r) => r.json()),
      fetch("/api/equipments").then((r) => r.json()),
      fetch("/api/blockouts").then((r) => r.json()),
    ])
      .then(([loansData, eqData, blkData]) => {
        if (loansData.loans) setLoans(loansData.loans);
        if (eqData.equipments) setEquipments(eqData.equipments);
        if (blkData.blockouts) setBlockouts(blkData.blockouts);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // 1. Equipos más solicitados
  const topEquipments = useMemo(() => {
    const counts: Record<string, { count: number; name: string; code: string }> = {};
    loans.forEach((l) => {
      l.items.forEach((it) => {
        const id = it.equipmentId;
        if (!counts[id]) {
          counts[id] = {
            count: 0,
            name: it.equipmentName || id,
            code: it.equipmentCode || "EQ",
          };
        }
        counts[id].count += it.quantityApproved;
      });
    });

    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 7);
  }, [loans]);

  // 2. Pedidos por Departamento/Espacio UNLa
  const departmentStats = useMemo(() => {
    const counts: Record<string, number> = {};
    loans.forEach((l) => {
      counts[l.departmentName] = (counts[l.departmentName] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [loans]);

  // 3. Tasa de atrasos y cumplimiento
  const totalCompleted = loans.filter((l) =>
    ["RETURNED", "RETURNED_OBSERVED", "OVERDUE"].includes(l.status)
  ).length;
  const overdueCount = loans.filter((l) => l.status === "OVERDUE").length;
  const overdueRate = totalCompleted > 0 ? Math.round((overdueCount / totalCompleted) * 100) : 0;
  const complianceRate = 100 - overdueRate;

  // 4. Bloqueos por motivo
  const blockoutReasonStats = useMemo(() => {
    const counts: Record<string, number> = {};
    blockouts.forEach((b) => {
      const reasonKey = b.reason;
      counts[reasonKey] = (counts[reasonKey] || 0) + 1;
    });
    return Object.entries(counts);
  }, [blockouts]);

  // Exportar métricas a CSV
  const handleExportMetrics = () => {
    const rows = [
      ["METRICAS GENERALES DE GESTION AUDIOVISUAL UNLa"],
      ["Total de pedidos historicos", loans.length],
      ["Pedidos en cumplimiento", complianceRate + "%"],
      ["Tasa de atrasos", overdueRate + "%"],
      ["Total de bloqueos institucionales", blockouts.length],
      [],
      ["RANKING DE EQUIPOS MAS SOLICITADOS"],
      ["Codigo", "Nombre", "Cantidad_Prestamos"],
      ...topEquipments.map((e) => [e.code, `"${e.name}"`, e.count]),
      [],
      ["DEMANDA POR ESPACIO INSTITUCIONAL UNLa"],
      ["Espacio_UNLa", "Total_Pedidos"],
      ...departmentStats.map(([name, count]) => [`"${name}"`, count]),
    ];

    const csvContent = "data:text/csv;charset=utf-8," + rows.map((r) => r.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reporte_metricas_unla_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Reportes e Indicadores de Gestión
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Métricas de demanda, cumplimiento, atrasos y bloqueos institucionales de la Secretaría.
          </p>
        </div>

        <button
          onClick={handleExportMetrics}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition"
        >
          <Download className="w-4 h-4" />
          <span>Exportar Informe (CSV)</span>
        </button>
      </div>

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs text-slate-500 font-medium">Total de Solicitudes</span>
          <p className="text-2xl font-extrabold text-slate-900">{loans.length}</p>
          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Registradas en el sistema
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs text-slate-500 font-medium">Tasa de Cumplimiento</span>
          <p className="text-2xl font-extrabold text-emerald-600">{complianceRate}%</p>
          <span className="text-[11px] text-slate-400">Devoluciones en término pactado</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs text-slate-500 font-medium">Tasa de Atrasos</span>
          <p className="text-2xl font-extrabold text-red-600">{overdueRate}%</p>
          <span className="text-[11px] text-slate-400">Requiere regularización administrativa</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs text-slate-500 font-medium">Bloqueos Institucionales</span>
          <p className="text-2xl font-extrabold text-purple-600">{blockouts.length}</p>
          <span className="text-[11px] text-slate-400">Reservas y mantenimiento vigentes</span>
        </div>
      </div>

      {/* Gráficos / Tablas de Distribución */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ranking de Equipos Más Solicitados */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Equipos Audiovisuales Más Solicitados
            </h3>
          </div>

          <div className="space-y-3">
            {topEquipments.map((eq, idx) => {
              const max = topEquipments[0]?.count || 1;
              const percentage = Math.round((eq.count / max) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-800">
                    <span className="truncate max-w-[280px]">
                      <strong className="text-indigo-600 mr-1.5 font-mono">{eq.code}</strong>
                      {eq.name}
                    </span>
                    <span className="text-indigo-700">{eq.count} préstamos</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Demanda por Espacio / Departamento UNLa */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Pedidos por Espacio / Departamento UNLa
            </h3>
          </div>

          <div className="space-y-3">
            {departmentStats.map(([name, count], idx) => {
              const max = departmentStats[0]?.[1] || 1;
              const percentage = Math.round((count / max) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-800">
                    <span className="truncate max-w-[280px]">{name}</span>
                    <span className="text-slate-600">{count} pedidos</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bloqueos por Motivo */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-purple-600" />
          <h3 className="font-bold text-slate-900 text-sm sm:text-base">
            Distribución de Bloqueos por Motivo Institucional
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {blockoutReasonStats.map(([reasonKey, count]) => {
            const reasonObj = BLOCKOUT_REASONS[reasonKey] || BLOCKOUT_REASONS.OTHER;
            return (
              <div key={reasonKey} className={`p-4 rounded-xl border ${reasonObj.color} space-y-1`}>
                <span className="font-bold text-xs block">{reasonObj.label}</span>
                <p className="text-2xl font-black">{count}</p>
                <p className="text-[11px] opacity-80">{reasonObj.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
