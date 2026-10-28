"use client";

import React, { useState } from "react";
import Link from "next/navigation";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import {
  Camera,
  Calendar,
  ClipboardList,
  Layers,
  Search,
  ShoppingCart,
  Lock,
  BarChart3,
  Menu,
  X,
  FileCheck2,
  PlusCircle,
  Plus,
} from "lucide-react";

export function Navbar({ onOpenBlockoutModal }: { onOpenBlockoutModal?: () => void }) {
  const pathname = usePathname();
  const { currentUser, isAdmin } = useAuth();
  const { totalItemsCount, setIsOpen } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const solicitanteLinks = [
    { href: "/", label: "Catálogo", icon: Camera },
    { href: "/mis-pedidos", label: "Mis Pedidos", icon: ClipboardList },
    { href: "/consultar", label: "Consultar Código", icon: Search },
  ];

  const adminLinks = [
    { href: "/admin", label: "Panel de Hoy", icon: Layers },
    { href: "/admin/pedidos", label: "Pedidos", icon: ClipboardList },
    { href: "/admin/calendario", label: "Calendario", icon: Calendar },
    { href: "/admin/inventario", label: "Inventario", icon: Camera },
    { href: "/admin/bloqueos", label: "Bloqueos", icon: Lock },
    { href: "/admin/reportes", label: "Reportes", icon: BarChart3 },
  ];

  const links = isAdmin ? adminLinks : solicitanteLinks;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo y Nombre Institucional */}
          <a href={isAdmin ? "/admin" : "/"} className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-700 to-indigo-900 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-200">
              <Camera className="w-5 h-5 text-indigo-100 group-hover:scale-105 transition-transform" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">
                  UNLa <span className="text-indigo-600 font-semibold">Audiovisual</span>
                </span>
                {isAdmin && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Administración
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Secretaría de Cultura y Comunicación
              </p>
            </div>
          </a>

          {/* Links de navegación escritorio */}
          <nav className="hidden md:flex items-center gap-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                  {link.label}
                </a>
              );
            })}
          </nav>

          {/* Acciones derecha */}
          <div className="flex items-center gap-2.5">
            {isAdmin && onOpenBlockoutModal && (
              <button
                onClick={onOpenBlockoutModal}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Bloquear Fechas</span>
              </button>
            )}

            {!isAdmin && (
              <button
                onClick={() => setIsOpen(true)}
                className="relative flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs sm:text-sm shadow-sm transition"
              >
                <ShoppingCart className="w-4 h-4" />
                <span className="hidden sm:inline">Mi Pedido</span>
                {totalItemsCount > 0 && (
                  <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold bg-white text-indigo-700 rounded-full">
                    {totalItemsCount}
                  </span>
                )}
              </button>
            )}

            {/* Botón menú móvil */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 md:hidden"
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menú desplegable móvil */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700 font-semibold"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                {link.label}
              </a>
            );
          })}

          {isAdmin && onOpenBlockoutModal && (
            <div className="pt-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenBlockoutModal();
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold bg-indigo-600 text-white shadow-sm"
              >
                <Lock className="w-4 h-4" />
                Bloquear Fechas
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
