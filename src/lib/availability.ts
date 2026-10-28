import { APP_CONFIG } from "./config";
import { AvailabilityItemResult, ConflictLoan, EquipmentItem, LoanStatus, BlockoutReason } from "@/types";

export interface LoanCollisionCheckItem {
  equipmentId: string;
  quantityRequested: number;
}

export interface SimplifiedLoan {
  id: string;
  code: string;
  applicantName: string;
  departmentName: string;
  startDate: string | Date;
  endDate: string | Date;
  status: LoanStatus;
  items: { equipmentId: string; quantity: number }[];
}

export interface SimplifiedBlockout {
  id: string;
  title: string;
  reason: BlockoutReason | string;
  startDate: string | Date;
  endDate: string | Date;
  isRecurring?: boolean;
  recurringRule?: string | null;
  items: { equipmentId: string; quantityBlocked: number }[];
}

/**
 * Normaliza una fecha a medianoche para comparación precisa de días
 */
export function normalizeDate(date: string | Date): Date {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

/**
 * Añade días a una fecha
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Comprueba si dos rangos de fechas se superponen, considerando el margen de seguridad
 */
export function rangesOverlapWithBuffer(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date,
  bufferDays: number = APP_CONFIG.bufferDays
): boolean {
  // Expandimos el préstamo B con el margen de revisión/carga
  const expandedEndB = addDays(endB, bufferDays);
  const expandedEndA = addDays(endA, bufferDays);

  return startA <= expandedEndB && endA >= startB;
}

/**
 * Comprueba si una fecha puntual cae en un día de semana para bloqueos recurrentes
 * Ej regla: "TUESDAYS" o "TUESDAYS_10_14" (martes = día 2)
 */
export function matchesRecurringRule(date: Date, rule?: string | null): boolean {
  if (!rule) return false;
  const dayOfWeek = date.getDay(); // 0 domingo, 2 martes
  if (rule.toUpperCase().includes("TUESDAY") && dayOfWeek === 2) return true;
  if (rule.toUpperCase().includes("MONDAY") && dayOfWeek === 1) return true;
  if (rule.toUpperCase().includes("WEDNESDAY") && dayOfWeek === 3) return true;
  if (rule.toUpperCase().includes("THURSDAY") && dayOfWeek === 4) return true;
  if (rule.toUpperCase().includes("FRIDAY") && dayOfWeek === 5) return true;
  return false;
}

/**
 * SERVICIO CENTRALIZADO DE DISPONIBILIDAD (checkAvailability)
 * Calcula la disponibilidad de uno o varios equipos en un rango de fechas,
 * considerando stock total, préstamos activos, margen de seguridad,
 * bloqueos de la secretaría y estados técnicos.
 */
export function checkAvailability(params: {
  equipmentList: EquipmentItem[];
  startDate: string | Date;
  endDate: string | Date;
  activeLoans: SimplifiedLoan[];
  blockouts: SimplifiedBlockout[];
  userAffiliation?: string;
  bufferDays?: number;
}): Record<string, AvailabilityItemResult> {
  const {
    equipmentList,
    startDate,
    endDate,
    activeLoans,
    blockouts,
    userAffiliation,
    bufferDays = APP_CONFIG.bufferDays,
  } = params;

  const reqStart = normalizeDate(startDate);
  const reqEnd = normalizeDate(endDate);

  const results: Record<string, AvailabilityItemResult> = {};

  for (const eq of equipmentList) {
    // 1. Estado técnico no operativo
    if (eq.status === "MAINTENANCE") {
      results[eq.id] = {
        equipmentId: eq.id,
        totalUnits: eq.totalUnits,
        availableUnits: 0,
        isAvailable: false,
        reason: "Equipo en mantenimiento técnico programado",
      };
      continue;
    }

    if (eq.status === "OUT_OF_SERVICE") {
      results[eq.id] = {
        equipmentId: eq.id,
        totalUnits: eq.totalUnits,
        availableUnits: 0,
        isAvailable: false,
        reason: "Equipo fuera de servicio temporalmente",
      };
      continue;
    }

    // 2. Restricción de rol (solo docentes/nodocentes)
    if (eq.staffOnly && userAffiliation === "ESTUDIANTE") {
      results[eq.id] = {
        equipmentId: eq.id,
        totalUnits: eq.totalUnits,
        availableUnits: 0,
        isAvailable: false,
        reason: "Equipo reservado exclusivamente para docentes y nodocentes de la UNLa",
      };
      continue;
    }

    // 3. Unidades ocupadas por préstamos aprobados, en curso o atrasados
    let occupiedByLoans = 0;
    for (const loan of activeLoans) {
      if (!["APPROVED", "IN_LOAN", "OVERDUE"].includes(loan.status)) {
        continue;
      }

      const lStart = normalizeDate(loan.startDate);
      const lEnd = normalizeDate(loan.endDate);

      // Verificamos si se solapan considerando el margen de seguridad
      if (rangesOverlapWithBuffer(reqStart, reqEnd, lStart, lEnd, bufferDays)) {
        const item = loan.items.find((i) => i.equipmentId === eq.id);
        if (item) {
          occupiedByLoans += item.quantity;
        }
      }
    }

    // 4. Unidades bloqueadas por la Secretaría
    let occupiedByBlockouts = 0;
    let blockoutReason: string | undefined;

    for (const blk of blockouts) {
      const bStart = normalizeDate(blk.startDate);
      const bEnd = normalizeDate(blk.endDate);

      let overlaps = false;

      if (blk.isRecurring && blk.recurringRule) {
        // Para bloqueos recurrentes, comprobar si algún día del rango solicitado coincide
        let curr = new Date(reqStart);
        while (curr <= reqEnd) {
          if (curr >= bStart && curr <= bEnd && matchesRecurringRule(curr, blk.recurringRule)) {
            overlaps = true;
            break;
          }
          curr = addDays(curr, 1);
        }
      } else {
        // Bloqueo estándar por rango
        overlaps = rangesOverlapWithBuffer(reqStart, reqEnd, bStart, bEnd, 0);
      }

      if (overlaps) {
        const blkItem = blk.items.find((i) => i.equipmentId === eq.id);
        if (blkItem) {
          occupiedByBlockouts += blkItem.quantityBlocked;
          blockoutReason = blk.title || "Bloqueo institucional de la Secretaría";
        }
      }
    }

    // 5. Cálculo neto
    const totalOccupied = occupiedByLoans + occupiedByBlockouts;
    const availableUnits = Math.max(0, eq.totalUnits - totalOccupied);
    const isAvailable = availableUnits > 0;

    let reason: string | undefined;
    if (!isAvailable) {
      if (occupiedByBlockouts > 0) {
        reason = "No disponible para estas fechas (reserva institucional)";
      } else if (occupiedByLoans > 0) {
        reason = "Ocupado por otros préstamos en estas fechas";
      } else {
        reason = "Sin unidades disponibles";
      }
    }

    results[eq.id] = {
      equipmentId: eq.id,
      totalUnits: eq.totalUnits,
      availableUnits,
      isAvailable,
      reason,
    };
  }

  return results;
}

/**
 * Detecta si la creación de un nuevo bloqueo choca con pedidos APROBADOS o EN PRÉSTAMO.
 * Regla de negocio crítica: nunca pisar préstamos en silencio, devolver la lista detallada de afectados.
 */
export function detectBlockoutConflicts(params: {
  equipmentIds: string[];
  blockoutStart: string | Date;
  blockoutEnd: string | Date;
  existingLoans: SimplifiedLoan[];
}): ConflictLoan[] {
  const { equipmentIds, blockoutStart, blockoutEnd, existingLoans } = params;
  const bStart = normalizeDate(blockoutStart);
  const bEnd = normalizeDate(blockoutEnd);

  const conflicts: ConflictLoan[] = [];

  for (const loan of existingLoans) {
    if (!["APPROVED", "IN_LOAN"].includes(loan.status)) {
      continue;
    }

    const lStart = normalizeDate(loan.startDate);
    const lEnd = normalizeDate(loan.endDate);

    if (rangesOverlapWithBuffer(bStart, bEnd, lStart, lEnd, 0)) {
      const affected = loan.items
        .filter((item) => equipmentIds.includes(item.equipmentId))
        .map((i) => i.equipmentId);

      if (affected.length > 0) {
        conflicts.push({
          id: loan.id,
          code: loan.code,
          applicantName: loan.applicantName,
          departmentName: loan.departmentName,
          startDate: typeof loan.startDate === "string" ? loan.startDate : loan.startDate.toISOString(),
          endDate: typeof loan.endDate === "string" ? loan.endDate : loan.endDate.toISOString(),
          status: loan.status,
          affectedEquipments: affected,
        });
      }
    }
  }

  return conflicts;
}
