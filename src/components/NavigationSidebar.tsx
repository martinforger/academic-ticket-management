import React from 'react';

interface NavigationSidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({ activePage, onNavigate }) => {
  const navItems = [
    { id: 'overview', label: 'Resumen', icon: 'dashboard' },
    { id: 'students', label: 'Expedientes', icon: 'group' },
    { id: 'registration', label: 'Inscripción', icon: 'assignment' },
    { id: 'programs', label: 'Programas', icon: 'school' },
    { id: 'reports', label: 'Reportes', icon: 'bar_chart' },
  ];

  return (
    <aside className="w-64 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-background-dark h-full flex flex-col">
      <div className="flex flex-col h-full p-4">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="bg-primary rounded-lg p-2 text-white">
            <span className="material-symbols-outlined text-2xl">terminal</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-slate-900 dark:text-white text-base font-bold leading-none">Escuela II</h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">Portal de Gestión</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 grow">
          {navItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors w-full text-left ${
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium'
                }`}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="mt-auto border-t border-slate-100 dark:border-slate-800 pt-4">
          <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mb-4 w-full text-left">
            <span className="material-symbols-outlined">settings</span>
            <span className="text-sm font-medium">Configuración</span>
          </button>
          <div className="flex items-center gap-3 px-2">
            <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border border-slate-200 dark:border-slate-700" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAokehNGAMRudGKMooQvgbT-VRNKLRB90aiWU6jGw8wus4F4dYx0A0redzVFaFxmvxBYfEsa7qWGL2EAOmVBit4dlakrrdZionhj7pAFG_3nfkDmopvEq9seFedECeUvodzeX4CXSCmbRjYRmOGngHhWrPibtISYiw1zymZq3Cg3EpUMGoFlBTTPhG3Ufef2P56AAtLE_U3jpCVQDZVO6c-vYvbgQz4rOoH9PC49Z2jyvNGXYAZDJYR_bVxNlnJUYLxt36aqwresirK")' }}></div>
            <div className="flex flex-col min-w-0">
              <p className="text-slate-900 dark:text-white text-sm font-bold truncate">Dr. Aris Thorne</p>
              <p className="text-slate-500 dark:text-slate-400 text-xs truncate">Decano de Ingeniería</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
