import React from 'react';
import type { StudentSummary, GlobalStatus } from '../types';

interface StudentTableProps {
  students: StudentSummary[];
  onStudentClick: (student: StudentSummary) => void;
}

const getStatusBadge = (status: GlobalStatus) => {
  switch (status) {
    case 'Needs Attention':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
          <span className="material-symbols-outlined text-[16px]">warning</span>
          Needs Attention
        </span>
      );
    case 'Clear':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
          <span className="material-symbols-outlined text-[16px]">check_circle</span>
          Clear
        </span>
      );
    case 'Processing':
       return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
            <span className="material-symbols-outlined text-[16px]">schedule</span>
            Processing
        </span>
       );
    case 'Error':
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300">
                <span className="material-symbols-outlined text-[16px]">error</span>
                Error
            </span>
        );
  }
};

const getRequestBadge = (student: StudentSummary) => {
    if (student.globalStatus === 'Error') {
         return (
             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200">
                {student.requests.length} Rejected
             </span>
         );
    }

    return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            {student.totalRequests} Total
        </span>
    );
};

export const StudentTable: React.FC<StudentTableProps> = ({ students, onStudentClick }) => {
  return (
    <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-[#e7edf3] dark:border-gray-700 overflow-hidden flex-1 flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 dark:bg-gray-800/50 text-[#4c739a] dark:text-gray-400 text-xs uppercase font-bold tracking-wider">
            <tr>
              <th className="px-6 py-4 border-b border-[#e7edf3] dark:border-gray-700">Student Identity</th>
              <th className="px-6 py-4 border-b border-[#e7edf3] dark:border-gray-700">Academic Standing</th>
              <th className="px-6 py-4 border-b border-[#e7edf3] dark:border-gray-700">Requests</th>
              <th className="px-6 py-4 border-b border-[#e7edf3] dark:border-gray-700">Global Status</th>
              <th className="px-6 py-4 border-b border-[#e7edf3] dark:border-gray-700 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e7edf3] dark:divide-gray-700">
            {students.map((student) => (
              <tr key={student.studentId} className="group hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-4">
                    <div className="relative size-10 rounded-full bg-gray-200 overflow-hidden">
                       {student.avatarUrl ? (
                           <img alt={student.studentName} className="w-full h-full object-cover" src={student.avatarUrl} />
                       ) : (
                           <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold">
                               {student.studentName.charAt(0)}
                           </div>
                       )}
                    </div>
                    <div>
                      <div className="font-bold text-[#0d141b] dark:text-white">{student.studentName}</div>
                      <div className="text-sm text-[#4c739a] dark:text-gray-400">ID: {student.studentId} • {student.department}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-[#0d141b] dark:text-gray-200">{student.semester}</div>
                  <div className="text-xs text-[#4c739a] dark:text-gray-400">GPA: {student.gpa.toFixed(2)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col items-start gap-1">
                    {getRequestBadge(student)}
                    <span className="text-xs text-[#4c739a] dark:text-gray-400 pl-1">
                        {student.globalStatus === 'Error' ? 'Resubmission Req.' : student.pendingReviewCount > 0 ? `${student.pendingReviewCount} Pending Review` : '0 Pending'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(student.globalStatus)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                    {student.globalStatus === 'Error' ? (
                        <button
                            onClick={() => onStudentClick(student)}
                            className="text-primary hover:text-blue-700 dark:hover:text-blue-400 font-semibold text-sm inline-flex items-center gap-1"
                        >
                            Resolve
                            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                        </button>
                    ) : student.globalStatus === 'Clear' ? (
                         <button
                            onClick={() => onStudentClick(student)}
                            className="text-gray-400 hover:text-primary dark:hover:text-blue-400 font-semibold text-sm inline-flex items-center gap-1 transition-colors"
                        >
                            Details
                            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                        </button>
                    ) : (
                         <button
                            onClick={() => onStudentClick(student)}
                            className="text-primary hover:text-blue-700 dark:hover:text-blue-400 font-semibold text-sm inline-flex items-center gap-1"
                        >
                            Manage
                            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                        </button>
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-[#e7edf3] dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 flex items-center justify-between mt-auto">
        <div className="text-sm text-gray-500 dark:text-gray-400">
           Showing <span className="font-medium">1</span> to <span className="font-medium">{students.length}</span> of <span className="font-medium">142</span> results
        </div>
        <div className="flex gap-2">
            <button className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-300 disabled:opacity-50">Previous</button>
            <button className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-300">Next</button>
        </div>
      </div>
    </div>
  );
};
