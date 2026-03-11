import React from 'react';
import { DEPARTMENT_COLORS, DEPARTMENT_NAMES } from '../constants/departments';

interface StudentFiltersProps {
  selectedDepts: string[];
  onDeptChange: (dept: string) => void;
  selectedSemester: string;
  onSemesterChange: (semester: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  selectedSubject: string;
  onSubjectChange: (subject: string) => void;
  subjects: string[];
  selectedResponsible?: string;
  onResponsibleChange?: (responsible: string) => void;
  responsibles?: string[];
  selectedAction?: string;
  onActionChange?: (action: string) => void;
}

const DEPARTMENTS = Object.entries(DEPARTMENT_NAMES).map(([id, label]) => ({ id, label }));

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
  selectedSubject,
  onSubjectChange,
  subjects,
  selectedResponsible,
  onResponsibleChange,
  responsibles = [],
  selectedAction,
  onActionChange,
}) => {
  return (
    <aside className="w-64 bg-surface-light dark:bg-surface-dark border-r border-[#e7edf3] dark:border-gray-700 flex flex-col overflow-y-auto hidden md:flex shrink-0">
      <div className="p-6 pb-12 flex flex-col gap-8 h-full">
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
                <span className="text-[#0d141b] dark:text-gray-300 text-[11px] font-medium leading-tight flex-1">{dept.label} ({dept.id})</span>
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: DEPARTMENT_COLORS[dept.id] || '#cbd5e1' }}
                ></span>
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

        {/* Subject Filter */}
        <div>
          <h3 className="text-[#0d141b] dark:text-white tracking-light text-sm uppercase font-bold leading-tight mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg text-primary">book</span>
            Materia
          </h3>
          <select
            value={selectedSubject}
            onChange={(e) => onSubjectChange(e.target.value)}
            className="w-full bg-white dark:bg-surface-dark border border-[#e7edf3] dark:border-gray-700 rounded-lg p-2 text-sm text-[#0d141b] dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="All">Todas las Materias</option>
            {subjects.sort().map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
        </div>

        {/* Responsible Filter */}
        {onResponsibleChange && (
          <div>
            <h3 className="text-[#0d141b] dark:text-white tracking-light text-sm uppercase font-bold leading-tight mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg text-primary">person</span>
              Responsable
            </h3>
            <select
              value={selectedResponsible}
              onChange={(e) => onResponsibleChange(e.target.value)}
              className="w-full bg-white dark:bg-surface-dark border border-[#e7edf3] dark:border-gray-700 rounded-lg p-2 text-sm text-[#0d141b] dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="All">Todos los Responsables</option>
              {responsibles.sort().map(resp => (
                <option key={resp} value={resp}>{resp}</option>
              ))}
            </select>
          </div>
        )}

        {/* Action Filter (Only for Requests View) */}
        {onActionChange && (
          <div>
            <h3 className="text-[#0d141b] dark:text-white tracking-light text-sm uppercase font-bold leading-tight mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg text-primary">touch_app</span>
              Acción
            </h3>
            <select
              value={selectedAction}
              onChange={(e) => onActionChange(e.target.value)}
              className="w-full bg-white dark:bg-surface-dark border border-[#e7edf3] dark:border-gray-700 rounded-lg p-2 text-sm text-[#0d141b] dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="All">Todas las Acciones</option>
              <option value="Agregar">Agregar</option>
              <option value="Eliminar">Eliminar</option>
            </select>
          </div>
        )}

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
