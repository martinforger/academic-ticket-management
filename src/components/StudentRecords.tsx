import React, { useEffect, useState, useMemo } from 'react';
import { StudentFilters } from './StudentFilters';
import { StudentTable } from './StudentTable';
import { StudentRequestDetailModal } from './StudentRequestDetailModal';
import { groupRequestsByStudent } from '../utils/dataUtils';
import { supabase } from '../lib/supabase';
import type { Request, StudentSummary } from '../types';

export const StudentRecords: React.FC = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<StudentSummary | null>(null);

  // Filter state
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        // Only select the columns we need
        const { data, error } = await supabase
          .from('observaciones')
          .select('id, estatus, "Clasif.", "# de Caso", fecha, cédula, estudiante, "acción", "Nombre Asignatura", nrc, uc, "Sem.", "Prom.", autoriza, comentarios, contacto, responsable, "Respuesta interna", "Respuesta al Estudiante"')
          .order('fecha', { ascending: false });

        if (error) throw error;

        // Transformar datos de Supabase a nuestro tipo Request
        const formattedRequests: Request[] = (data || []).map((row: any) => ({
          id: row.id,
          status: row.estatus,
          classification: row['Clasif.'],
          caseId: row['# de Caso'],
          date: row.fecha,
          studentId: row['cédula']?.toString() || '',
          studentName: row.estudiante || 'Desconocido',
          credits: row.uc || 0,
          semester: row['Sem.'] || '',
          gpa: row['Prom.'] || 0,
          authorized: row.autoriza,
          action: row['acción'] || '',
          subject: row['Nombre Asignatura'] || '',
          nrc: row.nrc || 0,
          comments: row.comentarios || '',
          contact: row.contacto || '',
          responsible: row.responsable || '',
          internalResponse: row['Respuesta interna'] || '',
          studentResponse: row['Respuesta al Estudiante'] || ''
        }));

        setRequests(formattedRequests);
      } catch (err) {
        console.error('Error fetching requests:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      // Dept filter
      if (selectedDepts.length > 0 && !selectedDepts.includes(r.classification)) {
        return false;
      }
      // Semester filter
      if (selectedSemester !== 'All' && r.semester !== selectedSemester) {
        return false;
      }
      // Status filter
      if (selectedStatus !== 'All' && r.status !== selectedStatus) {
        return false;
      }
      return true;
    });
  }, [requests, selectedDepts, selectedSemester, selectedStatus]);

  const students = useMemo(() => groupRequestsByStudent(filteredRequests), [filteredRequests]);

  const handleStudentClick = (student: StudentSummary) => {
    setSelectedStudent(student);
  };

  const handleDeptChange = (dept: string) => {
    setSelectedDepts(prev =>
      prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]
    );
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      <StudentFilters
        selectedDepts={selectedDepts}
        onDeptChange={handleDeptChange}
        selectedSemester={selectedSemester}
        onSemesterChange={setSelectedSemester}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
      />
      <div className="flex-1 overflow-y-auto p-6 lg:p-10 bg-background-light dark:bg-background-dark">
        <div className="max-w-[1200px] mx-auto flex flex-col h-full min-h-min">
          {/* Page Heading */}
          <div className="flex flex-wrap justify-between gap-3 mb-8 items-end">
            <div className="flex flex-col gap-2">
              <h1 className="text-[#0d141b] dark:text-white text-3xl font-black leading-tight tracking-[-0.033em]">Listado de Estudiantes</h1>
              <p className="text-[#4c739a] dark:text-gray-400 text-base font-normal leading-normal">Consulta y gestión de expedientes académicos por estudiante</p>
            </div>
            <div className="flex gap-3">
              <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-white dark:bg-surface-dark border border-[#e7edf3] dark:border-gray-600 text-[#0d141b] dark:text-white text-sm font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <span className="material-symbols-outlined mr-2 text-[20px]">print</span>
                <span className="truncate">Imprimir</span>
              </button>
              <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold shadow-sm hover:bg-blue-600 transition-colors">
                <span className="material-symbols-outlined mr-2 text-[20px]">download</span>
                <span className="truncate">Exportar Reporte</span>
              </button>
            </div>
          </div>

          {/* Filters Bar (Cleaned up as filters are now in sidebar) */}
          <div className="mb-6 flex gap-2 overflow-x-auto pb-2 items-center">
            <div className="text-sm text-gray-500 flex items-center">
              Mostrando {students.length} estudiantes
              {selectedDepts.length > 0 || selectedSemester !== 'All' || selectedStatus !== 'All' ? (
                <button
                  onClick={() => {
                    setSelectedDepts([]);
                    setSelectedSemester('All');
                    setSelectedStatus('All');
                  }}
                  className="ml-4 text-primary hover:underline text-xs font-bold"
                >
                  Limpiar Filtros
                </button>
              ) : null}
            </div>
          </div>

          <StudentTable students={students} onStudentClick={handleStudentClick} />
        </div>
      </div>

      <StudentRequestDetailModal
        isOpen={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        student={selectedStudent}
      />
    </div>
  );
};
