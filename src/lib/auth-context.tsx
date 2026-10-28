"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { DemoUser, UserRole } from "@/types";
import { DEMO_USERS } from "./seed-data";

interface AuthContextType {
  currentUser: DemoUser;
  setCurrentUser: (user: DemoUser) => void;
  switchRole: (role: UserRole) => void;
  availableUsers: DemoUser[];
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isSolicitante: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<DemoUser>(DEMO_USERS[0]); // Solicitante por defecto
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("unla_prestamos_active_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const match = DEMO_USERS.find((u) => u.id === parsed.id);
        if (match) setCurrentUser(match);
      } catch {
        // Ignorar error de parsing
      }
    }
  }, []);

  const handleSetUser = (user: DemoUser) => {
    setCurrentUser(user);
    if (typeof window !== "undefined") {
      localStorage.setItem("unla_prestamos_active_user", JSON.stringify(user));
    }
  };

  const switchRole = (role: UserRole) => {
    const target = DEMO_USERS.find((u) => u.role === role) || DEMO_USERS[0];
    handleSetUser(target);
  };

  const isAdmin = currentUser.role === "ADMIN" || currentUser.role === "SUPERADMIN";
  const isSuperAdmin = currentUser.role === "SUPERADMIN";
  const isSolicitante = currentUser.role === "SOLICITANTE";

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser: handleSetUser,
        switchRole,
        availableUsers: DEMO_USERS,
        isAdmin,
        isSuperAdmin,
        isSolicitante,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
}
