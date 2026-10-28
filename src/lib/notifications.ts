import net from "net";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const tls = require("tls") as any;

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

function encodeMimeHeader(text: string): string {
  return `=?UTF-8?B?${Buffer.from(text, "utf-8").toString("base64")}?=`;
}

function extractEmailAddress(input: string): string {
  const match = input.match(/<([^>]+)>/);
  return match ? match[1].trim() : input.trim();
}

async function sendRawSmtpMail(options: {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const { host, port, user, pass, from, to, subject, html } = options;
  const fromEnvelope = extractEmailAddress(from);
  const toEnvelope = extractEmailAddress(to);

  const runSmtpSession = (socket: net.Socket, isInitialTls: boolean) =>
    new Promise<void>((resolve, reject) => {
      let currentSocket: net.Socket = socket;
      let buffer = "";
      let waitResolve: ((line: string) => void) | null = null;
      let waitReject: ((err: Error) => void) | null = null;

      const attachListeners = (sock: net.Socket) => {
        sock.setEncoding("utf-8");
        sock.setTimeout(15000);
        sock.on("data", (chunk: string) => {
          buffer += chunk;
          const lines = buffer.split("\r\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            // Un código SMTP final tiene espacio en la 4ta posición (ej. "250 OK"), mientras que "250-..." continúa
            if (/^\d{3} /.test(line) && waitResolve) {
              const r = waitResolve;
              waitResolve = null;
              waitReject = null;
              r(line);
            } else if (/^[45]\d{2}/.test(line) && waitReject) {
              const rj = waitReject;
              waitResolve = null;
              waitReject = null;
              rj(new Error(`SMTP Error: ${line}`));
            }
          }
        });
        sock.on("error", (err: Error) => {
          if (waitReject) {
            const rj = waitReject;
            waitResolve = null;
            waitReject = null;
            rj(err);
          } else {
            reject(err);
          }
        });
        sock.on("timeout", () => {
          sock.destroy();
          reject(new Error("SMTP Timeout"));
        });
      };

      const readResponse = () =>
        new Promise<string>((res, rej) => {
          waitResolve = res;
          waitReject = rej;
        });

      const sendCommand = async (cmd: string) => {
        const p = readResponse();
        currentSocket.write(cmd + "\r\n");
        return p;
      };

      attachListeners(currentSocket);

      (async () => {
        try {
          await readResponse(); // 220 Greeting
          await sendCommand(`EHLO prestamoequipos.unla.edu.ar`);

          if (!isInitialTls) {
            await sendCommand("STARTTLS");
            currentSocket.removeAllListeners("data");
            currentSocket.removeAllListeners("error");
            currentSocket.removeAllListeners("timeout");

            currentSocket = await new Promise<net.Socket>((tlsRes, tlsRej) => {
              const tlsSock = tls.connect(
                {
                  socket: currentSocket,
                  servername: host,
                },
                () => tlsRes(tlsSock)
              );
              tlsSock.once("error", tlsRej);
            });

            attachListeners(currentSocket);
            await sendCommand(`EHLO prestamoequipos.unla.edu.ar`);
          }

          await sendCommand("AUTH LOGIN");
          await sendCommand(Buffer.from(user, "utf-8").toString("base64"));
          await sendCommand(Buffer.from(pass, "utf-8").toString("base64"));

          await sendCommand(`MAIL FROM:<${fromEnvelope}>`);
          await sendCommand(`RCPT TO:<${toEnvelope}>`);
          await sendCommand("DATA");

          const bodyBase64 =
            Buffer.from(html, "utf-8")
              .toString("base64")
              .match(/.{1,76}/g)
              ?.join("\r\n") || "";

          const headers = [
            `From: ${from.includes("<") ? `Secretaria UNLa <${fromEnvelope}>` : fromEnvelope}`,
            `To: <${toEnvelope}>`,
            `Subject: ${encodeMimeHeader(subject)}`,
            `Date: ${new Date().toUTCString()}`,
            `MIME-Version: 1.0`,
            `Content-Type: text/html; charset=UTF-8`,
            `Content-Transfer-Encoding: base64`,
            "",
            bodyBase64,
            ".",
          ].join("\r\n");

          await sendCommand(headers);
          await sendCommand("QUIT").catch(() => {});
          currentSocket.end();
          resolve();
        } catch (err) {
          currentSocket.destroy();
          reject(err);
        }
      })();
    });

  if (port === 465) {
    const tlsSocket = tls.connect({ host, port, servername: host });
    await runSmtpSession(tlsSocket, true);
  } else {
    const netSocket = net.connect({ host, port });
    await runSmtpSession(netSocket, false);
  }
}

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

  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from =
    process.env.SMTP_FROM ||
    `Secretaría de Cultura y Comunicación UNLa <${user || "dircomunla@gmail.com"}>`;

  const hasValidCredentials =
    Boolean(user) &&
    Boolean(pass) &&
    pass !== "password-smtp" &&
    pass !== "tu-contrasena-de-aplicacion-de-16-letras";

  if (hasValidCredentials && user && pass) {
    try {
      await sendRawSmtpMail({
        host,
        port,
        user,
        pass,
        from,
        to: params.to,
        subject: params.subject,
        html: params.html,
      });
      console.log(`📧 [SMTP ENVIADO] Para: ${params.to} | Asunto: ${params.subject}`);
      return true;
    } catch (error) {
      console.error(`❌ [ERROR SMTP] No se pudo enviar el correo a ${params.to}:`, error);
      return false;
    }
  }

  console.log(`\n======================================================`);
  console.log(`📧 [EMAIL SIMULADO UNLa] Para: ${params.to}`);
  console.log(`📌 Asunto: ${params.subject}`);
  console.log(`🕒 Fecha: ${new Date().toLocaleString("es-AR")}`);
  console.log(`======================================================\n`);

  return true;
}

export function getVirtualInbox(): EmailNotification[] {
  return notificationInbox;
}

// Plantillas de correos con diseño institucional
export function getLoanConfirmationEmail(
  code: string,
  applicantName: string,
  startDate: string,
  endDate: string
): string {
  const portalUrl = process.env.NEXTAUTH_URL || "https://prestamoequipos.comunidaio.com";
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
        <p style="margin-top: 20px;">
          <a href="${portalUrl}/consultar" style="display: inline-block; background-color: #4F46E5; color: white; text-decoration: none; padding: 10px 18px; border-radius: 6px; font-size: 14px; font-weight: bold;">
            Consultar estado del pedido
          </a>
        </p>
        <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">
          Podés consultar el estado de tu pedido en cualquier momento ingresando con tu código en ${portalUrl}
        </p>
      </div>
    </div>
  `;
}

export function getAdminNewLoanAlertEmail(params: {
  code: string;
  applicantName: string;
  applicantEmail: string;
  departmentName: string;
  projectName: string;
  startDate: string;
  endDate: string;
  itemsSummary: string;
}): string {
  const portalUrl = process.env.NEXTAUTH_URL || "https://prestamoequipos.comunidaio.com";
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937; line-height: 1.5;">
      <div style="background-color: #1e293b; padding: 20px; text-align: center; color: white;">
        <h2 style="margin: 0;">Nueva Solicitud de Préstamo</h2>
        <p style="margin: 5px 0 0 0; font-size: 14px;">Panel de Administración — Cultura y Comunicación UNLa</p>
      </div>
      <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none;">
        <p>Se registró una nueva solicitud de equipamiento en el portal:</p>
        <ul style="padding-left: 20px;">
          <li><strong>Código:</strong> ${params.code}</li>
          <li><strong>Solicitante:</strong> ${params.applicantName} (${params.applicantEmail})</li>
          <li><strong>Área / Dpto.:</strong> ${params.departmentName}</li>
          <li><strong>Proyecto:</strong> ${params.projectName}</li>
          <li><strong>Fechas:</strong> ${params.startDate} al ${params.endDate}</li>
          <li><strong>Equipos:</strong> ${params.itemsSummary}</li>
        </ul>
        <p style="margin-top: 20px;">
          <a href="${portalUrl}/admin/pedidos" style="display: inline-block; background-color: #4F46E5; color: white; text-decoration: none; padding: 10px 18px; border-radius: 6px; font-size: 14px; font-weight: bold;">
            Abrir Panel de Pedidos
          </a>
        </p>
      </div>
    </div>
  `;
}

export function getLoanApprovedEmail(
  code: string,
  applicantName: string,
  pickupTime: string,
  startDate: string
): string {
  const portalUrl = process.env.NEXTAUTH_URL || "https://prestamoequipos.comunidaio.com";
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
        <p style="margin-top: 20px;">
          <a href="${portalUrl}/consultar" style="display: inline-block; background-color: #10b981; color: white; text-decoration: none; padding: 10px 18px; border-radius: 6px; font-size: 14px; font-weight: bold;">
            Ver Pedido y Descargar Acta PDF
          </a>
        </p>
      </div>
    </div>
  `;
}

export function getLoanRejectedEmail(
  code: string,
  applicantName: string,
  reason: string
): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937; line-height: 1.5;">
      <div style="background-color: #e11d48; padding: 20px; text-align: center; color: white;">
        <h2 style="margin: 0;">Actualización sobre tu Solicitud ${code}</h2>
        <p style="margin: 5px 0 0 0; font-size: 14px;">Secretaría de Cultura y Comunicación - UNLa</p>
      </div>
      <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none;">
        <p>Hola <strong>${applicantName}</strong>,</p>
        <p>Te informamos que tu solicitud de préstamo <strong>${code}</strong> no pudo ser aprobada en esta oportunidad.</p>
        <div style="background-color: #fff1f2; border: 1px solid #fecdd3; padding: 16px; border-radius: 6px; margin: 16px 0; color: #881337;">
          <strong>Motivo informado:</strong><br/>
          ${reason}
        </div>
        <p style="color: #6b7280; font-size: 13px;">
          Ante cualquier consulta o para coordinar una alternativa, podés comunicarte con la Secretaría de Cultura y Comunicación.
        </p>
      </div>
    </div>
  `;
}

export function getBlockoutAffectedEmail(
  code: string,
  applicantName: string,
  blockoutReason: string
): string {
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
