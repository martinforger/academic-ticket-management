import React from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface NavigationSidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  user?: any;
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({ activePage, onNavigate }) => {
  const { profile, user } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const navItems = [
    { id: 'overview', label: 'Resumen', icon: 'dashboard' },
    { id: 'students', label: 'Estudiantes', icon: 'group' },
    { id: 'requests', label: 'Solicitudes', icon: 'assignment_late' },
  ];

  // Add Users menu for admins
  if (profile?.role === 'administrador') {
    navItems.push({ id: 'users', label: 'Usuarios', icon: 'manage_accounts' });
  }

  return (
    <aside className="w-48 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-background-dark h-full flex flex-col">
      <div className="flex flex-col h-full p-3">
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
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors w-full text-left ${isActive
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
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors mb-4 w-full text-left"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="text-sm font-medium">Cerrar Sesión</span>
          </button>
          <div className="flex items-center gap-3 px-2">

            <div className="flex flex-col min-w-0">
              <p className="text-slate-900 dark:text-white text-sm font-bold truncate">
                {user?.user_metadata?.full_name || user?.email || 'Usuario'}
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-xs truncate">
                {user?.email}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
