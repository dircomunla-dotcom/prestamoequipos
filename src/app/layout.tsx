import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClientShell } from "@/components/ClientShell";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Préstamo de Equipamiento Audiovisual — UNLa",
  description:
    "Sistema de Gestión de Préstamo de Equipamiento Audiovisual de la Secretaría de Cultura y Comunicación de la Universidad Nacional de Lanús (UNLa).",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-AR" className="h-full" suppressHydrationWarning>
      <head>
        <script src="/tailwind.js" />
      </head>
      <body
        className={`${inter.className} min-h-full bg-slate-50 text-slate-900`}
        suppressHydrationWarning
      >
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
