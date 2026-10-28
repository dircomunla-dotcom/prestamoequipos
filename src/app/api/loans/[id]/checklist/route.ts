import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const checklistSchema = z.object({
  type: z.enum(["PICKUP", "RETURN"]),
  performedById: z.string().min(1),
  performedByName: z.string().min(1),
  personName: z.string().min(1),
  personDni: z.string().min(5),
  verifiedIdentity: z.boolean().default(true),
  checklist: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      type: z.enum(["EQUIPMENT", "ACCESSORY"]),
      status: z.enum(["OK", "DETAIL", "MISSING", "DAMAGED"]),
      notes: z.string().optional(),
    })
  ),
  observations: z.string().optional().nullable(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = checklistSchema.parse(body);

    const loan = db.getLoanById(id);
    if (!loan) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    }

    const record = db.addCheckRecord(id, validated);
    if (!record) {
      return NextResponse.json({ error: "No se pudo registrar la inspección" }, { status: 500 });
    }

    db.logAudit(
      validated.type === "PICKUP" ? "CHECKLIST_PICKUP" : "CHECKLIST_RETURN",
      "LOAN",
      id,
      `Inspección de ${validated.type === "PICKUP" ? "entrega/retiro" : "devolución"} registrada con ${validated.personName} (DNI ${validated.personDni}) por ${validated.performedByName}.`,
      { id: validated.performedById, name: validated.performedByName }
    );

    return NextResponse.json({ success: true, record, loan: db.getLoanById(id) });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos de checklist inválidos", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
