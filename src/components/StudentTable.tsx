import React, { useState, useEffect } from 'react';
import type { StudentSummary } from '../types';

interface StudentTableProps {
  students: StudentSummary[];
  onStudentClick: (student: StudentSummary) => void;
}

const getRequestBadge = (student: StudentSummary) => {
    return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            {student.totalRequests} Total
        </span>
    );
};

export const StudentTable: React.FC<StudentTableProps> = ({ students, onStudentClick }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  
  // Reset to page 1 if total students change (e.g. after filtering)
  useEffect(() => {
    setCurrentPage(1);
  }, [students.length]);

  const totalPages = Math.ceil(students.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, students.length);
  const currentStudents = students.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-[#e7edf3] dark:border-gray-700 overflow-hidden flex-1 flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 dark:bg-gray-800/50 text-[#4c739a] dark:text-gray-400 text-xs uppercase font-bold tracking-wider">
            <tr>
              <th className="px-6 py-4 border-b border-[#e7edf3] dark:border-gray-700">Identidad del Estudiante</th>
              <th className="px-6 py-4 border-b border-[#e7edf3] dark:border-gray-700">Estado Académico</th>
              <th className="px-6 py-4 border-b border-[#e7edf3] dark:border-gray-700">Solicitudes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e7edf3] dark:divide-gray-700">
            {currentStudents.map((student) => (
              <tr 
                key={student.studentId} 
                onClick={() => onStudentClick(student)}
                className="group hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors cursor-pointer"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="font-bold text-[#0d141b] dark:text-white">{student.studentName}</div>
                    <div className="text-sm text-[#4c739a] dark:text-gray-400">C.I.: {student.studentId}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-[#0d141b] dark:text-gray-200">{student.semester}</div>
                  <div className="text-xs text-[#4c739a] dark:text-gray-400">Promedio: {student.gpa.toFixed(2)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col items-start gap-1">
                    {getRequestBadge(student)}
                    <span className="text-xs text-[#4c739a] dark:text-gray-400 pl-1">
                        {student.pendingReviewCount > 0 ? `${student.pendingReviewCount} Pendiente de Revisión` : '0 Pendientes'}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-[#e7edf3] dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 flex items-center justify-between mt-auto">
        <div className="text-sm text-gray-500 dark:text-gray-400">
           Mostrando <span className="font-medium">{students.length > 0 ? startIndex + 1 : 0}</span> a <span className="font-medium">{endIndex}</span> de <span className="font-medium">{students.length}</span> resultados
        </div>
        <div className="flex gap-2">
            <button 
              onClick={handlePrevPage}
              disabled={currentPage === 1 || students.length === 0}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <div className="flex items-center px-2 text-sm text-gray-600 dark:text-gray-400 font-medium">
              Página {currentPage} de {totalPages || 1}
            </div>
            <button 
              onClick={handleNextPage}
              disabled={currentPage === totalPages || students.length === 0}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
        </div>
      </div>
    </div>
  );
};
