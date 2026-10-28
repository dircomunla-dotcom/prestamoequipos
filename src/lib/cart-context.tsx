"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { EquipmentItem, KitDef } from "@/types";

export interface CartItem {
  equipment: EquipmentItem;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  startDate: string;
  endDate: string;
  setDateRange: (start: string, end: string) => void;
  addItem: (equipment: EquipmentItem, quantity?: number) => void;
  removeItem: (equipmentId: string) => void;
  updateQuantity: (equipmentId: string, quantity: number) => void;
  addKit: (kit: KitDef, allEquipments: EquipmentItem[]) => void;
  clearCart: () => void;
  totalItemsCount: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Fechas por defecto: dentro de 3 días hasta 5 días (respetando las 48hs de anticipación)
function getDefaultDates() {
  const start = new Date();
  start.setDate(start.getDate() + 3);
  start.setHours(10, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 2);
  end.setHours(16, 0, 0, 0);

  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const defaults = getDefaultDates();
  const [startDate, setStartDate] = useState<string>(defaults.start);
  const [endDate, setEndDate] = useState<string>(defaults.end);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("unla_prestamos_cart");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setItems(parsed);
      } catch {}
    }
    const savedDates = sessionStorage.getItem("unla_prestamos_dates");
    if (savedDates) {
      try {
        const parsedDates = JSON.parse(savedDates);
        if (parsedDates.start) setStartDate(parsedDates.start);
        if (parsedDates.end) setEndDate(parsedDates.end);
      } catch {}
    }
  }, []);

  const saveItems = (newItems: CartItem[]) => {
    setItems(newItems);
    if (typeof window !== "undefined") {
      localStorage.setItem("unla_prestamos_cart", JSON.stringify(newItems));
    }
  };

  const addItem = (equipment: EquipmentItem, quantity = 1) => {
    const existing = items.find((i) => i.equipment.id === equipment.id);
    if (existing) {
      const maxUnits = equipment.totalUnits || 1;
      const newQty = Math.min(existing.quantity + quantity, maxUnits);
      updateQuantity(equipment.id, newQty);
    } else {
      saveItems([...items, { equipment, quantity: Math.min(quantity, equipment.totalUnits || 1) }]);
    }
    setIsOpen(true);
  };

  const removeItem = (equipmentId: string) => {
    saveItems(items.filter((i) => i.equipment.id !== equipmentId));
  };

  const updateQuantity = (equipmentId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(equipmentId);
      return;
    }
    saveItems(
      items.map((i) =>
        i.equipment.id === equipmentId
          ? { ...i, quantity: Math.min(quantity, i.equipment.totalUnits || 1) }
          : i
      )
    );
  };

  const addKit = (kit: KitDef, allEquipments: EquipmentItem[]) => {
    const updated = [...items];
    for (const kitItem of kit.items) {
      const eq = allEquipments.find((e) => e.id === kitItem.equipmentId || e.code === kitItem.equipmentId);
      if (!eq) continue;

      const idx = updated.findIndex((i) => i.equipment.id === eq.id);
      if (idx !== -1) {
        updated[idx].quantity = Math.min(updated[idx].quantity + kitItem.quantity, eq.totalUnits);
      } else {
        updated.push({
          equipment: eq,
          quantity: Math.min(kitItem.quantity, eq.totalUnits),
        });
      }
    }
    saveItems(updated);
    setIsOpen(true);
  };

  const clearCart = () => {
    saveItems([]);
  };

  const setDateRange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "unla_prestamos_dates",
        JSON.stringify({ start, end })
      );
    }
  };

  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        startDate,
        endDate,
        setDateRange,
        addItem,
        removeItem,
        updateQuantity,
        addKit,
        clearCart,
        totalItemsCount,
        isOpen,
        setIsOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart debe usarse dentro de un CartProvider");
  }
  return context;
}
