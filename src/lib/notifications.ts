export interface EmailNotification {
  id: string;
  to: string;
  subject: string;
  html: string;
  sentAt: string;
  type:
    | "LOAN_CREATED"
    | "LOAN_APPROVED"
    | "LOAN_REJECTED"
    | "PICKUP_REMINDER"
    | "RETURN_REMINDER"
    | "OVERDUE_ALERT"
    | "BLOCKOUT_AFFECTED";
}

// Bandeja local de correos en memoria para visualización y pruebas
const notificationInbox: EmailNotification[] = [];

export async function sendEmailNotification(params: {
  to: string;
  subject: string;
  html: string;
  type: EmailNotification["type"];
}): Promise<boolean> {
  const notification: EmailNotification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    to: params.to,
    subject: params.subject,
    html: params.html,
    sentAt: new Date().toISOString(),
    type: params.type,
  };

  notificationInbox.unshift(notification);

  console.log(`\n======================================================`);
  console.log(`📧 [EMAIL UNLa] Para: ${params.to}`);
  console.log(`📌 Asunto: ${params.subject}`);
  console.log(`🕒 Fecha: ${new Date().toLocaleString("es-AR")}`);
  console.log(`======================================================\n`);

  return true;
}

export function getVirtualInbox(): EmailNotification[] {
  return notificationInbox;
}

// Plantillas de correos con diseño institucional
export function getLoanConfirmationEmail(code: string, applicantName: string, startDate: string, endDate: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937; line-height: 1.5;">
      <div style="background-color: #4F46E5; padding: 20px; text-align: center; color: white;">
        <h2 style="margin: 0;">Universidad Nacional de Lanús</h2>
        <p style="margin: 5px 0 0 0; font-size: 14px;">Secretaría de Cultura y Comunicación</p>
      </div>
      <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none;">
        <h3>Solicitud de Préstamo Recibida</h3>
        <p>Hola <strong>${applicantName}</strong>,</p>
        <p>Recibimos tu solicitud de equipamiento audiovisual con código de seguimiento:</p>
        <div style="background-color: #f3f4f6; padding: 12px; font-size: 18px; font-weight: bold; text-align: center; border-radius: 6px; letter-spacing: 1px;">
          ${code}
        </div>
        <p style="margin-top: 16px;">
          <strong>Fechas solicitadas:</strong> Desde el ${startDate} hasta el ${endDate}.<br/>
          Tu pedido está en estado <strong>Pendiente de revisión</strong>. Te notificaremos en cuanto el equipo de la Secretaría lo evalúe.
        </p>
        <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">
          Podés consultar el estado de tu pedido en cualquier momento ingresando con tu código en el portal de préstamos.
        </p>
      </div>
    </div>
  `;
}

export function getLoanApprovedEmail(code: string, applicantName: string, pickupTime: string, startDate: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937; line-height: 1.5;">
      <div style="background-color: #10b981; padding: 20px; text-align: center; color: white;">
        <h2 style="margin: 0;">¡Tu Solicitud fue Aprobada!</h2>
        <p style="margin: 5px 0 0 0; font-size: 14px;">Secretaría de Cultura y Comunicación - UNLa</p>
      </div>
      <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none;">
        <p>Hola <strong>${applicantName}</strong>,</p>
        <p>Nos alegra informarte que tu pedido <strong>${code}</strong> fue <strong>Aprobado</strong>.</p>
        <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 16px; border-radius: 6px; margin: 16px 0;">
          <h4 style="margin: 0 0 8px 0; color: #065f46;">Instrucciones para el Retiro:</h4>
          <ul style="margin: 0; padding-left: 20px; color: #065f46;">
            <li><strong>Fecha y horario:</strong> ${startDate} a las ${pickupTime} hs.</li>
            <li><strong>Lugar:</strong> Secretaría de Cultura y Comunicación (Edificio Scalabrini Ortiz).</li>
            <li><strong>Requisito obligatorio:</strong> Presentar DNI físico para verificación y firma del acta.</li>
          </ul>
        </div>
      </div>
    </div>
  `;
}

export function getBlockoutAffectedEmail(code: string, applicantName: string, blockoutReason: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937; line-height: 1.5;">
      <div style="background-color: #f59e0b; padding: 20px; text-align: center; color: white;">
        <h2 style="margin: 0;">Aviso Importante: Reprogramación de Pedido</h2>
        <p style="margin: 5px 0 0 0; font-size: 14px;">Secretaría de Cultura y Comunicación - UNLa</p>
      </div>
      <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none;">
        <p>Estimado/a <strong>${applicantName}</strong>,</p>
        <p>Nos comunicamos en relación a tu solicitud <strong>${code}</strong>.</p>
        <p>Por razones de fuerza mayor institucional (<strong>${blockoutReason}</strong>), parte del equipamiento asignado debió ser afectado a una reserva prioritaria de la Universidad.</p>
        <p>Por favor comunicate a la brevedad con la Secretaría o ingresá al sistema para seleccionar equipos sustitutos o reprogramar las fechas de tu actividad.</p>
      </div>
    </div>
  `;
}
