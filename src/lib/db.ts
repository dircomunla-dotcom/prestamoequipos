import fs from "fs";
import os from "os";
import path from "path";
import {
  EquipmentItem,
  KitDef,
  LoanRequestDetail,
  BlockoutDetail,
  DemoUser,
  CheckRecordDetail,
  RequestHistoryDetail,
  LoanStatus,
  BlockoutReason,
  ChecklistItemState,
} from "@/types";
import {
  INITIAL_DEPARTMENTS,
  DEMO_USERS,
  INITIAL_CATEGORIES,
  INITIAL_EQUIPMENTS,
  INITIAL_KITS,
} from "./seed-data";

export interface DatabaseSchema {
  users: DemoUser[];
  departments: Array<{ id: string; name: string; code: string }>;
  categories: Array<{ id: string; name: string; slug: string; iconName: string; description: string }>;
  equipments: EquipmentItem[];
  kits: KitDef[];
  loans: LoanRequestDetail[];
  blockouts: BlockoutDetail[];
  auditLogs: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    details: string;
    userId: string;
    userName: string;
    createdAt: string;
  }>;
  settings: Record<string, any>;
}

function resolvePersistentDataDir(): string {
  if (process.env.DATA_DIR) {
    return path.resolve(process.env.DATA_DIR);
  }
  // En servidores Linux (Hostinger), cada deploy por Git reemplaza la carpeta del proyecto (process.cwd()).
  // Guardamos db.json en el directorio home del usuario (~/.prestamoequipos_data) para que sobreviva a nuevos deploys.
  if (process.platform !== "win32") {
    try {
      const homeDataDir = path.join(os.homedir(), ".prestamoequipos_data");
      if (!fs.existsSync(homeDataDir)) {
        fs.mkdirSync(homeDataDir, { recursive: true });
      }
      return homeDataDir;
    } catch {
      // Fallback si el homedir no tiene permisos de escritura
    }
  }
  return path.join(process.cwd(), "data");
}

const DATA_DIR = resolvePersistentDataDir();
const DB_FILE = path.join(DATA_DIR, "db.json");

// Función auxiliar para generar fechas relativas al día de hoy
function getRelativeDate(daysOffset: number, hours = 10): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  d.setHours(hours, 0, 0, 0);
  return d.toISOString();
}

function getInitialDatabase(): DatabaseSchema {
  const users: DemoUser[] = [...DEMO_USERS];
  const departments = [...INITIAL_DEPARTMENTS];
  const categories = [...INITIAL_CATEGORIES];

  const equipments: EquipmentItem[] = INITIAL_EQUIPMENTS.map((eq) => ({
    id: eq.id,
    name: eq.name,
    code: eq.code,
    brand: eq.brand,
    model: eq.model,
    serialNumber: eq.serialNumber,
    categoryId: categories.find((c) => c.slug === eq.categorySlug)?.id || "cat-cam",
    categoryName: categories.find((c) => c.slug === eq.categorySlug)?.name || "Cámaras",
    totalUnits: eq.totalUnits,
    description: eq.description,
    accessoriesSummary: eq.accessoriesSummary,
    replacementValue: eq.replacementValue,
    status: eq.status,
    requiresSpecialApproval: eq.requiresSpecialApproval,
    staffOnly: eq.staffOnly,
    imageUrl: eq.imageUrl,
    notes: eq.notes || null,
    accessories: eq.accessories.map((acc, idx) => ({
      id: `acc-${eq.id}-${idx + 1}`,
      name: acc.name,
      quantity: acc.quantity,
      isOptional: acc.isOptional,
    })),
  }));

  const kits: KitDef[] = INITIAL_KITS.map((k) => ({
    id: k.id,
    name: k.name,
    slug: k.slug,
    description: k.description,
    isActive: true,
    items: k.equipmentCodes.map((ec) => {
      const eq = equipments.find((e) => e.code === ec.code);
      return {
        equipmentId: eq?.id || ec.code,
        equipment: eq,
        quantity: ec.quantity,
      };
    }),
  }));

  // Bloqueos de ejemplo requeridos
  const blockouts: BlockoutDetail[] = [
    {
      id: "blk-001",
      title: "Mantenimiento Técnico Programado",
      reason: "SCHEDULED_MAINTENANCE",
      internalNotes: "Calibración óptica y balance de color en laboratorio técnico.",
      startDate: getRelativeDate(-2),
      endDate: getRelativeDate(5),
      allDay: true,
      isRecurring: false,
      createdById: "usr-admin",
      createdByName: "Lic. Laura Gómez",
      createdAt: getRelativeDate(-3),
      items: [
        {
          equipmentId: "eq-str-003",
          equipmentName: "Monitor de Campo Feelworld 7\" 4K HDMI",
          equipmentCode: "STR-003",
          quantityBlocked: 1,
        },
      ],
    },
    {
      id: "blk-002",
      title: "Cobertura Congreso Nacional de Salud Comunitaria",
      reason: "INSTITUTIONAL_EVENT",
      internalNotes: "Evento oficial UNLa en Aula Magna y transmisión por streaming.",
      startDate: getRelativeDate(3),
      endDate: getRelativeDate(5),
      allDay: true,
      isRecurring: false,
      createdById: "usr-admin",
      createdByName: "Lic. Laura Gómez",
      createdAt: getRelativeDate(-1),
      items: [
        {
          equipmentId: "eq-cam-001",
          equipmentName: "Sony Alpha a7 III (Cuerpo)",
          equipmentCode: "CAM-001",
          quantityBlocked: 1,
        },
        {
          equipmentId: "eq-str-002",
          equipmentName: "Mezclador de Video Blackmagic ATEM Mini Pro",
          equipmentCode: "STR-002",
          quantityBlocked: 1,
        },
      ],
    },
    {
      id: "blk-003",
      title: "Grabación Semanal Programa Radio UNLa (Recurrente)",
      reason: "SECRETARIA_INTERNAL",
      internalNotes: "Grabación de columna audiovisual para streaming de la radio.",
      startDate: getRelativeDate(-10),
      endDate: getRelativeDate(30),
      allDay: false,
      isRecurring: true,
      recurringRule: "TUESDAYS_10_14",
      createdById: "usr-superadmin",
      createdByName: "Ing. Carlos Menéndez",
      createdAt: getRelativeDate(-12),
      items: [
        {
          equipmentId: "eq-aud-004",
          equipmentName: "Shure SM7B Micrófono de Estudio Broadcast",
          equipmentCode: "AUD-004",
          quantityBlocked: 1,
        },
      ],
    },
    {
      id: "blk-004",
      title: "Reserva de 1 unidad para Cobertura de Prensa Institucional",
      reason: "SECRETARIA_INTERNAL",
      internalNotes: "Se bloquea 1 unidad de micrófonos inalámbricos; queda 1 unidad libre.",
      startDate: getRelativeDate(1),
      endDate: getRelativeDate(4),
      allDay: true,
      isRecurring: false,
      createdById: "usr-admin",
      createdByName: "Lic. Laura Gómez",
      createdAt: getRelativeDate(-1),
      items: [
        {
          equipmentId: "eq-aud-001",
          equipmentName: "Rode Wireless GO II (Sistema Doble)",
          equipmentCode: "AUD-001",
          quantityBlocked: 1,
        },
      ],
    },
    {
      id: "blk-005",
      title: "Reserva Institucional para Colación de Grado",
      reason: "INSTITUTIONAL_EVENT",
      internalNotes: "Acto de colación general UNLa. Solapa con pedido pendiente PRE-2026-0006.",
      startDate: getRelativeDate(2),
      endDate: getRelativeDate(4),
      allDay: true,
      isRecurring: false,
      createdById: "usr-admin",
      createdByName: "Lic. Laura Gómez",
      createdAt: getRelativeDate(0),
      items: [
        {
          equipmentId: "eq-cam-004",
          equipmentName: "Sony PXW-Z90 4K Videocámara de Mano",
          equipmentCode: "CAM-004",
          quantityBlocked: 1,
        },
      ],
    },
  ];

  // 10-12 pedidos de ejemplo repartidos en todos los estados requeridos
  const loans: LoanRequestDetail[] = [
    {
      id: "loan-001",
      code: "PRE-2026-0001",
      userId: "usr-solicitante",
      userName: "Lic. Martín Rossi",
      userEmail: "martin.rossi@unla.edu.ar",
      departmentId: "dep-dha",
      departmentName: "Departamento de Humanidades y Artes",
      applicantAffiliation: "DOCENTE",
      applicantDni: "32.456.789",
      applicantPhone: "11-4567-8901",
      pickupPersonName: "Lic. Martín Rossi",
      pickupPersonDni: "32.456.789",
      pickupPersonPhone: "11-4567-8901",
      isPickupApplicant: true,
      returnPersonName: "Lic. Martín Rossi",
      returnPersonDni: "32.456.789",
      returnPersonPhone: "11-4567-8901",
      isReturnPickupSame: true,
      startDate: getRelativeDate(1), // Retira mañana
      endDate: getRelativeDate(4),
      pickupTime: "11:00",
      returnTime: "16:00",
      projectName: "Muestra Anual de Artes Audiovisuales UNLa",
      projectDescription: "Registro en video y testimonios de estudiantes expositores.",
      usageLocationType: "INTERNAL",
      usageLocationDetails: "Edificio José Hernández - Aula Magna",
      usageType: "Registro de evento institucional",
      operatorsCount: 2,
      operatorsExperience: "Docente y ayudante de cátedra con manejo de cámaras.",
      requiresTravelWarning: false,
      status: "APPROVED",
      termsAcceptedAt: getRelativeDate(-2),
      createdAt: getRelativeDate(-2),
      updatedAt: getRelativeDate(-1),
      items: [
        {
          id: "li-001-1",
          equipmentId: "eq-cam-002",
          equipmentName: "Canon EOS R6 (Cuerpo)",
          equipmentCode: "CAM-002",
          quantityRequested: 1,
          quantityApproved: 1,
        },
        {
          id: "li-001-2",
          equipmentId: "eq-tri-001",
          equipmentName: "Trípode Manfrotto 504X con Cabezal Fluido",
          equipmentCode: "TRI-001",
          quantityRequested: 1,
          quantityApproved: 1,
        },
      ],
      history: [
        {
          id: "hist-001-1",
          statusFrom: null,
          statusTo: "PENDING",
          userName: "Lic. Martín Rossi",
          comment: "Solicitud ingresada por el portal web",
          createdAt: getRelativeDate(-2),
        },
        {
          id: "hist-001-2",
          statusFrom: "PENDING",
          statusTo: "APPROVED",
          userName: "Lic. Laura Gómez",
          comment: "Aprobado conforme. Retirar con DNI físico por la Secretaría.",
          createdAt: getRelativeDate(-1),
        },
      ],
    },
    {
      id: "loan-002",
      code: "PRE-2026-0002",
      userId: "usr-solicitante",
      userName: "Lic. Martín Rossi",
      userEmail: "martin.rossi@unla.edu.ar",
      departmentId: "dep-dha",
      departmentName: "Departamento de Humanidades y Artes",
      applicantAffiliation: "DOCENTE",
      applicantDni: "32.456.789",
      applicantPhone: "11-4567-8901",
      pickupPersonName: "Lic. Martín Rossi",
      pickupPersonDni: "32.456.789",
      pickupPersonPhone: "11-4567-8901",
      isPickupApplicant: true,
      returnPersonName: "Lic. Martín Rossi",
      returnPersonDni: "32.456.789",
      returnPersonPhone: "11-4567-8901",
      isReturnPickupSame: true,
      startDate: getRelativeDate(0), // Retirado hoy
      endDate: getRelativeDate(3),
      pickupTime: "10:30",
      returnTime: "15:00",
      projectName: "Entrevistas a Investigadores del Conurbano Sur",
      projectDescription: "Ciclo audiovisual de extensión para el canal de YouTube de la UNLa.",
      usageLocationType: "INTERNAL",
      usageLocationDetails: "Edificio Arturo Jauretche - Sala de Consejo",
      usageType: "Entrevista / Testimonial",
      operatorsCount: 1,
      operatorsExperience: "Avanzado",
      requiresTravelWarning: false,
      status: "IN_LOAN",
      termsAcceptedAt: getRelativeDate(-3),
      createdAt: getRelativeDate(-3),
      updatedAt: getRelativeDate(0),
      items: [
        {
          id: "li-002-1",
          equipmentId: "eq-opt-002",
          equipmentName: "Lente Sony FE 50mm f/1.8",
          equipmentCode: "OPT-002",
          quantityRequested: 1,
          quantityApproved: 1,
        },
        {
          id: "li-002-2",
          equipmentId: "eq-aud-002",
          equipmentName: "Rode VideoMic Pro+ Micrófono Shotgun",
          equipmentCode: "AUD-002",
          quantityRequested: 1,
          quantityApproved: 1,
        },
      ],
      checkRecords: [
        {
          id: "chk-002-pickup",
          loanRequestId: "loan-002",
          type: "PICKUP",
          performedById: "usr-admin",
          performedByName: "Lic. Laura Gómez",
          performedAt: getRelativeDate(0, 10),
          personName: "Lic. Martín Rossi",
          personDni: "32.456.789",
          verifiedIdentity: true,
          checklist: [
            { id: "c-1", name: "Lente Sony FE 50mm", type: "EQUIPMENT", status: "OK" },
            { id: "c-2", name: "Tapas delantera y trasera", type: "ACCESSORY", status: "OK" },
            { id: "c-3", name: "Rode VideoMic Pro+", type: "EQUIPMENT", status: "OK" },
            { id: "c-4", name: "Batería recargable LB-1", type: "ACCESSORY", status: "OK" },
          ],
          observations: "Equipos entregados limpios y probados.",
        },
      ],
      history: [
        {
          id: "hist-002-1",
          statusFrom: null,
          statusTo: "PENDING",
          userName: "Lic. Martín Rossi",
          comment: "Pedido creado",
          createdAt: getRelativeDate(-3),
        },
        {
          id: "hist-002-2",
          statusFrom: "PENDING",
          statusTo: "APPROVED",
          userName: "Lic. Laura Gómez",
          comment: "Aprobado",
          createdAt: getRelativeDate(-2),
        },
        {
          id: "hist-002-3",
          statusFrom: "APPROVED",
          statusTo: "IN_LOAN",
          userName: "Lic. Laura Gómez",
          comment: "Entrega registrada con DNI verificado",
          createdAt: getRelativeDate(0, 10),
        },
      ],
    },
    {
      id: "loan-003",
      code: "PRE-2026-0003",
      userId: "usr-solicitante",
      userName: "Dra. Silvina Ramos",
      userEmail: "sramos@unla.edu.ar",
      departmentId: "dep-dsc",
      departmentName: "Departamento de Salud Comunitaria",
      applicantAffiliation: "DOCENTE",
      applicantDni: "29.876.543",
      applicantPhone: "11-3456-7890",
      pickupPersonName: "Dra. Silvina Ramos",
      pickupPersonDni: "29.876.543",
      pickupPersonPhone: "11-3456-7890",
      isPickupApplicant: true,
      returnPersonName: "Dra. Silvina Ramos",
      returnPersonDni: "29.876.543",
      returnPersonPhone: "11-3456-7890",
      isReturnPickupSame: true,
      startDate: getRelativeDate(-5),
      endDate: getRelativeDate(-2),
      pickupTime: "11:00",
      returnTime: "15:00",
      projectName: "Jornada de Vacunación Comunitaria y Promoción de Salud",
      projectDescription: "Documentación audiovisual del operativo sanitario en Lanús Este.",
      usageLocationType: "EXTERNAL",
      usageLocationDetails: "Centro de Salud N° 2, Lanús Este",
      usageType: "Investigación / Proyecto de extensión",
      operatorsCount: 1,
      requiresTravelWarning: false,
      status: "RETURNED",
      termsAcceptedAt: getRelativeDate(-7),
      createdAt: getRelativeDate(-7),
      updatedAt: getRelativeDate(-2),
      items: [
        {
          id: "li-003-1",
          equipmentId: "eq-cam-006",
          equipmentName: "GoPro Hero 11 Black",
          equipmentCode: "CAM-006",
          quantityRequested: 1,
          quantityApproved: 1,
        },
      ],
      checkRecords: [
        {
          id: "chk-003-ret",
          loanRequestId: "loan-003",
          type: "RETURN",
          performedById: "usr-admin",
          performedByName: "Lic. Laura Gómez",
          performedAt: getRelativeDate(-2, 14),
          personName: "Dra. Silvina Ramos",
          personDni: "29.876.543",
          verifiedIdentity: true,
          checklist: [
            { id: "c-31", name: "GoPro Hero 11", type: "EQUIPMENT", status: "OK" },
            { id: "c-32", name: "2 Baterías Enduro", type: "ACCESSORY", status: "OK" },
          ],
          observations: "Devuelto en perfecto estado de funcionamiento y limpieza.",
        },
      ],
      history: [
        {
          id: "hist-003-3",
          statusFrom: "IN_LOAN",
          statusTo: "RETURNED",
          userName: "Lic. Laura Gómez",
          comment: "Devolución registrada en conformidad total.",
          createdAt: getRelativeDate(-2, 14),
        },
      ],
    },
    {
      id: "loan-004",
      code: "PRE-2026-0004",
      userId: "usr-solicitante",
      userName: "Est. Gonzalo Peralta",
      userEmail: "gperalta@estudiantes.unla.edu.ar",
      departmentId: "dep-lia",
      departmentName: "Licenciatura en Audiovisión",
      applicantAffiliation: "ESTUDIANTE",
      applicantDni: "43.111.222",
      applicantPhone: "11-7788-9900",
      sponsorName: "Prof. Alejandro Maci",
      sponsorRole: "Titular de Cátedra Montaje y Edición",
      sponsorEmail: "amaci@unla.edu.ar",
      pickupPersonName: "Est. Gonzalo Peralta",
      pickupPersonDni: "43.111.222",
      pickupPersonPhone: "11-7788-9900",
      isPickupApplicant: true,
      returnPersonName: "Est. Gonzalo Peralta",
      returnPersonDni: "43.111.222",
      returnPersonPhone: "11-7788-9900",
      isReturnPickupSame: true,
      startDate: getRelativeDate(-4),
      endDate: getRelativeDate(-1),
      pickupTime: "10:00",
      returnTime: "16:00",
      projectName: "Cortometraje de Ficción - Trabajo Final de Grado",
      projectDescription: "Rodaje de escenas de interior en estudio de TV de Audiovisión.",
      usageLocationType: "INTERNAL",
      usageLocationDetails: "Edificio Leonardo Favio - Estudio 1",
      usageType: "Producción audiovisual / Rodaje",
      operatorsCount: 3,
      requiresTravelWarning: false,
      status: "RETURNED_OBSERVED", // Devuelto con observaciones requeridas
      termsAcceptedAt: getRelativeDate(-6),
      createdAt: getRelativeDate(-6),
      updatedAt: getRelativeDate(-1),
      items: [
        {
          id: "li-004-1",
          equipmentId: "eq-tri-002",
          equipmentName: "Trípode Fotográfico Manfrotto 190XPRO",
          equipmentCode: "TRI-002",
          quantityRequested: 1,
          quantityApproved: 1,
        },
      ],
      checkRecords: [
        {
          id: "chk-004-ret",
          loanRequestId: "loan-004",
          type: "RETURN",
          performedById: "usr-admin",
          performedByName: "Lic. Laura Gómez",
          performedAt: getRelativeDate(-1, 15),
          personName: "Est. Gonzalo Peralta",
          personDni: "43.111.222",
          verifiedIdentity: true,
          checklist: [
            { id: "c-41", name: "Trípode Manfrotto 190XPRO", type: "EQUIPMENT", status: "DETAIL", notes: "Pequeño juego en perilla de traba de la columna central." },
            { id: "c-42", name: "Zapata 200PL", type: "ACCESSORY", status: "OK" },
          ],
          observations: "Se informa al solicitante sobre ajuste requerido en la perilla de traba.",
        },
      ],
      history: [
        {
          id: "hist-004-1",
          statusFrom: "IN_LOAN",
          statusTo: "RETURNED_OBSERVED",
          userName: "Lic. Laura Gómez",
          comment: "Devuelto con detalle menor en traba mecánica anotado.",
          createdAt: getRelativeDate(-1, 15),
        },
      ],
    },
    {
      id: "loan-005",
      code: "PRE-2026-0005",
      userId: "usr-solicitante",
      userName: "Prof. Mariana Castro",
      userEmail: "mcastro@unla.edu.ar",
      departmentId: "dep-icc",
      departmentName: "Instituto de Cultura y Comunicación",
      applicantAffiliation: "DOCENTE",
      applicantDni: "27.555.666",
      applicantPhone: "11-8899-0011",
      pickupPersonName: "Prof. Mariana Castro",
      pickupPersonDni: "27.555.666",
      pickupPersonPhone: "11-8899-0011",
      isPickupApplicant: true,
      returnPersonName: "Prof. Mariana Castro",
      returnPersonDni: "27.555.666",
      returnPersonPhone: "11-8899-0011",
      isReturnPickupSame: true,
      startDate: getRelativeDate(-4),
      endDate: getRelativeDate(-1), // Venció ayer a las 16:00 hs -> ATRASADO
      pickupTime: "11:00",
      returnTime: "16:00",
      projectName: "Registro de Taller de Muralismo Comunitario",
      projectDescription: "Taller barrial con jóvenes en Villa Jardín.",
      usageLocationType: "EXTERNAL",
      usageLocationDetails: "Plaza 20 de Junio, Lanús Oeste",
      usageType: "Registro de evento institucional",
      operatorsCount: 2,
      requiresTravelWarning: false,
      status: "OVERDUE", // Atrasado automático
      adminNotes: "Notificación de atraso enviada por correo. Pendiente regularización.",
      termsAcceptedAt: getRelativeDate(-5),
      createdAt: getRelativeDate(-5),
      updatedAt: getRelativeDate(0),
      items: [
        {
          id: "li-005-1",
          equipmentId: "eq-aud-005",
          equipmentName: "Grabador de Audio Zoom H5 Handy Recorder",
          equipmentCode: "AUD-005",
          quantityRequested: 1,
          quantityApproved: 1,
        },
        {
          id: "li-005-2",
          equipmentId: "eq-aud-007",
          equipmentName: "Auriculares Profesionales Sony MDR-7506",
          equipmentCode: "AUD-007",
          quantityRequested: 1,
          quantityApproved: 1,
        },
      ],
      history: [
        {
          id: "hist-005-1",
          statusFrom: "IN_LOAN",
          statusTo: "OVERDUE",
          userName: "Sistema Automático",
          comment: "Plazo de devolución vencido (ayer 16:00 hs) sin registro de reintegro.",
          createdAt: getRelativeDate(0, 0),
        },
      ],
    },
    {
      id: "loan-006",
      code: "PRE-2026-0006",
      userId: "usr-solicitante",
      userName: "Lic. Martín Rossi",
      userEmail: "martin.rossi@unla.edu.ar",
      departmentId: "dep-dha",
      departmentName: "Departamento de Humanidades y Artes",
      applicantAffiliation: "DOCENTE",
      applicantDni: "32.456.789",
      applicantPhone: "11-4567-8901",
      pickupPersonName: "Lic. Martín Rossi",
      pickupPersonDni: "32.456.789",
      pickupPersonPhone: "11-4567-8901",
      isPickupApplicant: true,
      returnPersonName: "Lic. Martín Rossi",
      returnPersonDni: "32.456.789",
      returnPersonPhone: "11-4567-8901",
      isReturnPickupSame: true,
      startDate: getRelativeDate(2),
      endDate: getRelativeDate(4),
      pickupTime: "10:00",
      returnTime: "15:00",
      projectName: "Registro de Acto Académico Departamental",
      projectDescription: "Grabación con videocámara de mano de la clase magistral de apertura.",
      usageLocationType: "INTERNAL",
      usageLocationDetails: "Edificio Scalabrini Ortiz - Aula Magna",
      usageType: "Registro de evento institucional",
      operatorsCount: 1,
      requiresTravelWarning: false,
      status: "PENDING",
      hasBlockoutConflict: true, // Choca con el bloqueo blk-005 para mostrar la alerta
      termsAcceptedAt: getRelativeDate(0),
      createdAt: getRelativeDate(0),
      updatedAt: getRelativeDate(0),
      items: [
        {
          id: "li-006-1",
          equipmentId: "eq-cam-004",
          equipmentName: "Sony PXW-Z90 4K Videocámara de Mano",
          equipmentCode: "CAM-004",
          quantityRequested: 1,
          quantityApproved: 1,
        },
      ],
      history: [
        {
          id: "hist-006-1",
          statusFrom: null,
          statusTo: "PENDING",
          userName: "Lic. Martín Rossi",
          comment: "Pedido creado por solicitante. Alerta: superposición con bloqueo institucional blk-005.",
          createdAt: getRelativeDate(0),
        },
      ],
    },
    {
      id: "loan-007",
      code: "PRE-2026-0007",
      userId: "usr-solicitante",
      userName: "Nodoc. Federico Álvarez",
      userEmail: "falvarez@unla.edu.ar",
      departmentId: "dep-rad",
      departmentName: "Radio Universidad UNLa",
      applicantAffiliation: "NODOCENTE",
      applicantDni: "30.123.789",
      applicantPhone: "11-5566-7788",
      pickupPersonName: "Nodoc. Federico Álvarez",
      pickupPersonDni: "30.123.789",
      pickupPersonPhone: "11-5566-7788",
      isPickupApplicant: true,
      returnPersonName: "Nodoc. Federico Álvarez",
      returnPersonDni: "30.123.789",
      returnPersonPhone: "11-5566-7788",
      isReturnPickupSame: true,
      startDate: getRelativeDate(5),
      endDate: getRelativeDate(7),
      pickupTime: "10:30",
      returnTime: "16:00",
      projectName: "Móvil de Exteriores Radio UNLa en Plaza Alsina",
      projectDescription: "Transmisión radial en vivo con micrófonos de mano dinámicos.",
      usageLocationType: "EXTERNAL",
      usageLocationDetails: "Plaza Alsina, Avellaneda",
      usageType: "Radio / Contenido sonoro",
      operatorsCount: 2,
      requiresTravelWarning: false,
      status: "PENDING",
      termsAcceptedAt: getRelativeDate(0),
      createdAt: getRelativeDate(0),
      updatedAt: getRelativeDate(0),
      items: [
        {
          id: "li-007-1",
          equipmentId: "eq-aud-003",
          equipmentName: "Shure SM58 Micrófono Dinámico Vocal",
          equipmentCode: "AUD-003",
          quantityRequested: 2,
          quantityApproved: 2,
        },
        {
          id: "li-007-2",
          equipmentId: "eq-aud-006",
          equipmentName: "Grabador de Audio Zoom H6 6 Pistas",
          equipmentCode: "AUD-006",
          quantityRequested: 1,
          quantityApproved: 1,
        },
      ],
      history: [
        {
          id: "hist-007-1",
          statusFrom: null,
          statusTo: "PENDING",
          userName: "Nodoc. Federico Álvarez",
          comment: "Pedido ingresado para revisión.",
          createdAt: getRelativeDate(0),
        },
      ],
    },
    {
      id: "loan-008",
      code: "PRE-2026-0008",
      userId: "usr-solicitante",
      userName: "Est. Lucía Benítez",
      userEmail: "lbenitez@estudiantes.unla.edu.ar",
      departmentId: "dep-ceu",
      departmentName: "Centro de Estudiantes UNLa",
      applicantAffiliation: "ESTUDIANTE",
      applicantDni: "44.999.888",
      applicantPhone: "11-9988-7766",
      sponsorName: "Prof. Alejandro Maci",
      sponsorRole: "Docente Titular",
      sponsorEmail: "amaci@unla.edu.ar",
      pickupPersonName: "Est. Lucía Benítez",
      pickupPersonDni: "44.999.888",
      pickupPersonPhone: "11-9988-7766",
      isPickupApplicant: true,
      returnPersonName: "Est. Lucía Benítez",
      returnPersonDni: "44.999.888",
      returnPersonPhone: "11-9988-7766",
      isReturnPickupSame: true,
      startDate: getRelativeDate(-8),
      endDate: getRelativeDate(-6),
      pickupTime: "11:00",
      returnTime: "16:00",
      projectName: "Festival de Bienvenida Estudiantil",
      projectDescription: "Solicitud de estabilizador motorizado DJI RS 3 Pro.",
      usageLocationType: "INTERNAL",
      usageLocationDetails: "Paseo de la Memoria UNLa",
      usageType: "Registro de evento institucional",
      status: "REJECTED",
      rejectionReason: "El estabilizador DJI RS 3 Pro requiere aprobación especial y es de uso exclusivo para personal docente/nodocente calificado según política institucional vigente.",
      termsAcceptedAt: getRelativeDate(-9),
      createdAt: getRelativeDate(-9),
      updatedAt: getRelativeDate(-8),
      items: [
        {
          id: "li-008-1",
          equipmentId: "eq-tri-004",
          equipmentName: "Gimbal Estabilizador DJI RS 3 Pro",
          equipmentCode: "TRI-004",
          quantityRequested: 1,
          quantityApproved: 0,
        },
      ],
      history: [
        {
          id: "hist-008-1",
          statusFrom: "PENDING",
          statusTo: "REJECTED",
          userName: "Lic. Laura Gómez",
          comment: "Rechazado: equipo reservado a personal capacitado.",
          createdAt: getRelativeDate(-8),
        },
      ],
    },
    {
      id: "loan-009",
      code: "PRE-2026-0009",
      userId: "usr-solicitante",
      userName: "Lic. Martín Rossi",
      userEmail: "martin.rossi@unla.edu.ar",
      departmentId: "dep-dha",
      departmentName: "Departamento de Humanidades y Artes",
      applicantAffiliation: "DOCENTE",
      applicantDni: "32.456.789",
      applicantPhone: "11-4567-8901",
      pickupPersonName: "Lic. Martín Rossi",
      pickupPersonDni: "32.456.789",
      pickupPersonPhone: "11-4567-8901",
      isPickupApplicant: true,
      returnPersonName: "Lic. Martín Rossi",
      returnPersonDni: "32.456.789",
      returnPersonPhone: "11-4567-8901",
      isReturnPickupSame: true,
      startDate: getRelativeDate(10),
      endDate: getRelativeDate(12),
      pickupTime: "10:00",
      returnTime: "17:00",
      projectName: "Jornada reprogramada",
      projectDescription: "Cancelado porque se pospuso la actividad institucional.",
      usageLocationType: "INTERNAL",
      usageLocationDetails: "Edificio Homero Manzi",
      usageType: "Docencia",
      status: "CANCELLED",
      termsAcceptedAt: getRelativeDate(-4),
      createdAt: getRelativeDate(-4),
      updatedAt: getRelativeDate(-3),
      items: [
        {
          id: "li-009-1",
          equipmentId: "eq-ilu-001",
          equipmentName: "Foco LED Godox SL60W con Trípode y Reflector",
          equipmentCode: "ILU-001",
          quantityRequested: 1,
          quantityApproved: 1,
        },
      ],
      history: [
        {
          id: "hist-009-1",
          statusFrom: "PENDING",
          statusTo: "CANCELLED",
          userName: "Lic. Martín Rossi",
          comment: "Cancelado por el solicitante por reprogramación de fecha.",
          createdAt: getRelativeDate(-3),
        },
      ],
    },
    {
      id: "loan-010",
      code: "PRE-2026-0010",
      userId: "usr-solicitante",
      userName: "Lic. Martín Rossi",
      userEmail: "martin.rossi@unla.edu.ar",
      departmentId: "dep-dha",
      departmentName: "Departamento de Humanidades y Artes",
      applicantAffiliation: "DOCENTE",
      applicantDni: "32.456.789",
      applicantPhone: "11-4567-8901",
      pickupPersonName: "Lic. Martín Rossi",
      pickupPersonDni: "32.456.789",
      pickupPersonPhone: "11-4567-8901",
      isPickupApplicant: true,
      returnPersonName: "Lic. Martín Rossi",
      returnPersonDni: "32.456.789",
      returnPersonPhone: "11-4567-8901",
      isReturnPickupSame: true,
      startDate: getRelativeDate(8),
      endDate: getRelativeDate(11),
      pickupTime: "11:00",
      returnTime: "16:00",
      projectName: "Filmación Cortometraje Institucional del Centenario",
      projectDescription: "Tomas exteriores y entrevistas con iluminación y audio profesional.",
      usageLocationType: "INTERNAL",
      usageLocationDetails: "Predio UNLa completo",
      usageType: "Producción audiovisual / Rodaje",
      operatorsCount: 3,
      requiresTravelWarning: false,
      status: "APPROVED",
      termsAcceptedAt: getRelativeDate(-1),
      createdAt: getRelativeDate(-1),
      updatedAt: getRelativeDate(0),
      items: [
        {
          id: "li-010-1",
          equipmentId: "eq-cam-003",
          equipmentName: "Blackmagic Pocket Cinema Camera 6K",
          equipmentCode: "CAM-003",
          quantityRequested: 1,
          quantityApproved: 1,
        },
        {
          id: "li-010-2",
          equipmentId: "eq-opt-005",
          equipmentName: "Lente Sigma 18-35mm f/1.8 DC HSM Art (EF)",
          equipmentCode: "OPT-005",
          quantityRequested: 1,
          quantityApproved: 1,
        },
      ],
      history: [
        {
          id: "hist-010-1",
          statusFrom: "PENDING",
          statusTo: "APPROVED",
          userName: "Lic. Laura Gómez",
          comment: "Aprobación especial concedida para rodaje institucional.",
          createdAt: getRelativeDate(0),
        },
      ],
    },
  ];

  return {
    users,
    departments,
    categories,
    equipments,
    kits,
    loans,
    blockouts,
    auditLogs: [
      {
        id: "aud-001",
        action: "INITIAL_SEED",
        entityType: "SYSTEM",
        entityId: "system",
        details: "Carga inicial de inventario, usuarios y configuraciones UNLa",
        userId: "usr-superadmin",
        userName: "Ing. Carlos Menéndez",
        createdAt: new Date().toISOString(),
      },
    ],
    settings: {
      bufferDays: 1,
      maxLoanDays: 7,
      minNoticeHours: 48,
      maxNoticeDays: 60,
      businessHours: { start: "10:00", end: "17:00" },
    },
  };
}

class Database {
  private db: DatabaseSchema | null = null;

  private ensureLoaded(): DatabaseSchema {
    if (this.db) return this.db;

    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DB_FILE)) {
      const initial = getInitialDatabase();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), "utf-8");
      this.db = initial;
      return this.db;
    }

    try {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      this.db = JSON.parse(raw);
      return this.db!;
    } catch {
      const initial = getInitialDatabase();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), "utf-8");
      this.db = initial;
      return this.db;
    }
  }

  private persist() {
    if (this.db) {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.db, null, 2), "utf-8");
    }
  }

  public resetToSeed(): DatabaseSchema {
    this.db = getInitialDatabase();
    this.persist();
    return this.db;
  }

  // USUARIOS
  public getUsers(): DemoUser[] {
    return this.ensureLoaded().users;
  }

  public getUserById(id: string): DemoUser | undefined {
    return this.getUsers().find((u) => u.id === id || u.email === id);
  }

  // DEPARTAMENTOS Y CATEGORÍAS
  public getDepartments() {
    return this.ensureLoaded().departments;
  }

  public getCategories() {
    return this.ensureLoaded().categories;
  }

  // EQUIPOS
  public getEquipments(): EquipmentItem[] {
    return this.ensureLoaded().equipments;
  }

  public getEquipmentById(id: string): EquipmentItem | undefined {
    return this.getEquipments().find((e) => e.id === id || e.code === id);
  }

  public createEquipment(item: Omit<EquipmentItem, "id">): EquipmentItem {
    const db = this.ensureLoaded();
    const newId = `eq-custom-${Date.now()}`;
    const newEquipment: EquipmentItem = { ...item, id: newId };
    db.equipments.push(newEquipment);
    this.persist();
    return newEquipment;
  }

  public updateEquipment(id: string, data: Partial<EquipmentItem>): EquipmentItem | null {
    const db = this.ensureLoaded();
    const idx = db.equipments.findIndex((e) => e.id === id);
    if (idx === -1) return null;
    db.equipments[idx] = { ...db.equipments[idx], ...data };
    this.persist();
    return db.equipments[idx];
  }

  public deleteEquipment(id: string): boolean {
    const db = this.ensureLoaded();
    const lenBefore = db.equipments.length;
    db.equipments = db.equipments.filter((e) => e.id !== id);
    if (db.equipments.length !== lenBefore) {
      this.persist();
      return true;
    }
    return false;
  }

  // KITS
  public getKits(): KitDef[] {
    const db = this.ensureLoaded();
    return db.kits.map((kit) => ({
      ...kit,
      items: kit.items.map((item) => {
        const eq = db.equipments.find((e) => e.id === item.equipmentId || e.code === item.equipmentId);
        return {
          ...item,
          equipmentId: eq?.id || item.equipmentId,
          equipment: eq || item.equipment,
        };
      }),
    }));
  }

  public getKitById(id: string): KitDef | undefined {
    return this.getKits().find((k) => k.id === id || k.slug === id);
  }

  public createKit(data: {
    name: string;
    description: string;
    isActive?: boolean;
    items: Array<{ equipmentId: string; quantity: number }>;
  }): KitDef {
    const db = this.ensureLoaded();
    const slugBase = data.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const uniqueId = `kit-${Date.now()}`;
    const slug = slugBase ? `${slugBase}-${Date.now().toString().slice(-4)}` : uniqueId;

    const hydratedItems = data.items.map((it) => {
      const eq = db.equipments.find((e) => e.id === it.equipmentId || e.code === it.equipmentId);
      return {
        equipmentId: eq?.id || it.equipmentId,
        equipment: eq,
        quantity: it.quantity,
      };
    });

    const newKit: KitDef = {
      id: uniqueId,
      name: data.name,
      slug,
      description: data.description,
      isActive: data.isActive ?? true,
      items: hydratedItems,
    };

    db.kits.push(newKit);
    this.persist();
    return newKit;
  }

  public updateKit(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      isActive: boolean;
      items: Array<{ equipmentId: string; quantity: number }>;
    }>
  ): KitDef | null {
    const db = this.ensureLoaded();
    const idx = db.kits.findIndex((k) => k.id === id);
    if (idx === -1) return null;

    const existing = db.kits[idx];
    const updatedItems = data.items
      ? data.items.map((it) => {
          const eq = db.equipments.find((e) => e.id === it.equipmentId || e.code === it.equipmentId);
          return {
            equipmentId: eq?.id || it.equipmentId,
            equipment: eq,
            quantity: it.quantity,
          };
        })
      : existing.items;

    db.kits[idx] = {
      ...existing,
      name: data.name !== undefined ? data.name : existing.name,
      description: data.description !== undefined ? data.description : existing.description,
      isActive: data.isActive !== undefined ? data.isActive : existing.isActive,
      items: updatedItems,
    };

    this.persist();
    return this.getKitById(id) || db.kits[idx];
  }

  public deleteKit(id: string): boolean {
    const db = this.ensureLoaded();
    const lenBefore = db.kits.length;
    db.kits = db.kits.filter((k) => k.id !== id);
    if (db.kits.length !== lenBefore) {
      this.persist();
      return true;
    }
    return false;
  }

  // PEDIDOS (LOANS)
  public getLoans(filters?: { status?: LoanStatus; userId?: string }): LoanRequestDetail[] {
    let loans = this.ensureLoaded().loans;
    if (filters?.status) {
      loans = loans.filter((l) => l.status === filters.status);
    }
    if (filters?.userId) {
      loans = loans.filter((l) => l.userId === filters.userId);
    }
    return loans.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getLoanById(id: string): LoanRequestDetail | undefined {
    return this.ensureLoaded().loans.find((l) => l.id === id || l.code === id);
  }

  public createLoan(data: Omit<LoanRequestDetail, "id" | "code" | "createdAt" | "updatedAt">): LoanRequestDetail {
    const db = this.ensureLoaded();
    const nextNum = (db.loans.length + 1).toString().padStart(4, "0");
    const code = `PRE-2026-${nextNum}`;
    const newId = `loan-${Date.now()}`;
    const now = new Date().toISOString();

    const newLoan: LoanRequestDetail = {
      ...data,
      id: newId,
      code,
      createdAt: now,
      updatedAt: now,
      status: "PENDING",
      history: [
        {
          id: `hist-${Date.now()}`,
          statusFrom: null,
          statusTo: "PENDING",
          userName: data.userName,
          comment: "Solicitud de préstamo creada exitosamente por el usuario.",
          createdAt: now,
        },
      ],
    };

    db.loans.unshift(newLoan);
    this.persist();
    return newLoan;
  }

  public updateLoanStatus(
    id: string,
    newStatus: LoanStatus,
    comment?: string,
    adminUser?: { id: string; name: string }
  ): LoanRequestDetail | null {
    const db = this.ensureLoaded();
    const loan = db.loans.find((l) => l.id === id);
    if (!loan) return null;

    const prevStatus = loan.status;
    loan.status = newStatus;
    loan.updatedAt = new Date().toISOString();

    if (!loan.history) loan.history = [];
    loan.history.push({
      id: `hist-${Date.now()}`,
      statusFrom: prevStatus,
      statusTo: newStatus,
      userId: adminUser?.id || null,
      userName: adminUser?.name || "Administración UNLa",
      comment: comment || `Estado modificado a ${newStatus}`,
      createdAt: new Date().toISOString(),
    });

    this.persist();
    return loan;
  }

  public updateLoanData(
    id: string,
    data: Partial<LoanRequestDetail>,
    modificationSummary?: string,
    modifierUser?: { id: string; name: string }
  ): LoanRequestDetail | null {
    const db = this.ensureLoaded();
    const loan = db.loans.find((l) => l.id === id);
    if (!loan) return null;

    const prevStatus = loan.status;
    const now = new Date().toISOString();

    // Actualizar campos
    Object.assign(loan, data);
    loan.updatedAt = now;
    loan.wasModifiedByApplicant = true;
    loan.lastModifiedAt = now;
    if (modificationSummary) {
      loan.lastModificationSummary = modificationSummary;
    }

    // Si el pedido estaba aprobado y el solicitante lo edita, vuelve a PENDING para re-evaluación
    if (prevStatus === "APPROVED") {
      loan.status = "PENDING";
    }

    if (!loan.history) loan.history = [];
    loan.history.push({
      id: `hist-${Date.now()}`,
      statusFrom: prevStatus,
      statusTo: loan.status,
      userId: modifierUser?.id || loan.userId,
      userName: modifierUser?.name || loan.userName,
      comment: modificationSummary
        ? `Modificación realizada por el solicitante: ${modificationSummary}${
            prevStatus === "APPROVED"
              ? " (El pedido requiere una nueva aprobación de la Secretaría debido a los cambios)."
              : ""
          }`
        : "Pedido actualizado por el solicitante.",
      createdAt: now,
    });

    this.persist();
    return loan;
  }

  public addCheckRecord(
    loanId: string,
    record: Omit<CheckRecordDetail, "id" | "loanRequestId" | "performedAt">
  ): CheckRecordDetail | null {
    const db = this.ensureLoaded();
    const loan = db.loans.find((l) => l.id === loanId);
    if (!loan) return null;

    if (!loan.checkRecords) loan.checkRecords = [];

    const newRecord: CheckRecordDetail = {
      ...record,
      id: `chk-${Date.now()}`,
      loanRequestId: loanId,
      performedAt: new Date().toISOString(),
    };

    loan.checkRecords.push(newRecord);

    // Si es retiro, pasa a IN_LOAN
    if (record.type === "PICKUP" && loan.status !== "IN_LOAN") {
      this.updateLoanStatus(
        loanId,
        "IN_LOAN",
        `Entrega y retiro verificado con ${record.personName} (DNI ${record.personDni}).`,
        { id: record.performedById, name: record.performedByName }
      );
    }

    // Si es devolución, pasa a RETURNED o RETURNED_OBSERVED
    if (record.type === "RETURN") {
      const hasIssues = record.checklist.some((c) => c.status === "DAMAGED" || c.status === "MISSING" || c.status === "DETAIL");
      const nextStatus = hasIssues ? "RETURNED_OBSERVED" : "RETURNED";
      this.updateLoanStatus(
        loanId,
        nextStatus,
        `Devolución registrada por ${record.performedByName}. ${hasIssues ? "Con observaciones técnicas registradas." : "Reintegro en conformidad total."}`,
        { id: record.performedById, name: record.performedByName }
      );
    }

    this.persist();
    return newRecord;
  }

  // BLOQUEOS (BLOCKOUTS)
  public getBlockouts(): BlockoutDetail[] {
    return this.ensureLoaded().blockouts.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getBlockoutById(id: string): BlockoutDetail | undefined {
    return this.ensureLoaded().blockouts.find((b) => b.id === id);
  }

  public createBlockout(data: Omit<BlockoutDetail, "id" | "createdAt">): BlockoutDetail {
    const db = this.ensureLoaded();
    const newId = `blk-${Date.now()}`;
    const newBlockout: BlockoutDetail = {
      ...data,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    db.blockouts.unshift(newBlockout);
    this.persist();
    return newBlockout;
  }

  public deleteBlockout(id: string): boolean {
    const db = this.ensureLoaded();
    const lenBefore = db.blockouts.length;
    db.blockouts = db.blockouts.filter((b) => b.id !== id);
    if (db.blockouts.length !== lenBefore) {
      this.persist();
      return true;
    }
    return false;
  }

  // AUDITORÍA
  public logAudit(action: string, entityType: string, entityId: string, details: string, user?: { id: string; name: string }) {
    const db = this.ensureLoaded();
    db.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      action,
      entityType,
      entityId,
      details,
      userId: user?.id || "system",
      userName: user?.name || "Sistema",
      createdAt: new Date().toISOString(),
    });
    this.persist();
  }

  public getAuditLogs() {
    return this.ensureLoaded().auditLogs;
  }
}

// Singleton global
export const db = new Database();
