import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export const PendingApprovalPage: React.FC = () => {
  const { user } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden animate-fade-in-up">
        <div className="bg-amber-400 p-6 flex justify-center">
            <span className="material-symbols-outlined text-white text-6xl">hourglass_top</span>
        </div>
        
        <div className="p-8 text-center">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Cuenta en Revisión</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
                Hola <span className="font-bold">{user?.email}</span>, tu cuenta ha sido creada exitosamente pero requiere aprobación de un administrador para acceder al sistema.
            </p>
            
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-lg p-4 mb-8 text-sm text-amber-800 dark:text-amber-200 text-left">
                <p className="font-bold mb-1 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">info</span>
                    Estado: Pendiente de Asignación
                </p>
                <p>
                    Un administrador asignará tu rol (Lector, Coordinador o Administrador) en breve. Por favor intenta ingresar más tarde.
                </p>
                <div className="mt-2 pt-2 border-t border-amber-200 dark:border-amber-700/50 text-xs font-mono opacity-70">
                    ID: {user?.id}
                </div>
            </div>

            <button
                onClick={handleLogout}
                className="w-full py-3 px-4 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
            >
                <span className="material-symbols-outlined">logout</span>
                Volver al Inicio
            </button>
        </div>
      </div>
    </div>
  );
};
