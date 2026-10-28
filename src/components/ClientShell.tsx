"use client";

import React, { useState, useEffect } from "react";
import { AuthProvider } from "@/lib/auth-context";
import { CartProvider } from "@/lib/cart-context";
import { DemoBar } from "./DemoBar";
import { Navbar } from "./Navbar";
import { CartDrawer } from "./CartDrawer";
import { LoanFormModal } from "./LoanFormModal";
import { BlockoutModal } from "./BlockoutModal";
import { EquipmentItem, KitDef } from "@/types";

export function ClientShell({ children }: { children: React.ReactNode }) {
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [isBlockoutModalOpen, setIsBlockoutModalOpen] = useState(false);
  const [equipments, setEquipments] = useState<EquipmentItem[]>([]);
  const [kits, setKits] = useState<KitDef[]>([]);

  useEffect(() => {
    fetch("/api/equipments")
      .then((res) => res.json())
      .then((data) => {
        if (data.equipments) setEquipments(data.equipments);
        if (data.kits) setKits(data.kits);
      })
      .catch(() => {});
  }, []);

  return (
    <AuthProvider>
      <CartProvider>
        <div className="min-h-screen flex flex-col bg-slate-50">
          <DemoBar />
          <Navbar onOpenBlockoutModal={() => setIsBlockoutModalOpen(true)} />

          <main className="flex-1 pb-16">{children}</main>

          <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4">
              <p className="font-semibold text-slate-700">
                Universidad Nacional de Lanús — Secretaría de Cultura y Comunicación
              </p>
              <p className="mt-1 text-slate-400">
                Sistema de Gestión de Préstamo de Equipamiento Audiovisual • 29 de Septiembre 3901, Remedios de Escalada, Bs. As.
              </p>
            </div>
          </footer>

          {/* Drawer y Modales Globales */}
          <CartDrawer onProceedToForm={() => setIsLoanModalOpen(true)} />
          <LoanFormModal
            isOpen={isLoanModalOpen}
            onClose={() => setIsLoanModalOpen(false)}
          />
          <BlockoutModal
            isOpen={isBlockoutModalOpen}
            onClose={() => setIsBlockoutModalOpen(false)}
            equipments={equipments}
            kits={kits}
            onSuccess={() => {
              window.dispatchEvent(new Event("blockout_updated"));
            }}
          />
        </div>
      </CartProvider>
    </AuthProvider>
  );
}
