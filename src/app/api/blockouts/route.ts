import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { detectBlockoutConflicts } from "@/lib/availability";
import { sendEmailNotification, getBlockoutAffectedEmail } from "@/lib/notifications";
import { z } from "zod";

const blockoutSchema = z.object({
  title: z.string().min(3),
  reason: z.enum([
    "SECRETARIA_INTERNAL",
    "INSTITUTIONAL_EVENT",
    "SCHEDULED_MAINTENANCE",
    "REPAIR",
    "AUTHORITY_RESERVED",
    "EXTERNAL_LOAN",
    "OTHER",
  ]),
  internalNotes: z.string().optional().nullable(),
  startDate: z.string(),
  endDate: z.string(),
  allDay: z.boolean().default(true),
  isRecurring: z.boolean().default(false),
  recurringRule: z.string().optional().nullable(),
  createdById: z.string().min(1),
  createdByName: z.string().min(1),
  equipmentIds: z.array(z.string()).min(1, "Debe seleccionar al menos un equipo"),
  quantityBlocked: z.number().min(1).default(1),
  confirmConflicts: z.boolean().default(false), // Si confirma forzar tras advertencia
});

export async function GET(request: NextRequest) {
  try {
    const blockouts = db.getBlockouts();
    return NextResponse.json({ blockouts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = blockoutSchema.parse(body);

    const existingLoans = db.getLoans();

    // 1. Detección de colisiones obligatoria con pedidos Aprobados o en Préstamo
    const conflicts = detectBlockoutConflicts({
      equipmentIds: validated.equipmentIds,
      blockoutStart: validated.startDate,
      blockoutEnd: validated.endDate,
      existingLoans: existingLoans.map((l) => ({
        id: l.id,
        code: l.code,
        applicantName: l.userName,
        departmentName: l.departmentName,
        startDate: l.startDate,
        endDate: l.endDate,
        status: l.status,
        items: l.items.map((i) => ({ equipmentId: i.equipmentId, quantity: i.quantityApproved })),
      })),
    });

    if (conflicts.length > 0 && !validated.confirmConflicts) {
      return NextResponse.json(
        {
          error: "CONFLICT_WITH_APPROVED_LOANS",
          message: "El bloqueo colisiona con pedidos previamente aprobados o en préstamo.",
          conflicts,
        },
        { status: 409 }
      );
    }

    // 2. Si se confirmó con conflictos, notificar automáticamente a los solicitantes afectados
    if (conflicts.length > 0 && validated.confirmConflicts) {
      for (const conf of conflicts) {
        const affectedLoan = existingLoans.find((l) => l.id === conf.id);
        if (affectedLoan) {
          sendEmailNotification({
            to: affectedLoan.userEmail,
            subject: `Aviso Importante: Reprogramación de Pedido - ${affectedLoan.code} [UNLa]`,
            html: getBlockoutAffectedEmail(affectedLoan.code, affectedLoan.userName, validated.title),
            type: "BLOCKOUT_AFFECTED",
          });
        }
      }
    }

    // 3. Crear el bloqueo
    const allEquipments = db.getEquipments();
    const items = validated.equipmentIds.map((eqId) => {
      const eq = allEquipments.find((e) => e.id === eqId);
      return {
        equipmentId: eqId,
        equipmentName: eq?.name || "Equipo",
        equipmentCode: eq?.code || "EQ",
        quantityBlocked: validated.quantityBlocked,
      };
    });

    const newBlockout = db.createBlockout({
      title: validated.title,
      reason: validated.reason,
      internalNotes: validated.internalNotes || null,
      startDate: validated.startDate,
      endDate: validated.endDate,
      allDay: validated.allDay,
      isRecurring: validated.isRecurring,
      recurringRule: validated.recurringRule || null,
      createdById: validated.createdById,
      createdByName: validated.createdByName,
      items,
    });

    // 4. Si el motivo es MANTENIMIENTO PROGRAMADO y la fecha actual cae en el rango, actualizar estado técnico
    if (validated.reason === "SCHEDULED_MAINTENANCE") {
      const now = new Date();
      const bStart = new Date(validated.startDate);
      const bEnd = new Date(validated.endDate);
      if (now >= bStart && now <= bEnd) {
        for (const eqId of validated.equipmentIds) {
          db.updateEquipment(eqId, { status: "MAINTENANCE" });
        }
      }
    }

    db.logAudit(
      "BLOCKOUT_CREATED",
      "BLOCKOUT",
      newBlockout.id,
      `Bloqueo "${newBlockout.title}" creado por ${newBlockout.createdByName} (${newBlockout.items.length} equipos).`,
      { id: validated.createdById, name: validated.createdByName }
    );

    return NextResponse.json({ blockout: newBlockout, conflictsCount: conflicts.length }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos de bloqueo inválidos", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Se requiere el ID del bloqueo" }, { status: 400 });
    }

    const blockout = db.getBlockoutById(id);
    if (!blockout) {
      return NextResponse.json({ error: "Bloqueo no encontrado" }, { status: 404 });
    }

    // Si era de mantenimiento, restaurar equipo a AVAILABLE si no tiene otros bloqueos
    if (blockout.reason === "SCHEDULED_MAINTENANCE") {
      for (const it of blockout.items) {
        db.updateEquipment(it.equipmentId, { status: "AVAILABLE" });
      }
    }

    const deleted = db.deleteBlockout(id);
    if (!deleted) {
      return NextResponse.json({ error: "No se pudo eliminar el bloqueo" }, { status: 500 });
    }

    db.logAudit(
      "BLOCKOUT_DELETED",
      "BLOCKOUT",
      id,
      `Bloqueo "${blockout.title}" eliminado.`
    );

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
