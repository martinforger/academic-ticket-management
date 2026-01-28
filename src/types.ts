export type Department = 'IN' | 'MC' | 'IS' | 'LP' | 'TE' | 'GE' | 'AT' | 'PP' | 'CE' | 'SE' | 'DS'; // Added CE, SE, DS from design reference

export type Status = 'POR REVISAR' | 'SOLUCIONADO' | 'NO PROCEDE' | 'EN REVISIÓN' | 'REPETIDO/IGNORADO';

export interface Request {
  status: Status;
  classification: Department;
  caseId: string;
  date: string; // ISO string
  studentId: string;
  studentName: string;
  gpa: number;
  action: 'Agregar' | 'Eliminar';
  subject: string;
  nrc: string;
  comments: string;
  responsible: string;
  response: string;
}

export type GlobalStatus = 'Needs Attention' | 'Clear' | 'Processing' | 'Error';

export interface StudentSummary {
  studentId: string;
  studentName: string;
  department: Department; // Inferred from requests or assigned
  semester: string; // Mocked
  gpa: number;
  avatarUrl: string;
  totalRequests: number;
  pendingReviewCount: number;
  globalStatus: GlobalStatus;
  requests: Request[];
}
