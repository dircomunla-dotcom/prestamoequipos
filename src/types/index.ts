export type UserRole = "SOLICITANTE" | "ADMIN" | "SUPERADMIN";

export type AffiliationType =
  | "DOCENTE"
  | "NODOCENTE"
  | "ESTUDIANTE"
  | "GRADUADO"
  | "AUTORIDAD"
  | "OTRO";

export type EquipmentStatus =
  | "AVAILABLE"
  | "IN_LOAN"
  | "MAINTENANCE"
  | "OUT_OF_SERVICE";

export type LoanStatus =
  | "PENDING"
  | "APPROVED"
  | "IN_LOAN"
  | "RETURNED"
  | "RETURNED_OBSERVED"
  | "REJECTED"
  | "CANCELLED"
  | "OVERDUE";

export type BlockoutReason =
  | "SECRETARIA_INTERNAL"
  | "INSTITUTIONAL_EVENT"
  | "SCHEDULED_MAINTENANCE"
  | "REPAIR"
  | "AUTHORITY_RESERVED"
  | "EXTERNAL_LOAN"
  | "OTHER";

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  dni: string;
  phone: string;
  affiliation: AffiliationType;
  departmentId: string;
  departmentName?: string;
  avatarUrl?: string;
}

export interface AccessoryItem {
  id: string;
  name: string;
  quantity: number;
  isOptional: boolean;
}

export interface EquipmentItem {
  id: string;
  name: string;
  code: string;
  brand: string;
  model: string;
  serialNumber?: string | null;
  categoryId: string;
  categoryName?: string;
  totalUnits: number;
  availableUnits?: number;
  description: string;
  accessoriesSummary?: string | null;
  replacementValue: number;
  status: EquipmentStatus;
  requiresSpecialApproval: boolean;
  staffOnly: boolean;
  imageUrl?: string | null;
  notes?: string | null;
  accessories?: AccessoryItem[];
}

export interface KitItemDef {
  equipmentId: string;
  equipment?: EquipmentItem;
  quantity: number;
}

export interface KitDef {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl?: string | null;
  isActive: boolean;
  items: KitItemDef[];
}

export interface LoanItemDetail {
  id: string;
  equipmentId: string;
  equipmentName?: string;
  equipmentCode?: string;
  quantityRequested: number;
  quantityApproved: number;
}

export interface ChecklistItemState {
  id: string;
  name: string;
  type: "EQUIPMENT" | "ACCESSORY";
  status: "OK" | "DETAIL" | "MISSING" | "DAMAGED";
  notes?: string;
}

export interface CheckRecordDetail {
  id: string;
  loanRequestId: string;
  type: "PICKUP" | "RETURN";
  performedById: string;
  performedByName: string;
  performedAt: string;
  personName: string;
  personDni: string;
  verifiedIdentity: boolean;
  checklist: ChecklistItemState[];
  observations?: string | null;
  photosUrls?: string[];
}

export interface RequestHistoryDetail {
  id: string;
  statusFrom: string | null;
  statusTo: string;
  userId?: string | null;
  userName?: string | null;
  comment?: string | null;
  createdAt: string;
}

export interface LoanRequestDetail {
  id: string;
  code: string;
  userId: string;
  userName: string;
  userEmail: string;
  departmentId: string;
  departmentName: string;
  applicantAffiliation: string;
  applicantDni: string;
  applicantPhone: string;
  sponsorName?: string | null;
  sponsorRole?: string | null;
  sponsorEmail?: string | null;
  pickupPersonName: string;
  pickupPersonDni: string;
  pickupPersonPhone: string;
  isPickupApplicant: boolean;
  returnPersonName: string;
  returnPersonDni: string;
  returnPersonPhone: string;
  isReturnPickupSame: boolean;
  startDate: string; // ISO string
  endDate: string; // ISO string
  pickupTime: string;
  returnTime: string;
  projectName: string;
  projectDescription: string;
  usageLocationType: "INTERNAL" | "EXTERNAL";
  usageLocationDetails: string;
  usageType: string;
  operatorsCount?: number | null;
  operatorsExperience?: string | null;
  requiresTravelWarning: boolean;
  specialNotes?: string | null;
  status: LoanStatus;
  rejectionReason?: string | null;
  adminNotes?: string | null;
  termsAcceptedAt: string;
  createdAt: string;
  updatedAt: string;
  items: LoanItemDetail[];
  checkRecords?: CheckRecordDetail[];
  history?: RequestHistoryDetail[];
  hasBlockoutConflict?: boolean;
  wasModifiedByApplicant?: boolean;
  lastModifiedAt?: string;
  lastModificationSummary?: string;
}

export interface BlockoutDetail {
  id: string;
  title: string;
  reason: BlockoutReason;
  internalNotes?: string | null;
  startDate: string; // ISO
  endDate: string; // ISO
  allDay: boolean;
  isRecurring: boolean;
  recurringRule?: string | null;
  createdById: string;
  createdByName?: string;
  createdAt: string;
  items: {
    equipmentId: string;
    equipmentName: string;
    equipmentCode: string;
    quantityBlocked: number;
  }[];
}

export interface AvailabilityItemResult {
  equipmentId: string;
  totalUnits: number;
  availableUnits: number;
  isAvailable: boolean;
  reason?: string;
}

export interface ConflictLoan {
  id: string;
  code: string;
  applicantName: string;
  departmentName: string;
  startDate: string;
  endDate: string;
  status: LoanStatus;
  affectedEquipments: string[];
}
