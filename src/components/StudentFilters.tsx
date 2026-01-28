import React from 'react';

export const StudentFilters: React.FC = () => {
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
            <label className="flex gap-x-3 py-2 items-center group cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 -mx-2 px-2 rounded-lg transition-colors">
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-[#cfdbe7] dark:border-gray-600 border-2 bg-transparent text-primary checked:bg-primary checked:border-primary focus:ring-0 focus:ring-offset-0 focus:outline-none"/>
              <span className="text-[#0d141b] dark:text-gray-300 text-sm font-medium">Ing. Computación (IC)</span>
            </label>
            <label className="flex gap-x-3 py-2 items-center group cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 -mx-2 px-2 rounded-lg transition-colors">
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-[#cfdbe7] dark:border-gray-600 border-2 bg-transparent text-primary checked:bg-primary checked:border-primary focus:ring-0 focus:ring-offset-0 focus:outline-none"/>
              <span className="text-[#0d141b] dark:text-gray-300 text-sm font-medium">Sist. Información (SI)</span>
            </label>
            <label className="flex gap-x-3 py-2 items-center group cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 -mx-2 px-2 rounded-lg transition-colors">
              <input type="checkbox" className="h-4 w-4 rounded border-[#cfdbe7] dark:border-gray-600 border-2 bg-transparent text-primary checked:bg-primary checked:border-primary focus:ring-0 focus:ring-offset-0 focus:outline-none"/>
              <span className="text-[#0d141b] dark:text-gray-300 text-sm font-medium">Ing. Software (ISw)</span>
            </label>
            <label className="flex gap-x-3 py-2 items-center group cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 -mx-2 px-2 rounded-lg transition-colors">
              <input type="checkbox" className="h-4 w-4 rounded border-[#cfdbe7] dark:border-gray-600 border-2 bg-transparent text-primary checked:bg-primary checked:border-primary focus:ring-0 focus:ring-offset-0 focus:outline-none"/>
              <span className="text-[#0d141b] dark:text-gray-300 text-sm font-medium">Ciencia de Datos (CD)</span>
            </label>
          </div>
        </div>

        {/* Status Filters */}
        <div>
          <h3 className="text-[#0d141b] dark:text-white tracking-light text-sm uppercase font-bold leading-tight mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg text-primary">donut_large</span>
            Estado
          </h3>
          <div className="flex flex-col gap-1">
            <label className="flex gap-x-3 py-2 items-center group cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 -mx-2 px-2 rounded-lg transition-colors">
              <input type="radio" name="status" defaultChecked className="h-4 w-4 border-[#cfdbe7] dark:border-gray-600 border-2 bg-transparent text-primary checked:bg-primary checked:border-primary focus:ring-0 focus:ring-offset-0 focus:outline-none"/>
              <span className="text-[#0d141b] dark:text-gray-300 text-sm font-medium">Todas las Solicitudes</span>
            </label>
            <label className="flex gap-x-3 py-2 items-center group cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 -mx-2 px-2 rounded-lg transition-colors">
              <input type="radio" name="status" className="h-4 w-4 border-[#cfdbe7] dark:border-gray-600 border-2 bg-transparent text-primary checked:bg-primary checked:border-primary focus:ring-0 focus:ring-offset-0 focus:outline-none"/>
              <span className="text-[#0d141b] dark:text-gray-300 text-sm font-medium">Pendiente de Revisión</span>
            </label>
            <label className="flex gap-x-3 py-2 items-center group cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 -mx-2 px-2 rounded-lg transition-colors">
              <input type="radio" name="status" className="h-4 w-4 border-[#cfdbe7] dark:border-gray-600 border-2 bg-transparent text-primary checked:bg-primary checked:border-primary focus:ring-0 focus:ring-offset-0 focus:outline-none"/>
              <span className="text-[#0d141b] dark:text-gray-300 text-sm font-medium">Requiere Atención</span>
              <span className="ml-auto bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">4</span>
            </label>
            <label className="flex gap-x-3 py-2 items-center group cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 -mx-2 px-2 rounded-lg transition-colors">
              <input type="radio" name="status" className="h-4 w-4 border-[#cfdbe7] dark:border-gray-600 border-2 bg-transparent text-primary checked:bg-primary checked:border-primary focus:ring-0 focus:ring-offset-0 focus:outline-none"/>
              <span className="text-[#0d141b] dark:text-gray-300 text-sm font-medium">Procesado</span>
            </label>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-auto bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/50">
          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">Progreso de Revisión</p>
          <div className="flex items-end gap-2 mb-1">
            <span className="text-3xl font-bold text-[#0d141b] dark:text-white">84%</span>
            <span className="text-sm text-[#4c739a] dark:text-gray-400 mb-1">Completado</span>
          </div>
          <div className="w-full bg-blue-200 dark:bg-blue-900 rounded-full h-1.5 mt-2">
            <div className="bg-primary h-1.5 rounded-full" style={{ width: '84%' }}></div>
          </div>
        </div>
      </div>
    </aside>
  );
};
