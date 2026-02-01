import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface LoginPageProps {
    onRegisterClick: () => void;
    onSupportClick: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onRegisterClick, onSupportClick }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-[#0d141b] dark:text-slate-100 min-h-screen flex flex-col relative">
            {/* Animated Background Orbs */}
            <div className="absolute top-[-10%] left-[-10%] size-[40%] bg-primary/20 rounded-full blur-[120px] animate-drift opacity-50 dark:opacity-30 pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] size-[35%] bg-purple-500/20 rounded-full blur-[120px] animate-float opacity-50 dark:opacity-30 pointer-events-none" style={{ animationDelay: '2s' }}></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[50%] bg-blue-400/10 rounded-full blur-[150px] animate-pulse pointer-events-none"></div>

            {/* Header */}
            <header className="w-full flex items-center justify-between border-b border-solid border-[#e7edf3] dark:border-slate-800 px-6 py-4 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md shadow-sm z-20 animate-fadeInDown">
                <div className="flex items-center gap-3">
                    <div className="text-primary flex items-center justify-center animate-scaleIn">
                        <img src="/logo-iinf.svg" alt="Logo" className="w-32 h-10" />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-lg font-bold leading-none tracking-tight">Escuela de Ingeniería Informática - UCAB</h1>
                        <p className="text-xs text-[#4c739a] font-medium uppercase tracking-wider">Sistema de Gestión de observaciones</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={onSupportClick}
                        className="bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-lg text-sm font-bold transition-all hover:scale-105 active:scale-95"
                    >
                        Soporte
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 tech-grid relative flex items-center justify-center px-4 py-8 z-10">
                {/* Login Card */}
                <div className="w-full max-w-md glass-morphism dark:glass-morphism rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/50 dark:border-slate-800/50 p-8 @container animate-scaleIn relative overflow-hidden group">
                    {/* Subtle shine effect on hover */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>

                    {/* Card Header */}
                    <div className="text-center mb-8 animate-fadeInUp animate-delay-100">
                        <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-primary/10 text-primary mb-4 animate-float shadow-lg shadow-primary/5">
                            <span className="material-symbols-outlined text-3xl">terminal</span>
                        </div>
                        <h2 className="text-2xl font-black tracking-tight text-[#0d141b] dark:text-white mb-1">Bienvenido</h2>
                        <p className="text-[#4c739a] dark:text-slate-400 text-sm">Acceso al gestor de observaciones</p>
                    </div>

                    {/* Form */}
                    <form className="space-y-5" onSubmit={handleSubmit}>
                        {error && (
                            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium border border-red-100 dark:border-red-900/30 animate-shake">
                                {error}
                            </div>
                        )}

                        {/* Email */}
                        <div className="flex flex-col gap-1.5 animate-fadeInUp animate-delay-200">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-[#4c739a] dark:text-slate-400 ml-1" htmlFor="email">
                                Correo Electrónico
                            </label>
                            <div className="group/input relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#4c739a] text-xl group-focus-within/input:text-primary transition-colors">alternate_email</span>
                                <input
                                    className="form-input flex w-full rounded-2xl text-[#0d141b] dark:text-white focus:outline-none focus:ring-4 focus:ring-primary/10 border border-[#cfdbe7] dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 focus:border-primary h-12 pl-12 pr-4 text-sm font-normal placeholder:text-[#4c739a]/40 transition-all"
                                    id="email"
                                    placeholder="usuario@ejemplo.com"
                                    required
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="flex flex-col gap-1.5 animate-fadeInUp animate-delay-300">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-[#4c739a] dark:text-slate-400" htmlFor="password">
                                    Contraseña
                                </label>
                                <a className="text-[10px] font-bold text-primary hover:underline" href="#">¿Olvidó su contraseña?</a>
                            </div>
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

                        {/* Submit Button */}
                        <button
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-black py-3.5 px-6 rounded-2xl transition-all shadow-xl shadow-primary/25 flex items-center justify-center gap-3 active:scale-[0.98] animate-fadeInUp animate-delay-400 hover-glow"
                            type="submit"
                        >
                            {loading ? (
                                <div className="size-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <span className="text-base">Acceder al Sistema</span>
                                    <span className="material-symbols-outlined text-xl">arrow_forward_ios</span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Card Footer */}
                    <div className="mt-8 pt-6 border-t border-slate-200/50 dark:border-slate-700/50 text-center animate-fadeInUp animate-delay-500">
                        <p className="text-xs text-[#4c739a] dark:text-slate-400">
                            ¿Aún no tienes acceso?{' '}
                            <button onClick={onRegisterClick} className="text-primary font-black hover:underline ml-1">
                                Crea una cuenta aquí
                            </button>
                        </p>
                    </div>
                </div>
            </main>

            {/* Page Footer */}
            <footer className="w-full py-4 px-10 border-t border-[#e7edf3] dark:border-slate-800 bg-white/50 dark:bg-background-dark/50 z-20">
                <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex gap-6 items-center">
                        <p className="text-xs text-[#4c739a] font-medium italic opacity-70">Hecho con ❤️ para la Escuela por <a href="https://github.com/martinforger" className="text-primary font-black hover:underline ml-1">@martinforger</a></p>
                    </div>
                </div>
            </footer>
        </div>
    );
};
