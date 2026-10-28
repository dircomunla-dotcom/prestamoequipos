import assert from "node:assert";
import test from "node:test";

const APP_CONFIG = {
  bufferDays: 1,
};

function normalizeDate(date) {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function rangesOverlapWithBuffer(startA, endA, startB, endB, bufferDays = 1) {
  const expandedEndB = addDays(endB, bufferDays);
  return startA <= expandedEndB && endA >= startB;
}

function matchesRecurringRule(date, rule) {
  if (!rule) return false;
  const dayOfWeek = date.getDay();
  if (rule.toUpperCase().includes("TUESDAY") && dayOfWeek === 2) return true;
  if (rule.toUpperCase().includes("MONDAY") && dayOfWeek === 1) return true;
  if (rule.toUpperCase().includes("WEDNESDAY") && dayOfWeek === 3) return true;
  if (rule.toUpperCase().includes("THURSDAY") && dayOfWeek === 4) return true;
  if (rule.toUpperCase().includes("FRIDAY") && dayOfWeek === 5) return true;
  return false;
}

function checkAvailability(params) {
  const { equipmentList, startDate, endDate, activeLoans, blockouts, userAffiliation, bufferDays = 1 } = params;
  const reqStart = normalizeDate(startDate);
  const reqEnd = normalizeDate(endDate);
  const results = {};

  for (const eq of equipmentList) {
    if (eq.status === "MAINTENANCE") {
      results[eq.id] = { equipmentId: eq.id, totalUnits: eq.totalUnits, availableUnits: 0, isAvailable: false, reason: "Equipo en mantenimiento técnico programado" };
      continue;
    }
    if (eq.status === "OUT_OF_SERVICE") {
      results[eq.id] = { equipmentId: eq.id, totalUnits: eq.totalUnits, availableUnits: 0, isAvailable: false, reason: "Equipo fuera de servicio temporalmente" };
      continue;
    }
    if (eq.staffOnly && userAffiliation === "ESTUDIANTE") {
      results[eq.id] = { equipmentId: eq.id, totalUnits: eq.totalUnits, availableUnits: 0, isAvailable: false, reason: "Equipo reservado exclusivamente para docentes y nodocentes de la UNLa" };
      continue;
    }

    let occupiedByLoans = 0;
    for (const loan of activeLoans) {
      if (!["APPROVED", "IN_LOAN", "OVERDUE"].includes(loan.status)) continue;
      const lStart = normalizeDate(loan.startDate);
      const lEnd = normalizeDate(loan.endDate);
      if (rangesOverlapWithBuffer(reqStart, reqEnd, lStart, lEnd, bufferDays)) {
        const item = loan.items.find((i) => i.equipmentId === eq.id);
        if (item) occupiedByLoans += item.quantity;
      }
    }

    let occupiedByBlockouts = 0;
    for (const blk of blockouts) {
      const bStart = normalizeDate(blk.startDate);
      const bEnd = normalizeDate(blk.endDate);
      let overlaps = false;
      if (blk.isRecurring && blk.recurringRule) {
        let curr = new Date(reqStart);
        while (curr <= reqEnd) {
          if (curr >= bStart && curr <= bEnd && matchesRecurringRule(curr, blk.recurringRule)) {
            overlaps = true;
            break;
          }
          curr = addDays(curr, 1);
        }
      } else {
        overlaps = rangesOverlapWithBuffer(reqStart, reqEnd, bStart, bEnd, 0);
      }
      if (overlaps) {
        const blkItem = blk.items.find((i) => i.equipmentId === eq.id);
        if (blkItem) occupiedByBlockouts += blkItem.quantityBlocked;
      }
    }

    const totalOccupied = occupiedByLoans + occupiedByBlockouts;
    const availableUnits = Math.max(0, eq.totalUnits - totalOccupied);
    results[eq.id] = {
      equipmentId: eq.id,
      totalUnits: eq.totalUnits,
      availableUnits,
      isAvailable: availableUnits > 0,
      reason: availableUnits <= 0 ? (occupiedByBlockouts > 0 ? "No disponible para estas fechas (reserva institucional)" : "Ocupado por otros préstamos") : undefined,
    };
  }
  return results;
}

function detectBlockoutConflicts(params) {
  const { equipmentIds, blockoutStart, blockoutEnd, existingLoans } = params;
  const bStart = normalizeDate(blockoutStart);
  const bEnd = normalizeDate(blockoutEnd);
  const conflicts = [];

  for (const loan of existingLoans) {
    if (!["APPROVED", "IN_LOAN"].includes(loan.status)) continue;
    const lStart = normalizeDate(loan.startDate);
    const lEnd = normalizeDate(loan.endDate);
    if (rangesOverlapWithBuffer(bStart, bEnd, lStart, lEnd, 0)) {
      const affected = loan.items.filter((item) => equipmentIds.includes(item.equipmentId)).map((i) => i.equipmentId);
      if (affected.length > 0) {
        conflicts.push({
          id: loan.id,
          code: loan.code,
          applicantName: loan.applicantName,
          status: loan.status,
          affectedEquipments: affected,
        });
      }
    }
  }
  return conflicts;
}

test("Regla 1: Margen de seguridad (Buffer Days = 1) entre préstamos", () => {
  const loanStart = new Date("2026-11-01T10:00:00Z");
  const loanEnd = new Date("2026-11-05T16:00:00Z");

  const nextDayStart = new Date("2026-11-06T10:00:00Z");
  const nextDayEnd = new Date("2026-11-08T16:00:00Z");

  const overlaps = rangesOverlapWithBuffer(nextDayStart, nextDayEnd, loanStart, loanEnd, 1);
  assert.strictEqual(overlaps, true, "El día posterior debe bloquearse por el buffer de 24hs");

  const twoDaysLaterStart = new Date("2026-11-07T10:00:00Z");
  const twoDaysLaterEnd = new Date("2026-11-09T16:00:00Z");
  assert.strictEqual(rangesOverlapWithBuffer(twoDaysLaterStart, twoDaysLaterEnd, loanStart, loanEnd, 1), false);
});

test("Regla 2: Disponibilidad y stock de múltiples unidades", () => {
  const eq = [{ id: "eq-aud", totalUnits: 2, status: "AVAILABLE" }];
  const activeLoans = [
    {
      id: "l-1",
      code: "PRE-001",
      applicantName: "Juan",
      startDate: "2026-11-10",
      endDate: "2026-11-12",
      status: "APPROVED",
      items: [{ equipmentId: "eq-aud", quantity: 1 }],
    },
  ];

  const avail = checkAvailability({
    equipmentList: eq,
    startDate: "2026-11-10",
    endDate: "2026-11-12",
    activeLoans,
    blockouts: [],
    bufferDays: 0,
  });

  assert.strictEqual(avail["eq-aud"].availableUnits, 1);
  assert.strictEqual(avail["eq-aud"].isAvailable, true);
});

test("Regla 3: Bloqueo de la Secretaría reduce la disponibilidad a 0", () => {
  const eq = [{ id: "eq-cam", totalUnits: 1, status: "AVAILABLE" }];
  const blockouts = [
    {
      id: "b-1",
      startDate: "2026-11-15",
      endDate: "2026-11-18",
      items: [{ equipmentId: "eq-cam", quantityBlocked: 1 }],
    },
  ];

  const avail = checkAvailability({
    equipmentList: eq,
    startDate: "2026-11-16",
    endDate: "2026-11-17",
    activeLoans: [],
    blockouts,
    bufferDays: 0,
  });

  assert.strictEqual(avail["eq-cam"].availableUnits, 0);
  assert.strictEqual(avail["eq-cam"].isAvailable, false);
});

test("Regla 4: Bloqueos recurrentes semanales (ej. Martes)", () => {
  const tuesday = new Date("2026-11-17T12:00:00Z");
  assert.strictEqual(matchesRecurringRule(tuesday, "TUESDAYS_10_14"), true);

  const wednesday = new Date("2026-11-18T12:00:00Z");
  assert.strictEqual(matchesRecurringRule(wednesday, "TUESDAYS_10_14"), false);
});

test("Regla 5: Restricción para estudiantes (Staff Only)", () => {
  const eq = [{ id: "eq-gimbal", totalUnits: 1, status: "AVAILABLE", staffOnly: true }];

  const studentAvail = checkAvailability({
    equipmentList: eq,
    startDate: "2026-11-20",
    endDate: "2026-11-22",
    activeLoans: [],
    blockouts: [],
    userAffiliation: "ESTUDIANTE",
  });
  assert.strictEqual(studentAvail["eq-gimbal"].isAvailable, false);

  const teacherAvail = checkAvailability({
    equipmentList: eq,
    startDate: "2026-11-20",
    endDate: "2026-11-22",
    activeLoans: [],
    blockouts: [],
    userAffiliation: "DOCENTE",
  });
  assert.strictEqual(teacherAvail["eq-gimbal"].isAvailable, true);
});

test("Regla 6: Equipos en mantenimiento técnico tienen disponibilidad = 0", () => {
  const eq = [{ id: "eq-mon", totalUnits: 1, status: "MAINTENANCE" }];
  const avail = checkAvailability({
    equipmentList: eq,
    startDate: "2026-11-20",
    endDate: "2026-11-22",
    activeLoans: [],
    blockouts: [],
  });
  assert.strictEqual(avail["eq-mon"].isAvailable, false);
});

test("Regla 7: Detección obligatoria de conflictos en la creación de bloqueos", () => {
  const existingLoans = [
    {
      id: "l-conf",
      code: "PRE-2026-9999",
      applicantName: "Lic. Martín Rossi",
      startDate: "2026-11-25",
      endDate: "2026-11-28",
      status: "APPROVED",
      items: [{ equipmentId: "eq-1", quantity: 1 }],
    },
  ];

  const conflicts = detectBlockoutConflicts({
    equipmentIds: ["eq-1"],
    blockoutStart: "2026-11-26",
    blockoutEnd: "2026-11-27",
    existingLoans,
  });

  assert.strictEqual(conflicts.length, 1);
  assert.strictEqual(conflicts[0].code, "PRE-2026-9999");
});
