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
  const [searchTerm, setSearchTerm] = useState('');

  // Filter state
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        // Only select the columns we need
        // Note: Cannot use .order() with "# de Caso" due to special character
        const { data, error } = await supabase
          .from('observaciones')
          .select('id, estatus, "Clasif.", "# de Caso", fecha, cédula, estudiante, "acción", "Nombre Asignatura", nrc, uc, "Sem.", "Prom.", autoriza, comentarios, contacto, responsable, "Respuesta interna", "Respuesta al Estudiante"');

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

        // Sort by caseId (# de Caso) ascending
        formattedRequests.sort((a, b) => (a.caseId || '').localeCompare(b.caseId || ''));

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

  // Group by student first, then filter by search term
  const allStudents = useMemo(() => groupRequestsByStudent(filteredRequests), [filteredRequests]);

  const students = useMemo(() => {
    if (!searchTerm.trim()) return allStudents;

    const lowerSearch = searchTerm.toLowerCase().trim();
    return allStudents.filter(student =>
      student.studentName.toLowerCase().includes(lowerSearch) ||
      student.studentId.includes(lowerSearch)
    );
  }, [allStudents, searchTerm]);

  const handleStudentClick = (student: StudentSummary) => {
    setSelectedStudent(student);
  };

  const handleDeptChange = (dept: string) => {
    setSelectedDepts(prev =>
      prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]
    );
  };

  const clearAllFilters = () => {
    setSelectedDepts([]);
    setSelectedSemester('All');
    setSelectedStatus('All');
    setSearchTerm('');
  };

  const hasActiveFilters = selectedDepts.length > 0 || selectedSemester !== 'All' || selectedStatus !== 'All' || searchTerm.trim() !== '';

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
          <div className="flex flex-wrap justify-between gap-4 mb-6 items-start">
            <div className="flex flex-col gap-1">
              <h1 className="text-[#0d141b] dark:text-white text-3xl font-black leading-tight tracking-[-0.033em]">Listado de Estudiantes</h1>
              <p className="text-[#4c739a] dark:text-gray-400 text-sm font-medium">Consulta y gestión de expedientes académicos por estudiante</p>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
              <input
                type="text"
                placeholder="Buscar por nombre o cédula..."
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              )}
            </div>
          </div>

          {/* Results Info Bar */}
          <div className="mb-4 flex items-center justify-between bg-white dark:bg-slate-900 rounded-xl px-4 py-3 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-xl">people</span>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Mostrando <span className="font-bold text-slate-900 dark:text-white">{students.length}</span>
                {students.length !== allStudents.length && (
                  <span> de <span className="font-bold text-slate-900 dark:text-white">{allStudents.length}</span></span>
                )}
                {' '}estudiantes
              </span>
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
              >
                <span className="material-symbols-outlined text-sm">filter_alt_off</span>
                Limpiar filtros
              </button>
            )}
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
