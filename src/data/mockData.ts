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
    subject: 'Algoritmos Avanzados',
    nrc: '1234',
    comments: 'Necesito esto para graduarme',
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
    subject: 'Historia Básica',
    nrc: '5678',
    comments: 'Conflicto con algoritmos',
    responsible: 'AD',
    response: 'Aprobado'
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
    subject: 'Sistemas de Bases de Datos',
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
    subject: 'Desarrollo Web',
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
    subject: 'Análisis de Circuitos',
    nrc: '9988',
    comments: 'Se necesita exención de prerrequisito',
    responsible: 'HM',
    response: 'Consultando con el depto'
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
    subject: 'Aprendizaje Automático',
    nrc: '7766',
    comments: '¿Capacidad completa?',
    responsible: 'AD',
    response: 'El curso está lleno'
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
    subject: 'Minería de Datos',
    nrc: '7766',
    comments: '',
    responsible: 'AD',
    response: 'Conflicto de horario'
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
    subject: 'Diseño UX',
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
    subject: 'Gestión de Proyectos',
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
    subject: 'Electiva Antigua',
    nrc: '1111',
    comments: '',
    responsible: 'AD',
    response: 'Hecho'
  }
];
