import React, { useEffect, useState, useMemo } from 'react';
import { StudentFilters } from './StudentFilters';
import { StudentTable } from './StudentTable';
import { StudentRequestDetailModal } from './StudentRequestDetailModal';
import { groupRequestsByStudent } from '../utils/dataUtils';
import { supabase } from '../lib/supabase';
import type { Request, StudentSummary, Status } from '../types';

export const StudentRecords: React.FC = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<StudentSummary | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter state
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        // Fetch from normalized tables with joins
        const { data, error } = await supabase
          .from('observacion')
          .select(`
            obs_id,
            obs_estatus,
            obs_clasificacion,
            obs_num_caso,
            obs_fecha,
            obs_autoriza,
            obs_accion,
            obs_nrc_solicitado,
            obs_comentarios,
            obs_contacto,
            obs_responsable,
            obs_respuesta_interna,
            obs_respuesta_externa,
            estudiante (
              est_cedula,
              est_nombre,
              est_ubic_sem,
              est_promedio,
              est_creditos_acum,
              est_correo
            ),
            materia (
              mat_nombre
            )
          `);

        if (error) throw error;

        // Transformar datos de Supabase a nuestro tipo Request
        const formattedRequests: Request[] = (data || []).map((row: any) => ({
          id: row.obs_id,
          status: row.obs_estatus,
          classification: row.obs_clasificacion,
          caseId: row.obs_num_caso,
          date: row.obs_fecha,
          studentId: row.estudiante?.est_cedula?.toString() || '',
          studentName: row.estudiante?.est_nombre || 'Desconocido',
          credits: row.estudiante?.est_creditos_acum || 0,
          semester: row.estudiante?.est_ubic_sem || '',
          gpa: row.estudiante?.est_promedio || 0,
          authorized: row.obs_autoriza,
          action: row.obs_accion || '',
          subject: row.materia?.mat_nombre || '',
          nrc: row.obs_nrc_solicitado || 0,
          comments: row.obs_comentarios || '',
          contact: row.obs_contacto || '',
          responsible: row.obs_responsable || '',
          internalResponse: row.obs_respuesta_interna || '',
          studentResponse: row.obs_respuesta_externa || ''
        }));

        // Sort by caseId (obs_num_caso) ascending
        formattedRequests.sort((a, b) => (a.caseId || '').localeCompare(b.caseId || ''));

        setRequests(formattedRequests);
      } catch (err) {
        console.error('Error fetching requests:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();

    // Subscribe to realtime updates for the observacion table
    const channel = supabase
      .channel('student-records-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'observacion'
        },
        (payload) => {
          const updatedRow = payload.new as {
            obs_id: number;
            obs_estatus: string;
            obs_responsable: string;
          };

          // Update requests list
          setRequests(prev => prev.map(req => {
            if (req.id === updatedRow.obs_id) {
              return {
                ...req,
                status: updatedRow.obs_estatus as Status,
                responsible: updatedRow.obs_responsable || ''
              };
            }
            return req;
          }));

          // Update selectedStudent if it contains the updated request
          setSelectedStudent(prev => {
            if (!prev) return null;

            const requestIndex = prev.requests.findIndex(r => r.id === updatedRow.obs_id);
            if (requestIndex !== -1) {
              const newRequests = [...prev.requests];
              newRequests[requestIndex] = {
                ...newRequests[requestIndex],
                status: updatedRow.obs_estatus as Status,
                responsible: updatedRow.obs_responsable || ''
              };

              // Recalculate summary stats if needed (simplified for now as only status/responsible changed)
              return {
                ...prev,
                requests: newRequests
              };
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
      // Subject filter
      if (selectedSubject !== 'All' && r.subject !== selectedSubject) {
        return false;
      }
      return true;
    });
  }, [requests, selectedDepts, selectedSemester, selectedStatus, selectedSubject]);

  // Group by student first, then filter by search term
  const allStudents = useMemo(() => groupRequestsByStudent(filteredRequests), [filteredRequests]);

  // Unique subjects for filter
  const subjects = useMemo(() => {
    return Array.from(new Set(requests.map(r => r.subject).filter(Boolean)));
  }, [requests]);

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
    setSelectedSubject('All');
    setSearchTerm('');
  };

  const hasActiveFilters = selectedDepts.length > 0 || selectedSemester !== 'All' || selectedStatus !== 'All' || selectedSubject !== 'All' || searchTerm.trim() !== '';

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
        selectedSubject={selectedSubject}
        onSubjectChange={setSelectedSubject}
        subjects={subjects}
      />
      <div className="flex-1 overflow-y-auto p-6 lg:p-10 bg-background-light dark:bg-background-dark">
        <div className="max-w-[1200px] mx-auto flex flex-col h-full min-h-min">
          {/* Page Heading */}
          <div className="flex flex-wrap justify-between gap-4 mb-6 items-start animate-fadeInUp">
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
          <div className="mb-4 flex items-center justify-between bg-white dark:bg-slate-900 rounded-xl px-4 py-3 border border-slate-200 dark:border-slate-800 shadow-sm animate-fadeInUp" style={{ animationDelay: '100ms', opacity: 0 }}>
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
