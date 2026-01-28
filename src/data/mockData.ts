import type { Request } from '../types';

export const mockRequests: Request[] = [
  // Alex Johnson - Needs Attention
  {
    caseId: '101',
    status: 'POR REVISAR',
    classification: 'CE',
    date: '2023-11-01T10:00:00Z',
    studentId: '2024001',
    studentName: 'Alex Johnson',
    gpa: 3.82,
    action: 'Agregar',
    subject: 'Advanced Algorithms',
    nrc: '1234',
    comments: 'Need this for graduation',
    responsible: 'AD',
    response: ''
  },
  {
    caseId: '102',
    status: 'SOLUCIONADO',
    classification: 'CE',
    date: '2023-11-01T10:05:00Z',
    studentId: '2024001',
    studentName: 'Alex Johnson',
    gpa: 3.82,
    action: 'Eliminar',
    subject: 'Basic History',
    nrc: '5678',
    comments: 'Conflict with algo',
    responsible: 'AD',
    response: 'Approved'
  },

  // Sarah Chen - Clear (All Solucionado)
  {
    caseId: '201',
    status: 'SOLUCIONADO',
    classification: 'IS',
    date: '2023-11-02T09:00:00Z',
    studentId: '2024045',
    studentName: 'Sarah Chen',
    gpa: 3.45,
    action: 'Agregar',
    subject: 'Database Systems',
    nrc: '2233',
    comments: '',
    responsible: 'AD',
    response: 'Ok'
  },
  {
    caseId: '202',
    status: 'SOLUCIONADO',
    classification: 'IS',
    date: '2023-11-02T09:30:00Z',
    studentId: '2024045',
    studentName: 'Sarah Chen',
    gpa: 3.45,
    action: 'Agregar',
    subject: 'Web Development',
    nrc: '4455',
    comments: '',
    responsible: 'AD',
    response: 'Ok'
  },

  // Michael Ross - Processing
  {
    caseId: '301',
    status: 'EN REVISIÓN',
    classification: 'CE',
    date: '2023-11-03T11:20:00Z',
    studentId: '2024112',
    studentName: 'Michael Ross',
    gpa: 2.90,
    action: 'Agregar',
    subject: 'Circuit Analysis',
    nrc: '9988',
    comments: 'Prerequisite waiver needed',
    responsible: 'HM',
    response: 'Checking with dept'
  },

  // David Kim - Error (No Procede)
  {
    caseId: '401',
    status: 'NO PROCEDE',
    classification: 'DS',
    date: '2023-11-04T14:15:00Z',
    studentId: '2024099',
    studentName: 'David Kim',
    gpa: 3.10,
    action: 'Agregar',
    subject: 'Machine Learning',
    nrc: '7766',
    comments: 'Full capacity?',
    responsible: 'AD',
    response: 'Course is full'
  },
   {
    caseId: '402',
    status: 'NO PROCEDE',
    classification: 'DS',
    date: '2023-11-04T14:15:00Z',
    studentId: '2024099',
    studentName: 'David Kim',
    gpa: 3.10,
    action: 'Agregar',
    subject: 'Data Mining',
    nrc: '7766',
    comments: '',
    responsible: 'AD',
    response: 'Schedule conflict'
  },

  // Emma Wilson - Processing
  {
    caseId: '501',
    status: 'POR REVISAR',
    classification: 'IS',
    date: '2023-11-05T16:00:00Z',
    studentId: '2024221',
    studentName: 'Emma Wilson',
    gpa: 3.95,
    action: 'Agregar',
    subject: 'UX Design',
    nrc: '3344',
    comments: '',
    responsible: '',
    response: ''
  },
  {
    caseId: '502',
    status: 'POR REVISAR',
    classification: 'IS',
    date: '2023-11-05T16:05:00Z',
    studentId: '2024221',
    studentName: 'Emma Wilson',
    gpa: 3.95,
    action: 'Agregar',
    subject: 'Project Management',
    nrc: '5566',
    comments: '',
    responsible: '',
    response: ''
  },
  {
    caseId: '503',
    status: 'SOLUCIONADO',
    classification: 'IS',
    date: '2023-11-05T16:10:00Z',
    studentId: '2024221',
    studentName: 'Emma Wilson',
    gpa: 3.95,
    action: 'Eliminar',
    subject: 'Old Elective',
    nrc: '1111',
    comments: '',
    responsible: 'AD',
    response: 'Done'
  }
];
