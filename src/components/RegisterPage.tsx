import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface RegisterPageProps {
  onBackToLogin: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onBackToLogin }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-[#0d141b] dark:text-slate-100 min-h-screen flex flex-col">
        {/* Header */}
        <header className="w-full flex items-center justify-between border-b border-solid border-[#e7edf3] dark:border-slate-800 px-6 py-4 bg-white dark:bg-background-dark shadow-sm">
            <div className="flex items-center gap-3">
                <div className="text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
                </div>
                <div className="flex flex-col">
                    <h1 className="text-lg font-bold leading-none tracking-tight">Escuela de Ingeniería Informática</h1>
                    <p className="text-xs text-[#4c739a] font-medium uppercase tracking-wider">Sistema de Registro Académico</p>
                </div>
            </div>
            <button 
                onClick={onBackToLogin}
                className="text-primary flex items-center gap-2 font-bold text-sm hover:underline"
            >
                <span className="material-symbols-outlined text-lg">arrow_back</span>
                Volver al Login
            </button>
        </header>

        {/* Main Content */}
        <main className="flex-1 tech-grid relative flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md bg-white dark:bg-[#1a2632] rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[#e7edf3] dark:border-slate-800 p-8 @container">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center size-14 rounded-full bg-primary/10 text-primary mb-4">
                        <span className="material-symbols-outlined text-3xl">person_add</span>
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-[#0d141b] dark:text-white">Crear Cuenta Nueva</h2>
                    <p className="text-[#4c739a] dark:text-slate-400 mt-2 text-sm">Regístrese para acceder al sistema académico</p>
                </div>

                {success ? (
                    <div className="text-center space-y-4">
                        <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-900/30">
                            <span className="material-symbols-outlined text-4xl mb-2">mark_email_read</span>
                            <p className="font-semibold">¡Registro exitoso!</p>
                            <p className="text-sm mt-1">Por favor, revisa tu correo electrónico para confirmar tu cuenta antes de iniciar sesión.</p>
                        </div>
                        <button 
                            onClick={onBackToLogin}
                            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 px-6 rounded-lg transition-all"
                        >
                            Ir al Login
                        </button>
                    </div>
                ) : (
                    <form className="space-y-5" onSubmit={handleSubmit}>
                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium border border-red-100 dark:border-red-900/30">
                                {error}
                            </div>
                        )}
                        
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-[#0d141b] dark:text-slate-200" htmlFor="fullName">
                                Nombre Completo
                            </label>
                            <input
                                className="form-input flex w-full rounded-lg text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 border border-[#cfdbe7] dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:border-primary h-12 px-4 text-base font-normal placeholder:text-[#4c739a]/60"
                                id="fullName"
                                placeholder="Ej. Juan Pérez"
                                required
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                            />
                        </div>
                        
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-[#0d141b] dark:text-slate-200" htmlFor="email">
                                Correo Electrónico
                            </label>
                            <input
                                className="form-input flex w-full rounded-lg text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 border border-[#cfdbe7] dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:border-primary h-12 px-4 text-base font-normal placeholder:text-[#4c739a]/60"
                                id="email"
                                placeholder="usuario@ejemplo.com"
                                required
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-[#0d141b] dark:text-slate-200" htmlFor="password">
                                Contraseña
                            </label>
                            <div className="relative">
                                <input
                                    className="form-input flex w-full rounded-lg text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 border border-[#cfdbe7] dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:border-primary h-12 pl-4 pr-10 text-base font-normal placeholder:text-[#4c739a]/60"
                                    id="password"
                                    placeholder="Ingrese su contraseña"
                                    required
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4c739a] hover:text-primary transition-colors"
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    <span className="material-symbols-outlined text-[20px]">
                                        {showPassword ? 'visibility_off' : 'visibility'}
                                    </span>
                                </button>
                            </div>
                        </div>

                        <button 
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-bold py-3.5 px-6 rounded-lg transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2" 
                            type="submit"
                        >
                            {loading ? (
                                <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <span className="truncate">Crear Cuenta</span>
                                    <span className="material-symbols-outlined text-lg">person_add</span>
                                </>
                            )}
                        </button>
                    </form>
                )}

                <div className="mt-8 pt-6 border-t border-[#e7edf3] dark:border-slate-800 text-center">
                    <p className="text-sm text-[#4c739a] dark:text-slate-400">
                        ¿Ya tiene una cuenta?{' '}
                        <button onClick={onBackToLogin} className="text-primary font-bold hover:underline">
                            Inicie Sesión
                        </button>
                    </p>
                </div>
            </div>
        </main>
    </div>
  );
};
