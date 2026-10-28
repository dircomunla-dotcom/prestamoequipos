import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateLoanAgreementPDF } from "@/lib/pdf";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const loan = db.getLoanById(id);
    if (!loan) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    }

    const allEquipments = db.getEquipments();
    const doc = generateLoanAgreementPDF(loan, allEquipments);
    const arrayBuffer = doc.output("arraybuffer");

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Acta-Prestamo-${loan.code}.pdf"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
