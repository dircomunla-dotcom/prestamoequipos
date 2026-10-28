export const APP_CONFIG = {
  institution: "Universidad Nacional de Lanús (UNLa)",
  secretaria: "Secretaría de Cultura y Comunicación",
  shortTitle: "Préstamos Audiovisual UNLa",
  fullTitle: "Sistema de Gestión de Préstamo de Equipamiento Audiovisual",
  logoUrl: "/unla-logo.svg",
  accentColor: "#4F46E5", // Indigo / Violeta institucional
  accentColorDark: "#3730A3",
  allowedDomain: process.env.ALLOWED_GOOGLE_DOMAIN || "unla.edu.ar",
  timezone: "America/Argentina/Buenos_Aires",
  
  // Reglas de negocio por defecto (configurables)
  bufferDays: 1, // Margen de revisión / carga de baterías entre préstamos
  maxLoanDays: 7, // Duración máxima del préstamo
  minNoticeHours: 48, // Anticipación mínima (48 hs)
  maxNoticeDays: 60, // Anticipación máxima (60 días)
  
  // Horarios de atención para retiro y devolución
  businessHours: {
    start: "10:00",
    end: "17:00",
    days: [1, 2, 3, 4, 5], // Lunes a Viernes
    daysText: "Lunes a Viernes de 10:00 a 17:00 hs",
  },
  
  // Términos y condiciones por defecto
  termsAndConditions: `TÉRMINOS Y CONDICIONES DE PRÉSTAMO DE EQUIPAMIENTO AUDIOVISUAL
SECRETARÍA DE CULTURA Y COMUNICACIÓN - UNLa

1. El equipamiento prestado es propiedad exclusiva de la Universidad Nacional de Lanús y debe destinarse únicamente al proyecto o actividad académica/institucional declarada en esta solicitud.
2. La persona solicitante y el responsable que avala se comprometen a custodiar, operar con diligencia técnica y reintegrar la totalidad de los equipos y accesorios en la fecha y horario convenidos.
3. En caso de pérdida, extravío, rotura por mal uso o falta de accesorios, el solicitante y su espacio institucional asumen la obligación de reponer el equipo o costear íntegramente su reparación técnica según el valor de reposición tasado.
4. Los retiros y devoluciones se realizan exclusivamente dentro del horario de atención de la Secretaría (Lunes a Viernes de 10:00 a 17:00 hs) mediando verificación técnica presencial del checklist.
5. El atraso no justificado inhabilita al solicitante a efectuar nuevas reservas en el sistema hasta su regularización administrativa.`,
};

export const AFFILIATION_LABELS: Record<string, string> = {
  DOCENTE: "Docente",
  NODOCENTE: "Nodocente",
  ESTUDIANTE: "Estudiante",
  GRADUADO: "Graduado / Graduada",
  AUTORIDAD: "Autoridad",
  OTRO: "Otro vínculo institucional",
};

export const USAGE_TYPES = [
  "Registro de evento institucional",
  "Entrevista / Testimonial",
  "Producción audiovisual / Rodaje",
  "Transmisión en vivo / Streaming",
  "Clase / Práctica docente",
  "Investigación / Proyecto de extensión",
  "Radio / Contenido sonoro",
  "Otro",
];

export const BLOCKOUT_REASONS: Record<string, { label: string; description: string; color: string }> = {
  SECRETARIA_INTERNAL: {
    label: "Uso interno de la Secretaría",
    description: "Coberturas y producciones propias de Cultura y Comunicación",
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  INSTITUTIONAL_EVENT: {
    label: "Evento institucional",
    description: "Actos oficiales, colaciones y congresos UNLa",
    color: "bg-blue-50 text-blue-700 border-blue-200",
  },
  SCHEDULED_MAINTENANCE: {
    label: "Mantenimiento programado",
    description: "Limpieza técnica, calibración y service preventivo",
    color: "bg-amber-50 text-amber-700 border-amber-200",
  },
  REPAIR: {
    label: "Reparación técnica",
    description: "Equipo en taller o con falla reportada",
    color: "bg-rose-50 text-rose-700 border-rose-200",
  },
  AUTHORITY_RESERVED: {
    label: "Reservado para autoridad",
    description: "Reserva prioritaria para Rectorado / Vicerrectorado",
    color: "bg-purple-50 text-purple-700 border-purple-200",
  },
  EXTERNAL_LOAN: {
    label: "Préstamo externo al sistema",
    description: "Convenios especiales o cesión temporal externa",
    color: "bg-cyan-50 text-cyan-700 border-cyan-200",
  },
  OTHER: {
    label: "Otro motivo",
    description: "Bloqueo por motivo especial consignado en notas",
    color: "bg-slate-50 text-slate-700 border-slate-200",
  },
};

export const STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string; dotClass: string; description: string }
> = {
  PENDING: {
    label: "Pendiente",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
    dotClass: "bg-amber-500",
    description: "Esperando revisión y aprobación por la Secretaría",
  },
  APPROVED: {
    label: "Aprobado",
    badgeClass: "bg-blue-50 text-blue-800 border-blue-200",
    dotClass: "bg-blue-500",
    description: "Aprobado. Listo para ser retirado en la fecha pactada",
  },
  IN_LOAN: {
    label: "En préstamo",
    badgeClass: "bg-indigo-50 text-indigo-800 border-indigo-200",
    dotClass: "bg-indigo-500",
    description: "Equipamiento retirado y en uso",
  },
  RETURNED: {
    label: "Devuelto",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
    dotClass: "bg-emerald-500",
    description: "Equipamiento reintegrado en conformidad",
  },
  RETURNED_OBSERVED: {
    label: "Devuelto con obs.",
    badgeClass: "bg-orange-50 text-orange-800 border-orange-200",
    dotClass: "bg-orange-500",
    description: "Devuelto con faltantes o detalles anotados",
  },
  REJECTED: {
    label: "Rechazado",
    badgeClass: "bg-rose-50 text-rose-800 border-rose-200",
    dotClass: "bg-rose-500",
    description: "Solicitud no aprobada",
  },
  CANCELLED: {
    label: "Cancelado",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
    dotClass: "bg-slate-400",
    description: "Cancelado por el solicitante o administración",
  },
  OVERDUE: {
    label: "Atrasado",
    badgeClass: "bg-red-100 text-red-900 border-red-300 font-semibold animate-pulse",
    dotClass: "bg-red-600",
    description: "Fecha de devolución vencida sin registro de entrega",
  },
};
