import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface UpdatePasswordPageProps {
  onBackToLogin: () => void;
}

export const UpdatePasswordPage: React.FC<UpdatePasswordPageProps> = ({ onBackToLogin }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      // Optionally log out after password change to force login with new password
      await supabase.auth.signOut();
    }
    setLoading(false);
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-[#0d141b] dark:text-slate-100 min-h-screen flex flex-col relative">
      {/* Animated Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] size-[40%] bg-primary/20 rounded-full blur-[120px] animate-drift opacity-50 dark:opacity-30 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] size-[35%] bg-purple-500/20 rounded-full blur-[120px] animate-float opacity-50 dark:opacity-30 pointer-events-none" style={{ animationDelay: '2s' }}></div>

      <main className="flex-1 tech-grid relative flex items-center justify-center px-4 py-8 z-10">
        <div className="w-full max-w-md glass-morphism dark:glass-morphism rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/50 dark:border-slate-800/50 p-8 @container animate-scaleIn relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>

          <div className="text-center mb-8 animate-fadeInUp animate-delay-100">
            <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-primary/10 text-primary mb-4 animate-float shadow-lg shadow-primary/5">
              <span className="material-symbols-outlined text-3xl">lock_reset</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-[#0d141b] dark:text-white mb-1">Nueva Contraseña</h2>
            <p className="text-[#4c739a] dark:text-slate-400 text-sm">Ingresa tu nueva clave de acceso</p>
          </div>

          {!success ? (
            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium border border-red-100 dark:border-red-900/30 animate-shake">
                  {error}
                </div>
              )}

              {/* New Password */}
              <div className="flex flex-col gap-1.5 animate-fadeInUp animate-delay-200">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#4c739a] dark:text-slate-400 ml-1" htmlFor="password">
                  Nueva Contraseña
                </label>
                <div className="group/input relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#4c739a] text-xl group-focus-within/input:text-primary transition-colors">lock</span>
                  <input
                    className="form-input flex w-full rounded-2xl text-[#0d141b] dark:text-white focus:outline-none focus:ring-4 focus:ring-primary/10 border border-[#cfdbe7] dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 focus:border-primary h-12 pl-12 pr-12 text-sm font-normal placeholder:text-[#4c739a]/40 transition-all"
                    id="password"
                    placeholder="••••••••"
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4c739a] hover:text-primary transition-colors"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-1.5 animate-fadeInUp animate-delay-300">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#4c739a] dark:text-slate-400 ml-1" htmlFor="confirmPassword">
                  Confirmar Contraseña
                </label>
                <div className="group/input relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#4c739a] text-xl group-focus-within/input:text-primary transition-colors">lock</span>
                  <input
                    className="form-input flex w-full rounded-2xl text-[#0d141b] dark:text-white focus:outline-none focus:ring-4 focus:ring-primary/10 border border-[#cfdbe7] dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 focus:border-primary h-12 pl-12 pr-4 text-sm font-normal placeholder:text-[#4c739a]/40 transition-all"
                    id="confirmPassword"
                    placeholder="••••••••"
                    required
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <button
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-black py-3.5 px-6 rounded-2xl transition-all shadow-xl shadow-primary/25 flex items-center justify-center gap-3 active:scale-[0.98] animate-fadeInUp animate-delay-400 hover-glow"
                type="submit"
              >
                {loading ? (
                  <div className="size-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span className="text-base">Actualizar Contraseña</span>
                    <span className="material-symbols-outlined text-xl">check_circle</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-6 animate-fadeInUp">
              <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm font-medium border border-green-100 dark:border-red-900/30">
                ¡Contraseña actualizada con éxito! Ya puedes iniciar sesión.
              </div>
              <button
                onClick={onBackToLogin}
                className="w-full bg-primary hover:bg-primary/90 text-white font-black py-3.5 px-6 rounded-2xl transition-all shadow-xl shadow-primary/25 flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                <span className="text-base">Ir al Login</span>
                <span className="material-symbols-outlined text-xl">login</span>
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
