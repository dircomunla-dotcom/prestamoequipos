import { jsPDF } from "jspdf";
import { LoanRequestDetail, EquipmentItem } from "@/types";
import { APP_CONFIG } from "./config";

export function generateLoanAgreementPDF(loan: LoanRequestDetail, equipments: EquipmentItem[]): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = 18;

  // ENCABEZADO INSTITUCIONAL
  doc.setFillColor(79, 70, 229); // Accent Color (#4F46E5)
  doc.rect(margin, y, contentWidth, 2, "F");
  y += 7;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(30, 27, 75); // Dark Purple/Navy
  doc.text("UNIVERSIDAD NACIONAL DE LANÚS", pageWidth / 2, y, { align: "center" });
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(75, 85, 99);
  doc.text("Secretaría de Cultura y Comunicación — Gestión de Equipamiento Audiovisual", pageWidth / 2, y, {
    align: "center",
  });
  y += 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(31, 41, 55);
  doc.text("ACTA DE PRÉSTAMO Y COMPROMISO DE CUSTODIA", pageWidth / 2, y, { align: "center" });
  y += 4;

  doc.setDrawColor(229, 231, 235);
  doc.line(margin, y, margin + contentWidth, y);
  y += 6;

  // CAJA DE CÓDIGO Y ESTADO
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(margin, y, contentWidth, 12, 1.5, 1.5, "F");
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(17, 24, 39);
  doc.text(`CÓDIGO DE SEGUIMIENTO: ${loan.code}`, margin + 5, y + 7.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Emisión: ${new Date().toLocaleDateString("es-AR")} | Estado: ${loan.status}`, margin + contentWidth - 5, y + 7.5, {
    align: "right",
  });
  y += 16;

  // 1. DATOS DE LA SOLICITUD
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(79, 70, 229);
  doc.text("1. DATOS DEL SOLICITANTE Y ESPACIO INSTITUCIONAL", margin, y);
  y += 4;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(31, 41, 55);

  const col1 = margin + 3;
  const col2 = margin + contentWidth / 2 + 3;

  doc.text(`Solicitante: ${loan.userName}`, col1, y);
  doc.text(`DNI: ${loan.applicantDni}`, col2, y);
  y += 4.5;

  doc.text(`Email institucional: ${loan.userEmail}`, col1, y);
  doc.text(`Teléfono / Celular: ${loan.applicantPhone}`, col2, y);
  y += 4.5;

  doc.text(`Espacio / Área UNLa: ${loan.departmentName}`, col1, y);
  doc.text(`Vínculo UNLa: ${loan.applicantAffiliation}`, col2, y);
  y += 4.5;

  if (loan.sponsorName) {
    doc.text(`Responsable que avala: ${loan.sponsorName} (${loan.sponsorRole || "Docente"})`, col1, y);
    doc.text(`Email responsable: ${loan.sponsorEmail || "N/A"}`, col2, y);
    y += 4.5;
  }

  y += 2;

  // 2. RETIRO, DEVOLUCIÓN Y USO
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(79, 70, 229);
  doc.text("2. FECHAS, PERSONAS AUTORIZADAS Y DESTINO", margin, y);
  y += 4;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(31, 41, 55);

  const startFmt = new Date(loan.startDate).toLocaleDateString("es-AR");
  const endFmt = new Date(loan.endDate).toLocaleDateString("es-AR");

  doc.text(`Período de préstamo: Desde el ${startFmt} (${loan.pickupTime} hs) hasta el ${endFmt} (${loan.returnTime} hs)`, col1, y);
  y += 4.5;

  doc.text(`Persona que retira: ${loan.pickupPersonName} (DNI ${loan.pickupPersonDni})`, col1, y);
  doc.text(`Persona que devuelve: ${loan.returnPersonName} (DNI ${loan.returnPersonDni})`, col2, y);
  y += 4.5;

  doc.text(`Actividad / Proyecto: ${loan.projectName}`, col1, y);
  doc.text(`Tipo de uso: ${loan.usageType}`, col2, y);
  y += 4.5;

  doc.text(`Lugar de uso: [${loan.usageLocationType === "INTERNAL" ? "Dentro de la UNLa" : "Fuera de la UNLa"}] ${loan.usageLocationDetails}`, col1, y);
  y += 7;

  // 3. DETALLE DE EQUIPAMIENTO
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(79, 70, 229);
  doc.text("3. EQUIPAMIENTO Y ACCESORIOS ENTREGADOS", margin, y);
  y += 4;

  // Tabla Header
  doc.setFillColor(238, 242, 255);
  doc.rect(margin, y, contentWidth, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(55, 48, 163);

  doc.text("CÓDIGO", margin + 3, y + 4.2);
  doc.text("DESCRIPCIÓN DEL EQUIPO Y ACCESORIOS", margin + 25, y + 4.2);
  doc.text("N° SERIE", margin + 115, y + 4.2);
  doc.text("CANT.", margin + 145, y + 4.2);
  doc.text("VALOR ESTIM.", margin + contentWidth - 3, y + 4.2, { align: "right" });
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(31, 41, 55);

  let totalValue = 0;

  for (const item of loan.items) {
    const eq = equipments.find((e) => e.id === item.equipmentId);
    const code = eq?.code || item.equipmentCode || "EQ";
    const name = eq?.name || item.equipmentName || "Equipo";
    const serial = eq?.serialNumber || "S/N";
    const val = (eq?.replacementValue || 0) * item.quantityApproved;
    totalValue += val;

    doc.setDrawColor(243, 244, 246);
    doc.line(margin, y, margin + contentWidth, y);

    doc.setFont("helvetica", "bold");
    doc.text(code, margin + 3, y + 4.5);
    doc.setFont("helvetica", "normal");
    
    // Si el nombre es largo se corta prolijo
    const truncatedName = name.length > 55 ? name.substring(0, 52) + "..." : name;
    doc.text(truncatedName, margin + 25, y + 4.5);

    doc.text(serial, margin + 115, y + 4.5);
    doc.text(item.quantityApproved.toString(), margin + 148, y + 4.5);
    doc.text(`USD $${val}`, margin + contentWidth - 3, y + 4.5, { align: "right" });

    y += 6;

    if (eq?.accessoriesSummary) {
      doc.setFontSize(7);
      doc.setTextColor(107, 114, 128);
      const accText = `Accesorios: ${eq.accessoriesSummary.substring(0, 75)}`;
      doc.text(accText, margin + 25, y + 3.5);
      y += 4.5;
      doc.setFontSize(8);
      doc.setTextColor(31, 41, 55);
    }
  }

  doc.setDrawColor(209, 213, 219);
  doc.line(margin, y, margin + contentWidth, y);
  y += 4;

  doc.setFont("helvetica", "bold");
  doc.text(`Valor total estimado de reposición: USD $${totalValue}`, margin + contentWidth - 3, y, {
    align: "right",
  });
  y += 8;

  // 4. DECLARACIÓN DE RESPONSABILIDAD
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(79, 70, 229);
  doc.text("4. TÉRMINOS Y COMPROMISO DE RESPONSABILIDAD", margin, y);
  y += 4;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(55, 65, 81);

  const legalLines = [
    "1. El solicitante y la persona que retira declaran recibir el equipamiento y sus accesorios en perfecto estado técnico y estético de operatividad.",
    "2. Se asume el compromiso formal de reintegrar la totalidad de los bienes en la fecha y horario estipulados en la Secretaría de Cultura y Comunicación.",
    "3. En caso de daño por negligencia, rotura, faltante o pérdida, el solicitante y su espacio institucional asumen la obligación de reponer los bienes o afrontar el costo de su reparación.",
    "4. El equipamiento prestado es de uso exclusivo para las actividades institucionales declaradas precedentemente.",
  ];

  for (const line of legalLines) {
    doc.text(line, margin + 2, y);
    y += 3.8;
  }

  y += 10;

  // 5. ESPACIO DE FIRMAS
  const sigBoxWidth = (contentWidth - 10) / 2;
  const sigY = y;

  // Firma Secretaría
  doc.setDrawColor(156, 163, 175);
  doc.line(margin + 5, sigY + 18, margin + sigBoxWidth - 5, sigY + 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(75, 85, 99);
  doc.text("Por Secretaría de Cultura y Comunicación", margin + sigBoxWidth / 2, sigY + 22, { align: "center" });
  doc.text("Firma, Sello y Aclaración", margin + sigBoxWidth / 2, sigY + 25.5, { align: "center" });

  // Firma Solicitante / Retira
  const sig2X = margin + sigBoxWidth + 10;
  doc.line(sig2X + 5, sigY + 18, sig2X + sigBoxWidth - 5, sigY + 18);
  doc.text("Persona que retira el equipamiento", sig2X + sigBoxWidth / 2, sigY + 22, { align: "center" });
  doc.text(`Firma y DNI: ${loan.pickupPersonDni}`, sig2X + sigBoxWidth / 2, sigY + 25.5, { align: "center" });

  return doc;
}
