import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkAvailability } from "@/lib/availability";
import { sendEmailNotification, getLoanApprovedEmail } from "@/lib/notifications";

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
    return NextResponse.json({ loan });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, comment, adminUser } = body;

    const loan = db.getLoanById(id);
    if (!loan) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    }

    if (action === "APPROVE") {
      // Verificar si hay algún bloqueo que se haya creado posteriormente y colisione
      const blockouts = db.getBlockouts();
      const allEquipments = db.getEquipments();

      const availability = checkAvailability({
        equipmentList: allEquipments.filter((e) =>
          loan.items.some((i) => i.equipmentId === e.id)
        ),
        startDate: loan.startDate,
        endDate: loan.endDate,
        activeLoans: [], // Excluimos otros préstamos para testear bloqueos directamente
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
        bufferDays: 0,
      });

      const blockedEquipments = loan.items.filter((it) => {
        const avail = availability[it.equipmentId];
        return avail && (!avail.isAvailable || avail.availableUnits < it.quantityApproved);
      });

      if (blockedEquipments.length > 0) {
        return NextResponse.json(
          {
            error: "No se puede aprobar este pedido porque choca con un bloqueo de equipamiento vigente. Debe resolver o eliminar el bloqueo antes de aprobar.",
            blockedEquipments,
          },
          { status: 409 }
        );
      }

      const updated = db.updateLoanStatus(
        id,
        "APPROVED",
        comment || "Pedido aprobado por la Secretaría de Cultura y Comunicación.",
        adminUser
      );

      db.logAudit(
        "LOAN_APPROVED",
        "LOAN",
        id,
        `Pedido ${loan.code} aprobado por ${adminUser?.name || "Administración"}`,
        adminUser
      );

      // Notificación de aprobación
      const startFmt = new Date(loan.startDate).toLocaleDateString("es-AR");
      sendEmailNotification({
        to: loan.userEmail,
        subject: `¡Solicitud Aprobada! - ${loan.code} [UNLa]`,
        html: getLoanApprovedEmail(loan.code, loan.userName, loan.pickupTime, startFmt),
        type: "LOAN_APPROVED",
      });

      return NextResponse.json({ loan: updated });
    }

    if (action === "REJECT") {
      const updated = db.updateLoanStatus(
        id,
        "REJECTED",
        comment || "Pedido rechazado por la Secretaría.",
        adminUser
      );
      if (updated) {
        updated.rejectionReason = comment;
      }

      db.logAudit(
        "LOAN_REJECTED",
        "LOAN",
        id,
        `Pedido ${loan.code} rechazado por ${adminUser?.name || "Administración"}. Motivo: ${comment}`,
        adminUser
      );

      return NextResponse.json({ loan: updated });
    }

    if (action === "CANCEL") {
      if (loan.status !== "PENDING" && !adminUser) {
        return NextResponse.json(
          { error: "Solo se pueden cancelar pedidos en estado Pendiente. Si ya fue aprobado, contacte a la Secretaría." },
          { status: 400 }
        );
      }

      const updated = db.updateLoanStatus(
        id,
        "CANCELLED",
        comment || "Pedido cancelado por el solicitante.",
        adminUser
      );

      db.logAudit(
        "LOAN_CANCELLED",
        "LOAN",
        id,
        `Pedido ${loan.code} cancelado`,
        adminUser
      );

      return NextResponse.json({ loan: updated });
    }

    if (action === "EDIT") {
      if (loan.status !== "PENDING" && loan.status !== "APPROVED") {
        return NextResponse.json(
          {
            error: `No se puede modificar un pedido en estado "${loan.status}". Solo es posible editar pedidos pendientes o aprobados previos a la entrega física.`,
          },
          { status: 400 }
        );
      }

      const { data: editData, modifierUser } = body;
      if (!editData) {
        return NextResponse.json({ error: "Faltan los datos a actualizar" }, { status: 400 });
      }

      const changes: string[] = [];

      // Validar si cambiaron las fechas
      const datesChanged =
        (editData.startDate && editData.startDate !== loan.startDate) ||
        (editData.endDate && editData.endDate !== loan.endDate);

      if (datesChanged) {
        const newStart = editData.startDate || loan.startDate;
        const newEnd = editData.endDate || loan.endDate;

        // Verificar disponibilidad en las nuevas fechas (excluyendo este préstamo)
        const allEquipments = db.getEquipments();
        const otherLoans = db.getLoans().filter((l) => l.id !== loan.id);
        const blockouts = db.getBlockouts();

        const availability = checkAvailability({
          equipmentList: allEquipments.filter((e) =>
            loan.items.some((i) => i.equipmentId === e.id)
          ),
          startDate: newStart,
          endDate: newEnd,
          activeLoans: otherLoans.map((l) => ({
            id: l.id,
            code: l.code,
            applicantName: l.userName,
            departmentName: l.departmentName,
            status: l.status,
            startDate: l.startDate,
            endDate: l.endDate,
            items: l.items.map((i) => ({ equipmentId: i.equipmentId, quantityApproved: i.quantityApproved })),
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
          bufferDays: 1,
        });

        const unavailableItems = loan.items.filter((it) => {
          const avail = availability[it.equipmentId];
          return !avail || !avail.isAvailable || avail.availableUnits < it.quantityApproved;
        });

        if (unavailableItems.length > 0) {
          const names = unavailableItems.map((it) => it.equipmentName || it.equipmentCode).join(", ");
          return NextResponse.json(
            {
              error: `No hay disponibilidad suficiente en el nuevo rango de fechas para: ${names}. Por favor elija otras fechas.`,
            },
            { status: 409 }
          );
        }

        const oldStartFmt = new Date(loan.startDate).toLocaleDateString("es-AR");
        const oldEndFmt = new Date(loan.endDate).toLocaleDateString("es-AR");
        const newStartFmt = new Date(newStart).toLocaleDateString("es-AR");
        const newEndFmt = new Date(newEnd).toLocaleDateString("es-AR");
        changes.push(`Fechas: de ${oldStartFmt}–${oldEndFmt} a ${newStartFmt}–${newEndFmt}`);
      }

      if (editData.pickupTime && editData.pickupTime !== loan.pickupTime) {
        changes.push(`Horario retiro: ${loan.pickupTime} hs -> ${editData.pickupTime} hs`);
      }
      if (editData.returnTime && editData.returnTime !== loan.returnTime) {
        changes.push(`Horario devolución: ${loan.returnTime} hs -> ${editData.returnTime} hs`);
      }
      if (editData.projectName && editData.projectName !== loan.projectName) {
        changes.push(`Proyecto: "${editData.projectName}"`);
      }
      if (editData.projectDescription && editData.projectDescription !== loan.projectDescription) {
        changes.push(`Descripción actualizada`);
      }
      if (editData.pickupPersonName && editData.pickupPersonName !== loan.pickupPersonName) {
        changes.push(`Retira: ${editData.pickupPersonName} (DNI ${editData.pickupPersonDni || loan.pickupPersonDni})`);
      }
      if (editData.returnPersonName && editData.returnPersonName !== loan.returnPersonName) {
        changes.push(`Devuelve: ${editData.returnPersonName} (DNI ${editData.returnPersonDni || loan.returnPersonDni})`);
      }
      if (editData.usageLocationDetails && editData.usageLocationDetails !== loan.usageLocationDetails) {
        changes.push(`Locación: ${editData.usageLocationDetails}`);
      }
      if (editData.specialNotes && editData.specialNotes !== loan.specialNotes) {
        changes.push(`Observaciones actualizadas`);
      }

      const modificationSummary = changes.length > 0 ? changes.join(" • ") : "Datos generales del pedido modificados";

      const updated = db.updateLoanData(id, editData, modificationSummary, modifierUser);

      db.logAudit(
        "LOAN_MODIFIED_BY_APPLICANT",
        "LOAN",
        id,
        `Pedido ${loan.code} modificado por el solicitante: ${modificationSummary}`,
        modifierUser
      );

      return NextResponse.json({ loan: updated, modificationSummary });
    }

    return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
