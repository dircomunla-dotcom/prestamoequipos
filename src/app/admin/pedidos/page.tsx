"use client";

import React, { useState, useEffect, useMemo } from "react";
import { LoanRequestDetail, EquipmentItem, LoanStatus } from "@/types";
import { STATUS_CONFIG } from "@/lib/config";
import { LoanDetailModal } from "@/components/LoanDetailModal";
import { ChecklistModal } from "@/components/ChecklistModal";
import {
  Search,
  Filter,
  Download,
  AlertTriangle,
  Eye,
  CheckCircle,
  Truck,
  RotateCcw,
  FileText,
  Calendar,
} from "lucide-react";

export default function AdminPedidosPage() {
  const [loans, setLoans] = useState<LoanRequestDetail[]>([]);
  const [equipments, setEquipments] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [deptFilter, setDeptFilter] = useState<string>("ALL");

  const [selectedLoan, setSelectedLoan] = useState<LoanRequestDetail | null>(null);
  const [checklistModal, setChecklistModal] = useState<{
    isOpen: boolean;
    loan: LoanRequestDetail | null;
    type: "PICKUP" | "RETURN";
  }>({ isOpen: false, loan: null, type: "PICKUP" });

  const fetchData = () => {
    Promise.all([
      fetch("/api/loans").then((r) => r.json()),
      fetch("/api/equipments").then((r) => r.json()),
    ])
      .then(([loansData, eqData]) => {
        if (loansData.loans) setLoans(loansData.loans);
        if (eqData.equipments) setEquipments(eqData.equipments);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const departments = useMemo(() => {
    const set = new Set<string>();
    loans.forEach((l) => set.add(l.departmentName));
    return Array.from(set);
  }, [loans]);

  const filteredLoans = useMemo(() => {
    return loans.filter((l) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          l.code.toLowerCase().includes(q) ||
          l.userName.toLowerCase().includes(q) ||
          l.applicantDni.toLowerCase().includes(q) ||
          l.projectName.toLowerCase().includes(q) ||
          l.items.some((i) => i.equipmentName?.toLowerCase().includes(q) || i.equipmentCode?.toLowerCase().includes(q));
        if (!matches) return false;
      }

      if (statusFilter !== "ALL" && l.status !== statusFilter) {
        return false;
      }

      if (deptFilter !== "ALL" && l.departmentName !== deptFilter) {
        return false;
      }

      return true;
    });
  }, [loans, search, statusFilter, deptFilter]);

  // Exportar a CSV
  const handleExportCSV = () => {
    const headers = [
      "Codigo",
      "Estado",
      "Solicitante",
      "DNI",
      "Email",
      "Espacio",
      "Fecha_Inicio",
      "Fecha_Fin",
      "Proyecto",
      "Equipos",
    ];
    const rows = filteredLoans.map((l) => [
      l.code,
      l.status,
      `"${l.userName}"`,
      l.applicantDni,
      l.userEmail,
      `"${l.departmentName}"`,
      new Date(l.startDate).toLocaleDateString("es-AR"),
      new Date(l.endDate).toLocaleDateString("es-AR"),
      `"${l.projectName.replace(/"/g, '""')}"`,
      `"${l.items.map((i) => `${i.equipmentCode} (x${i.quantityApproved})`).join("; ")}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `prestamos_unla_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Gestión Integral de Pedidos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Listado completo de solicitudes, aprobación, control de entregas, actas y exportación.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition"
        >
          <Download className="w-4 h-4" />
          <span>Exportar a CSV</span>
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por código, solicitante, proyecto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">Todos los estados</option>
            <option value="PENDING">Pendientes</option>
            <option value="APPROVED">Aprobados</option>
            <option value="IN_LOAN">En préstamo</option>
            <option value="RETURNED">Devueltos</option>
            <option value="RETURNED_OBSERVED">Devueltos con obs.</option>
            <option value="OVERDUE">Atrasados</option>
            <option value="REJECTED">Rechazados</option>
            <option value="CANCELLED">Cancelados</option>
          </select>
        </div>

        <div>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">Todos los espacios UNLa</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla de Pedidos */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm">Cargando pedidos...</div>
        ) : filteredLoans.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">No se encontraron pedidos con los filtros aplicados.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-4">Código</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4">Solicitante</th>
                  <th className="py-3.5 px-4">Espacio UNLa</th>
                  <th className="py-3.5 px-4">Fechas de Préstamo</th>
                  <th className="py-3.5 px-4">Equipos</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredLoans.map((loan) => {
                  const statusInfo = STATUS_CONFIG[loan.status] || STATUS_CONFIG.PENDING;
                  return (
                    <tr key={loan.id} className="hover:bg-slate-50/80 transition group">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                        {loan.code}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.badgeClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotClass}`} />
                          {statusInfo.label}
                        </span>
                        {loan.hasBlockoutConflict && loan.status === "PENDING" && (
                          <span className="block mt-1 text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            ⚠ Choca con Bloqueo
                          </span>
                        )}
                        {loan.wasModifiedByApplicant && (
                          <span
                            className="block mt-1 text-[9px] font-bold text-sky-800 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200 cursor-help"
                            title={loan.lastModificationSummary || "Modificado por el solicitante"}
                          >
                            ℹ Modificado
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900 block">{loan.userName}</span>
                        <span className="text-[11px] text-slate-400">DNI {loan.applicantDni}</span>
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-slate-600">
                        {loan.departmentName}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                        {new Date(loan.startDate).toLocaleDateString("es-AR")} al{" "}
                        {new Date(loan.endDate).toLocaleDateString("es-AR")}
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-slate-500">
                        {loan.items.map((i) => `${i.equipmentCode} (x${i.quantityApproved})`).join(", ")}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => setSelectedLoan(loan)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                            title="Ver detalles"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {loan.status === "APPROVED" && (
                            <button
                              onClick={() => setChecklistModal({ isOpen: true, loan, type: "PICKUP" })}
                              className="px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] transition"
                            >
                              Entregar
                            </button>
                          )}

                          {(loan.status === "IN_LOAN" || loan.status === "OVERDUE") && (
                            <button
                              onClick={() => setChecklistModal({ isOpen: true, loan, type: "RETURN" })}
                              className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition"
                            >
                              Devolver
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedLoan && (
        <LoanDetailModal
          isOpen={!!selectedLoan}
          onClose={() => setSelectedLoan(null)}
          loan={selectedLoan}
          equipments={equipments}
          onOpenChecklist={(type) => {
            setChecklistModal({ isOpen: true, loan: selectedLoan, type });
          }}
          onRefresh={() => {
            fetchData();
            setSelectedLoan(null);
          }}
        />
      )}

      {checklistModal.isOpen && checklistModal.loan && (
        <ChecklistModal
          isOpen={checklistModal.isOpen}
          onClose={() => setChecklistModal({ isOpen: false, loan: null, type: "PICKUP" })}
          loan={checklistModal.loan}
          equipments={equipments}
          type={checklistModal.type}
          onSuccess={() => fetchData()}
        />
      )}
    </div>
  );
}
