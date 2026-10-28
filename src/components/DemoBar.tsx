"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { UserRole } from "@/types";
import { Shield, User, RotateCcw, Check, Sparkles } from "lucide-react";

export function DemoBar() {
  const { currentUser, switchRole, availableUsers } = useAuth();
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleReset = async () => {
    if (!confirm("¿Desea restablecer todos los pedidos, equipos y bloqueos al estado inicial de demostración?")) {
      return;
    }
    setResetting(true);
    try {
      const res = await fetch("/api/reset", { method: "POST" });
      if (res.ok) {
        setMessage("Datos restablecidos con éxito");
        setTimeout(() => {
          window.location.reload();
        }, 800);
      }
    } catch {
      setMessage("Error al restablecer");
    } finally {
      setResetting(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="bg-slate-900 text-slate-200 text-xs py-1.5 px-4 border-b border-slate-800 transition-all">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-medium">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            Modo Demostración UNLa
          </span>
          <span className="hidden sm:inline text-slate-400">
            Usuario actual: <strong className="text-white font-medium">{currentUser.name}</strong> ({currentUser.affiliation} — {currentUser.departmentName?.split(" ")[0]}...)
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-400 hidden md:inline">Cambiar rol:</span>
          <div className="inline-flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
            <button
              onClick={() => switchRole("SOLICITANTE")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                currentUser.role === "SOLICITANTE"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              <User className="w-3 h-3" />
              Solicitante
            </button>
            <button
              onClick={() => switchRole("ADMIN")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                currentUser.role === "ADMIN"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              <Shield className="w-3 h-3" />
              Administrador
            </button>
            <button
              onClick={() => switchRole("SUPERADMIN")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                currentUser.role === "SUPERADMIN"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              <Shield className="w-3 h-3 text-amber-400" />
              Superadmin
            </button>
          </div>

          <button
            onClick={handleReset}
            disabled={resetting}
            title="Restablece los 30 equipos, 10 préstamos y bloqueos de ejemplo"
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700 transition"
          >
            <RotateCcw className={`w-3 h-3 ${resetting ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Reiniciar datos</span>
          </button>

          {message && (
            <span className="text-emerald-400 font-medium text-xs flex items-center gap-1 animate-fade-in">
              <Check className="w-3 h-3" /> {message}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
