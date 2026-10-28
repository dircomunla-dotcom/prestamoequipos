import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkAvailability } from "@/lib/availability";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const userAffiliation = searchParams.get("affiliation") || undefined;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Se requieren las fechas startDate y endDate" },
        { status: 400 }
      );
    }

    const equipments = db.getEquipments();
    const activeLoans = db.getLoans();
    const blockouts = db.getBlockouts();

    const availability = checkAvailability({
      equipmentList: equipments,
      startDate,
      endDate,
      activeLoans: activeLoans.map((l) => ({
        id: l.id,
        code: l.code,
        applicantName: l.userName,
        departmentName: l.departmentName,
        startDate: l.startDate,
        endDate: l.endDate,
        status: l.status,
        items: l.items.map((i) => ({ equipmentId: i.equipmentId, quantity: i.quantityApproved })),
      })),
      blockouts: blockouts.map((b) => ({
        id: b.id,
        title: b.title,
        reason: b.reason,
        startDate: b.startDate,
        endDate: b.endDate,
        isRecurring: b.isRecurring,
        recurringRule: b.recurringRule,
        items: b.items.map((i) => ({ equipmentId: i.equipmentId, quantityBlocked: i.quantityBlocked })),
      })),
      userAffiliation,
    });

    return NextResponse.json({ availability });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error al verificar disponibilidad" }, { status: 500 });
  }
}
