export type UserRole =
  | "sin_asignar"
  | "lector"
  | "coordinador"
  | "administrador";

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  initials: string;
  full_name?: string;
}

export interface AuditLog {
  id: number;
  created_at: string;
  user_id: string;
  case_id: string;
  action: string;
  details: any;
  changes: any;
}

export type Department = "IN" | "MC" | "IS" | "LP" | "TE" | "GE" | "AT" | "PP";

export type Status =
  | "POR REVISAR"
  | "SOLUCIONADO"
  | "NO PROCEDE"
  | "EN REVISIÓN"
  | "REPETIDO"
  | "IGNORADO"
  | "REVISADO";

export interface Request {
  id: number;
  status: Status;
  classification: Department;
  caseId: string;
  date: string;
  studentId: string;
  studentName: string;
  credits: number;
  semester: string;
  gpa: number;
  authorized: boolean;
  action: string;
  subject: string;
  nrc: number;
  comments: string;
  contact: string;
  responsible: string;
  internalResponse: string;
  studentResponse: string;
}

export interface StudentSummary {
  studentId: string;
  studentName: string;
  semester: string;
  gpa: number;
  email: string;
  totalCredits: number;
  totalRequests: number;
  pendingReviewCount: number;
  requests: Request[];
}
