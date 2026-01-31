import React, { useMemo, useState } from 'react';
import { StudentFilters } from './StudentFilters';
import { StudentTable } from './StudentTable';
import { StudentRequestDetailModal } from './StudentRequestDetailModal';
import { mockRequests } from '../data/mockData';
import { groupRequestsByStudent } from '../utils/dataUtils';
import type { StudentSummary } from '../types';

export const StudentRecords: React.FC = () => {
  const students = useMemo(() => groupRequestsByStudent(mockRequests), []);
  const [selectedStudent, setSelectedStudent] = useState<StudentSummary | null>(null);

  const handleStudentClick = (student: StudentSummary) => {
    setSelectedStudent(student);
  };

  return (
    <div className="flex h-full overflow-hidden">
      <StudentFilters />
      <div className="flex-1 overflow-y-auto p-6 lg:p-10 bg-background-light dark:bg-background-dark">
         <div className="max-w-[1200px] mx-auto flex flex-col h-full min-h-min">
            {/* Page Heading */}
            <div className="flex flex-wrap justify-between gap-3 mb-8 items-end">
              <div className="flex flex-col gap-2">
                <h1 className="text-[#0d141b] dark:text-white text-3xl font-black leading-tight tracking-[-0.033em]">Solicitudes de Inscripción</h1>
                <p className="text-[#4c739a] dark:text-gray-400 text-base font-normal leading-normal">Revisar y clasificar las solicitudes de inscripción de cursos para Primavera 2024</p>
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

            {/* Filters Bar (Mobile/Tablet visible if Sidebar is hidden, or additional filters) */}
            <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
              <button className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                <span>Semestre: Todos</span>
                <span className="material-symbols-outlined text-base">keyboard_arrow_down</span>
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                <span>Rango de Promedio</span>
                <span className="material-symbols-outlined text-base">keyboard_arrow_down</span>
              </button>
               <div className="ml-auto text-sm text-gray-500 flex items-center">
                  Mostrando 1-{students.length} de 142 estudiantes
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
