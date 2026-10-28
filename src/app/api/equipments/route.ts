import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const equipmentSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2),
  brand: z.string().min(1),
  model: z.string().min(1),
  serialNumber: z.string().optional().nullable(),
  categoryId: z.string().min(1),
  totalUnits: z.number().min(1).default(1),
  description: z.string().min(5),
  accessoriesSummary: z.string().optional().nullable(),
  replacementValue: z.number().min(0).default(0),
  status: z.enum(["AVAILABLE", "IN_LOAN", "MAINTENANCE", "OUT_OF_SERVICE"]).default("AVAILABLE"),
  requiresSpecialApproval: z.boolean().default(false),
  staffOnly: z.boolean().default(false),
  imageUrl: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId") || undefined;
    const status = searchParams.get("status") || undefined;

    let equipments = db.getEquipments();
    if (categoryId) equipments = equipments.filter((e) => e.categoryId === categoryId);
    if (status) equipments = equipments.filter((e) => e.status === status);

    const categories = db.getCategories();
    const kits = db.getKits();
    const departments = db.getDepartments();

    return NextResponse.json({ equipments, categories, kits, departments });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = equipmentSchema.parse(body);

    const categories = db.getCategories();
    const category = categories.find((c) => c.id === validated.categoryId);

    const newEquipment = db.createEquipment({
      ...validated,
      categoryName: category?.name || "General",
      accessories: [],
    });

    db.logAudit(
      "EQUIPMENT_CREATED",
      "EQUIPMENT",
      newEquipment.id,
      `Equipo ${newEquipment.code} (${newEquipment.name}) agregado al inventario.`
    );

    return NextResponse.json({ equipment: newEquipment }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos de equipo inválidos", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    if (!id) {
      return NextResponse.json({ error: "Se requiere el ID del equipo" }, { status: 400 });
    }

    const updated = db.updateEquipment(id, data);
    if (!updated) {
      return NextResponse.json({ error: "Equipo no encontrado" }, { status: 404 });
    }

    db.logAudit(
      "EQUIPMENT_UPDATED",
      "EQUIPMENT",
      id,
      `Equipo ${updated.code} actualizado. Estado: ${updated.status}.`
    );

    return NextResponse.json({ equipment: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get("id");
    if (!id) {
      const body = await request.json().catch(() => ({}));
      id = body.id;
    }

    if (!id) {
      return NextResponse.json({ error: "Se requiere el ID del equipo a eliminar" }, { status: 400 });
    }

    const eq = db.getEquipmentById(id);
    if (!eq) {
      return NextResponse.json({ error: "Equipo no encontrado" }, { status: 404 });
    }

    // Comprobar préstamos activos
    const loans = db.getLoans();
    const activeLoan = loans.find(
      (l) =>
        (l.status === "IN_LOAN" || l.status === "APPROVED" || l.status === "OVERDUE") &&
        l.items.some((i) => i.equipmentId === id)
    );

    if (activeLoan) {
      return NextResponse.json(
        {
          error: `No se puede eliminar el equipo porque está asociado al préstamo activo ${activeLoan.code}. Debe finalizar o cancelar el préstamo antes.`,
        },
        { status: 400 }
      );
    }

    const success = db.deleteEquipment(id);
    if (!success) {
      return NextResponse.json({ error: "No se pudo eliminar el equipo" }, { status: 500 });
    }

    db.logAudit(
      "EQUIPMENT_DELETED",
      "EQUIPMENT",
      id,
      `Equipo ${eq.code} (${eq.name}) eliminado del inventario.`
    );

    return NextResponse.json({ success: true, message: `Equipo ${eq.code} eliminado correctamente` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

