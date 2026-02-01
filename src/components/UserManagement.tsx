import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile, UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const UserManagement: React.FC = () => {
  const { profile: currentUserProfile } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data as Profile[]);
    } catch (err) {
      console.error('Error fetching profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
        // Optimistic update
        setProfiles(prev => prev.map(p => p.id === userId ? { ...p, role: newRole } : p));

        const { error } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId);

        if (error) throw error;
    } catch (err) {
        console.error('Error updating role:', err);
        fetchProfiles(); // Revert on error
        alert('Error al actualizar el rol');
    }
  };

  if (!currentUserProfile || currentUserProfile.role !== 'administrador') {
     return (
        <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
            <span className="material-symbols-outlined text-gray-300 text-8xl mb-4">lock</span>
            <h2 className="text-2xl font-bold text-slate-700 dark:text-gray-200">Acceso Restringido</h2>
            <p className="text-slate-500 max-w-md mt-2">No tienes permisos de administrador para ver esta página.</p>
        </div>
     );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background-light dark:bg-background-dark p-6 lg:p-10">
      <div className="max-w-[1200px] mx-auto w-full flex flex-col h-full gap-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
            <h1 className="text-[#0d141b] dark:text-white text-3xl font-black leading-tight tracking-tight">Gestión de Usuarios</h1>
            <p className="text-[#4c739a] dark:text-gray-400">Administra los roles y accesos del personal</p>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col flex-1">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-[#4c739a] dark:text-slate-400 text-xs uppercase font-bold tracking-wider">
                        <tr>
                            <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">Usuario</th>
                            <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">Iniciales</th>
                            <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">Rol Actual</th>
                            <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-48"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-10"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                                    <td className="px-6 py-4"><div className="h-8 bg-slate-200 rounded w-32"></div></td>
                                </tr>
                            ))
                        ) : (
                            profiles.map((profile) => (
                                <tr key={profile.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                                                {profile.email.slice(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-900 dark:text-white">{profile.full_name || 'Sin nombre'}</div>
                                                <div className="text-xs text-slate-500">{profile.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 font-bold border border-slate-200">
                                            {profile.initials}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                            profile.role === 'administrador' 
                                            ? 'bg-purple-100 text-purple-800 border-purple-200' 
                                            : profile.role === 'coordinador'
                                            ? 'bg-blue-100 text-blue-800 border-blue-200'
                                            : profile.role === 'lector'
                                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                            : 'bg-amber-100 text-amber-800 border-amber-200' 
                                        }`}>
                                            {profile.role.replace('_', ' ').toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <select 
                                            value={profile.role}
                                            onChange={(e) => handleRoleChange(profile.id, e.target.value as UserRole)}
                                            disabled={profile.id === currentUserProfile.id}
                                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                                        >
                                            <option value="sin_asignar">Sin Asignar</option>
                                            <option value="lector">Lector</option>
                                            <option value="coordinador">Coordinador</option>
                                            <option value="administrador">Administrador</option>
                                        </select>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
};
