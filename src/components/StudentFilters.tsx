import React from 'react';

interface StudentFiltersProps {
  selectedDepts: string[];
  onDeptChange: (dept: string) => void;
  selectedSemester: string;
  onSemesterChange: (semester: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
}

const DEPARTMENTS = [
  { id: 'GE', label: 'General' },
  { id: 'AT', label: 'Apoyo a la toma de decisiones' },
  { id: 'TE', label: 'Telematica' },
  { id: 'IS', label: 'Ingenieria de Software' },
  { id: 'IN', label: 'Ingles' },
  { id: 'LP', label: 'Logica y Programacion' },
  { id: 'MC', label: 'Materias comunes' },
  { id: 'PP', label: 'Practicas profesionales' },
];

const SEMESTERS = ['01SE', '02SE', '03SE', '04SE', '05SE', '06SE', '07SE', '08SE'];

const STATUSES = [
  'POR REVISAR',
  'EN REVISIÓN',
  'REVISADO',
  'SOLUCIONADO',
  'NO PROCEDE',
  'REPETIDO',
  'IGNORADO',
];

export const StudentFilters: React.FC<StudentFiltersProps> = ({
  selectedDepts,
  onDeptChange,
  selectedSemester,
  onSemesterChange,
  selectedStatus,
  onStatusChange,
}) => {
  return (
    <aside className="w-64 bg-surface-light dark:bg-surface-dark border-r border-[#e7edf3] dark:border-gray-700 flex flex-col overflow-y-auto hidden md:flex shrink-0">
      <div className="p-6 flex flex-col gap-8 h-full">
        {/* Dept Filters */}
        <div>
          <h3 className="text-[#0d141b] dark:text-white tracking-light text-sm uppercase font-bold leading-tight mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg text-primary">filter_list</span>
            Departamento
          </h3>
          <div className="flex flex-col gap-1">
            {DEPARTMENTS.map((dept) => (
              <label key={dept.id} className="flex gap-x-3 py-2 items-center group cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 -mx-2 px-2 rounded-lg transition-colors">
                <input 
                  type="checkbox" 
                  checked={selectedDepts.includes(dept.id)}
                  onChange={() => onDeptChange(dept.id)}
                  className="h-4 w-4 rounded border-[#cfdbe7] dark:border-gray-600 border-2 bg-transparent text-primary checked:bg-primary checked:border-primary focus:ring-0 focus:ring-offset-0 focus:outline-none"
                />
                <span className="text-[#0d141b] dark:text-gray-300 text-[11px] font-medium leading-tight">{dept.label} ({dept.id})</span>
              </label>
            ))}
          </div>
        </div>

        {/* Semester Filter */}
        <div>
          <h3 className="text-[#0d141b] dark:text-white tracking-light text-sm uppercase font-bold leading-tight mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg text-primary">calendar_month</span>
            Semestre
          </h3>
          <select 
            value={selectedSemester}
            onChange={(e) => onSemesterChange(e.target.value)}
            className="w-full bg-white dark:bg-surface-dark border border-[#e7edf3] dark:border-gray-700 rounded-lg p-2 text-sm text-[#0d141b] dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="All">Todos los Semestres</option>
            {SEMESTERS.map(sem => (
              <option key={sem} value={sem}>{sem}</option>
            ))}
          </select>
        </div>

        {/* Status Filters */}
        <div>
          <h3 className="text-[#0d141b] dark:text-white tracking-light text-sm uppercase font-bold leading-tight mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg text-primary">donut_large</span>
            Estado
          </h3>
          <select 
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full bg-white dark:bg-surface-dark border border-[#e7edf3] dark:border-gray-700 rounded-lg p-2 text-sm text-[#0d141b] dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="All">Todos los Estados</option>
            {STATUSES.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>
    </aside>
  );
};
