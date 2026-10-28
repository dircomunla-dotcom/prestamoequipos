import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const kitItemSchema = z.object({
  equipmentId: z.string().min(1),
  quantity: z.number().min(1).default(1),
});

const createKitSchema = z.object({
  name: z.string().min(2, "El nombre del kit debe tener al menos 2 caracteres"),
  description: z.string().min(5, "La descripción debe tener al menos 5 caracteres"),
  isActive: z.boolean().default(true),
  items: z.array(kitItemSchema).min(1, "El kit debe incluir al menos un equipo"),
});

export async function GET() {
  try {
    const kits = db.getKits();
    return NextResponse.json({ kits });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createKitSchema.parse(body);

    const newKit = db.createKit(validated);

    db.logAudit(
      "KIT_CREATED",
      "EQUIPMENT",
      newKit.id,
      `Kit "${newKit.name}" creado con ${newKit.items.length} equipos.`
    );

    return NextResponse.json({ kit: newKit }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos del kit inválidos", issues: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "Se requiere el ID del kit" }, { status: 400 });
    }

    if (data.items && (!Array.isArray(data.items) || data.items.length === 0)) {
      return NextResponse.json(
        { error: "El kit debe contener al menos un equipo" },
        { status: 400 }
      );
    }

    const updated = db.updateKit(id, data);
    if (!updated) {
      return NextResponse.json({ error: "Kit no encontrado" }, { status: 404 });
    }

    db.logAudit(
      "KIT_UPDATED",
      "EQUIPMENT",
      id,
      `Kit "${updated.name}" actualizado (${updated.items.length} equipos).`
    );

    return NextResponse.json({ kit: updated });
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
      return NextResponse.json({ error: "Se requiere el ID del kit a eliminar" }, { status: 400 });
    }

    const kit = db.getKitById(id);
    if (!kit) {
      return NextResponse.json({ error: "Kit no encontrado" }, { status: 404 });
    }

    const deleted = db.deleteKit(id);
    if (!deleted) {
      return NextResponse.json({ error: "No se pudo eliminar el kit" }, { status: 500 });
    }

    db.logAudit(
      "KIT_DELETED",
      "EQUIPMENT",
      id,
      `Kit "${kit.name}" eliminado del catálogo.`
    );

    return NextResponse.json({
      success: true,
      message: `Kit "${kit.name}" eliminado correctamente`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

