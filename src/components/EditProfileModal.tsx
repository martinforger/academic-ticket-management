import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const { profile, setProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [initials, setInitials] = useState(profile?.initials || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setInitials(profile.initials || '');
    }
  }, [profile, isOpen]);

  if (!isOpen || !profile) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const trimmedName = fullName.trim();
    const trimmedInitials = initials.trim().toUpperCase();

    if (!trimmedName || !trimmedInitials) {
      setError('Nombre e iniciales son obligatorios');
      setLoading(false);
      return;
    }

    if (trimmedInitials.length > 5) {
      setError('Las iniciales no pueden exceder los 5 caracteres');
      setLoading(false);
      return;
    }

    try {
      // Check if name already exists (excluding current user)
      if (trimmedName !== profile.full_name) {
        const { data: existingName, error: nameError } = await supabase
          .from('profiles')
          .select('id')
          .eq('full_name', trimmedName)
          .neq('id', profile.id)
          .maybeSingle();

        if (nameError) throw nameError;
        if (existingName) {
          setError('Este nombre ya está en uso por otro usuario');
          setLoading(false);
          return;
        }
      }

      // Check if initials already exist (excluding current user)
      if (trimmedInitials !== profile.initials) {
        const { data: existingInitials, error: initialsError } = await supabase
          .from('profiles')
          .select('id')
          .eq('initials', trimmedInitials)
          .neq('id', profile.id)
          .maybeSingle();

        if (initialsError) throw initialsError;
        if (existingInitials) {
          setError('Estas iniciales ya están en uso por otro usuario');
          setLoading(false);
          return;
        }
      }

      // Update profile
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: trimmedName,
          initials: trimmedInitials
        })
        .eq('id', profile.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // If initials changed, update the 'responsable' field in all observations
      // assigned to this user. This prevents the lock detection from treating
      // the user's own observations as locked by "another user".
      if (trimmedInitials !== profile.initials && profile.initials) {
        const { error: observacionesError } = await supabase
          .from('observaciones')
          .update({ responsable: trimmedInitials })
          .eq('responsable', profile.initials);

        if (observacionesError) {
          console.error('Error updating observaciones responsable:', observacionesError);
          // Don't throw - profile was already updated successfully
          // Just warn the user
        }
      }

      if (data) {
        setProfile(data);
        onClose();
        alert('Perfil actualizado correctamente');
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-surface-dark w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">person_edit</span>
            Editar Perfil
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-sm font-medium border border-rose-100 dark:border-rose-900/30 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">error</span>
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">
              Nombre Completo
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm text-slate-900 dark:text-white"
              placeholder="Tu nombre completo"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">
              Iniciales (max. 5 caracteres)
            </label>
            <input
              type="text"
              value={initials}
              onChange={(e) => setInitials(e.target.value)}
              maxLength={5}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm font-mono text-slate-900 dark:text-white"
              placeholder="ABC"
            />
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-bold shadow-md shadow-primary/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <span className="material-symbols-outlined text-lg">save</span>
              )}
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
