import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile, UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const UserManagement: React.FC = () => {
    const { profile: currentUserProfile } = useAuth();
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [userToDelete, setUserToDelete] = useState<{ id: string, email: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

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

            // Registro de Auditoría para cambio de rol
            await supabase.from('audit_logs').insert({
                user_id: currentUserProfile?.id,
                action: 'UPDATE_USER_ROLE',
                details: {
                    target_user_id: userId,
                    new_role: newRole,
                    description: `Cambio de rol de usuario ${userId} a ${newRole}`
                }
            });
        } catch (err) {
            console.error('Error updating role:', err);
            fetchProfiles(); // Revert on error
            alert('Error al actualizar el rol');
        }
    };

    const handleDeleteUser = async () => {
        if (!userToDelete) return;

        try {
            setIsDeleting(true);
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', userToDelete.id);

            if (error) throw error;

            // Registro de Auditoría para eliminación
            await supabase.from('audit_logs').insert({
                user_id: currentUserProfile?.id,
                action: 'DELETE_USER_PROFILE',
                details: {
                    deleted_user_id: userToDelete.id,
                    deleted_user_email: userToDelete.email,
                    description: `Eliminación permanente del perfil de ${userToDelete.email}`
                }
            });

            setProfiles(prev => prev.filter(p => p.id !== userToDelete.id));
            setUserToDelete(null);
        } catch (err) {
            console.error('Error deleting user:', err);
            alert('Error al eliminar el usuario');
        } finally {
            setIsDeleting(false);
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
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${profile.role === 'administrador'
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
                                                <div className="flex items-center gap-3">
                                                    <select
                                                        value={profile.role}
                                                        onChange={(e) => handleRoleChange(profile.id, e.target.value as UserRole)}
                                                        disabled={profile.id === currentUserProfile.id}
                                                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm pl-3 pr-10 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat transition-all"
                                                    >
                                                        <option value="sin_asignar">Sin Asignar</option>
                                                        <option value="lector">Lector</option>
                                                        <option value="coordinador">Coordinador</option>
                                                        <option value="administrador">Administrador</option>
                                                    </select>

                                                    <button
                                                        onClick={() => setUserToDelete({ id: profile.id, email: profile.email })}
                                                        disabled={profile.id === currentUserProfile.id}
                                                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                                                        title="Eliminar usuario"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal de Confirmación de Eliminación */}
            {userToDelete && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-surface-dark w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-rose-50 dark:bg-rose-900/10">
                            <h2 className="text-xl font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                                <span className="material-symbols-outlined">warning</span>
                                Confirmar Eliminación
                            </h2>
                            <button
                                onClick={() => setUserToDelete(null)}
                                className="p-2 rounded-full hover:bg-rose-100 dark:hover:bg-rose-900/20 text-rose-500 transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-8 text-center">
                            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-600">
                                <span className="material-symbols-outlined text-3xl">person_remove</span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                                ¿Estás seguro?
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                                Estás a punto de eliminar el perfil de <br />
                                <span className="font-bold text-slate-900 dark:text-slate-200">{userToDelete.email}</span>.
                                <br />Esta acción no se puede deshacer.
                            </p>
                        </div>

                        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row gap-3 border-t border-slate-100 dark:border-slate-800">
                            <button
                                onClick={() => setUserToDelete(null)}
                                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDeleteUser}
                                disabled={isDeleting}
                                className="flex-[1.5] px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-200 dark:shadow-rose-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isDeleting ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <span className="material-symbols-outlined text-lg">delete_forever</span>
                                )}
                                {isDeleting ? 'Eliminando...' : 'Sí, eliminar usuario'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
