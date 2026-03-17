import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { EditProfileModal } from './EditProfileModal';

interface NavigationSidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  user?: any;
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({ activePage, onNavigate }) => {
  const { profile, user } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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
    navItems.push({ id: 'upload-projections', label: 'Datos', icon: 'database' });
  }

  // Utilities sub-items for coordinators and admins
  const isUtilityRole = profile?.role === 'coordinador' || profile?.role === 'administrador';
  const utilitySubItems = isUtilityRole ? [
    { id: 'section-balancing', label: 'Balanceo de Secciones', icon: 'balance' },
    { id: 'section-closing', label: 'Cierre de Secciones', icon: 'cancel' },
    { id: 'projection-audit', label: 'Auditoría de Proyecciones', icon: 'fact_check' },
  ] : [];
  const [utilitiesOpen, setUtilitiesOpen] = useState(false);
  const isUtilityPage = utilitySubItems.some(u => u.id === activePage);

  // Auto-expand utilities when a utility page is active
  useEffect(() => {
    if (isUtilityPage) setUtilitiesOpen(true);
  }, [isUtilityPage]);

  return (
    <>
      <aside className="w-48 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-background-dark h-full flex flex-col">
        <div className="flex flex-col h-full p-3">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="bg-primary rounded-lg p-2 text-white h-full flex items-center">
              <span className="material-symbols-outlined text-2xl">terminal</span>
            </div>
            <div className="flex flex-col gap-1">
              <h1 className="text-slate-900 dark:text-white text-base font-bold leading-snug">Ingeniería Informática</h1>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">Gestión de observaciones</p>
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

            {/* Utilities collapsible section */}
            {isUtilityRole && (
              <div>
                <button
                  onClick={() => setUtilitiesOpen(!utilitiesOpen)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors w-full text-left ${
                    isUtilityPage
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium'
                  }`}
                >
                  <span className="material-symbols-outlined">construction</span>
                  <span className="text-sm flex-1">Utilidades</span>
                  <span className={`material-symbols-outlined text-sm transition-transform ${utilitiesOpen ? 'rotate-180' : ''}`}>expand_more</span>
                </button>
                {utilitiesOpen && (
                  <div className="ml-4 mt-0.5 flex flex-col gap-0.5 border-l-2 border-slate-200 dark:border-slate-700 pl-2">
                    {utilitySubItems.map((sub) => {
                      const isSubActive = activePage === sub.id;
                      return (
                        <button
                          key={sub.id}
                          onClick={() => onNavigate(sub.id)}
                          className={`flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors w-full text-left ${isSubActive
                            ? 'bg-primary/10 text-primary font-semibold'
                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium'
                          }`}
                        >
                          <span className="material-symbols-outlined text-base">{sub.icon}</span>
                          <span className="text-xs">{sub.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </nav>

          {/* Bottom Section */}
          <div className="mt-auto border-t border-slate-100 dark:border-slate-800 pt-4">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors mb-2 w-full text-left"
            >
              <span className="material-symbols-outlined">logout</span>
              <span className="text-sm font-medium">Cerrar Sesión</span>
            </button>

            {/* Profile Edit Button */}
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mb-4 w-full text-left group"
            >
              <div className="size-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-black group-hover:bg-primary group-hover:text-white transition-all">
                {profile?.initials || '??'}
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-slate-900 dark:text-white text-sm font-bold truncate group-hover:text-primary transition-colors">
                  {profile?.full_name || user?.user_metadata?.full_name || 'Mi Perfil'}
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-[10px] truncate">
                  Configurar perfil
                </p>
              </div>
            </button>
          </div>
        </div>
      </aside>

      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </>
  );
};

