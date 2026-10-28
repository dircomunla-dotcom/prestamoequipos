import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkAvailability } from "@/lib/availability";
import {
  sendEmailNotification,
  getLoanConfirmationEmail,
  getAdminNewLoanAlertEmail,
} from "@/lib/notifications";
import { z } from "zod";

const createLoanSchema = z.object({
  userId: z.string().min(1),
  userName: z.string().min(1),
  userEmail: z.string().email(),
  departmentId: z.string().min(1),
  departmentName: z.string().min(1),
  applicantAffiliation: z.string().min(1),
  applicantDni: z.string().min(5),
  applicantPhone: z.string().min(6),
  sponsorName: z.string().optional().nullable(),
  sponsorRole: z.string().optional().nullable(),
  sponsorEmail: z.string().optional().nullable(),
  pickupPersonName: z.string().min(1),
  pickupPersonDni: z.string().min(5),
  pickupPersonPhone: z.string().min(6),
  isPickupApplicant: z.boolean().default(true),
  returnPersonName: z.string().min(1),
  returnPersonDni: z.string().min(5),
  returnPersonPhone: z.string().min(6),
  isReturnPickupSame: z.boolean().default(true),
  startDate: z.string(),
  endDate: z.string(),
  pickupTime: z.string().default("10:00"),
  returnTime: z.string().default("16:00"),
  projectName: z.string().min(3),
  projectDescription: z.string().min(5),
  usageLocationType: z.enum(["INTERNAL", "EXTERNAL"]),
  usageLocationDetails: z.string().min(2),
  usageType: z.string().min(2),
  operatorsCount: z.number().optional().nullable(),
  operatorsExperience: z.string().optional().nullable(),
  requiresTravelWarning: z.boolean().default(false),
  specialNotes: z.string().optional().nullable(),
  items: z.array(
    z.object({
      equipmentId: z.string(),
      quantityRequested: z.number().min(1),
    })
  ).min(1, "Debe seleccionar al menos un equipo"),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || undefined;
    const status = (searchParams.get("status") as any) || undefined;
    const code = searchParams.get("code") || undefined;

    if (code) {
      const loan = db.getLoanById(code);
      if (!loan) {
        return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
      }
      return NextResponse.json({ loan });
    }

    const loans = db.getLoans({ userId, status });
    return NextResponse.json({ loans });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createLoanSchema.parse(body);

    // 1. Verificación obligatoria de aval para estudiantes
    if (validated.applicantAffiliation === "ESTUDIANTE" && !validated.sponsorName) {
      return NextResponse.json(
        { error: "Los estudiantes deben indicar obligatoriamente un responsable institucional (docente o autoridad) que avale la solicitud." },
        { status: 400 }
      );
    }

    // 2. Validación de disponibilidad en servidor (Servicio Unificado checkAvailability)
    const allEquipments = db.getEquipments();
    const activeLoans = db.getLoans();
    const blockouts = db.getBlockouts();

    const availability = checkAvailability({
      equipmentList: allEquipments,
      startDate: validated.startDate,
      endDate: validated.endDate,
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
      userAffiliation: validated.applicantAffiliation,
    });

    const unavailableItems: string[] = [];

    for (const item of validated.items) {
      const eqAvail = availability[item.equipmentId];
      const eq = allEquipments.find((e) => e.id === item.equipmentId);
      const name = eq?.name || item.equipmentId;

      if (!eqAvail || !eqAvail.isAvailable || eqAvail.availableUnits < item.quantityRequested) {
        unavailableItems.push(
          `${name} (solicitado: ${item.quantityRequested}, disponible: ${eqAvail?.availableUnits ?? 0}${eqAvail?.reason ? ` - ${eqAvail.reason}` : ""})`
        );
      }
    }

    if (unavailableItems.length > 0) {
      return NextResponse.json(
        {
          error: "Uno o más equipos seleccionados ya no están disponibles para las fechas elegidas. Por favor ajustá las fechas o seleccioná otros equipos.",
          details: unavailableItems,
        },
        { status: 409 }
      );
    }

    // 3. Crear el pedido
    const preparedItems = validated.items.map((it, idx) => {
      const eq = allEquipments.find((e) => e.id === it.equipmentId);
      return {
        id: `li-${Date.now()}-${idx}`,
        equipmentId: it.equipmentId,
        equipmentName: eq?.name,
        equipmentCode: eq?.code,
        quantityRequested: it.quantityRequested,
        quantityApproved: it.quantityRequested,
      };
    });

    const newLoan = db.createLoan({
      ...validated,
      items: preparedItems,
      termsAcceptedAt: new Date().toISOString(),
      status: "PENDING",
    });

    // 4. Registrar en auditoría
    db.logAudit(
      "LOAN_CREATED",
      "LOAN",
      newLoan.id,
      `Solicitud ${newLoan.code} creada por ${newLoan.userName} para ${newLoan.departmentName}`,
      { id: validated.userId, name: validated.userName }
    );

    // 5. Enviar email de confirmación al solicitante y aviso a la administración
    const startFormatted = new Date(validated.startDate).toLocaleDateString("es-AR");
    const endFormatted = new Date(validated.endDate).toLocaleDateString("es-AR");
    await sendEmailNotification({
      to: validated.userEmail,
      subject: `Solicitud de Préstamo Recibida - ${newLoan.code} [UNLa]`,
      html: getLoanConfirmationEmail(newLoan.code, validated.userName, startFormatted, endFormatted),
      type: "LOAN_CREATED",
    });

    const adminEmail = process.env.SMTP_USER || "dircomunla@gmail.com";
    const itemsSummary = preparedItems
      .map((i) => `${i.quantityRequested}x ${i.equipmentName || i.equipmentCode}`)
      .join(", ");
    await sendEmailNotification({
      to: adminEmail,
      subject: `[Nuevo Pedido ${newLoan.code}] ${validated.userName} - ${validated.departmentName}`,
      html: getAdminNewLoanAlertEmail({
        code: newLoan.code,
        applicantName: validated.userName,
        applicantEmail: validated.userEmail,
        departmentName: validated.departmentName,
        projectName: validated.projectName,
        startDate: startFormatted,
        endDate: endFormatted,
        itemsSummary,
      }),
      type: "LOAN_CREATED",
    });

    return NextResponse.json({ loan: newLoan }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos de formulario inválidos", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Error al procesar el pedido" }, { status: 500 });
  }
}
