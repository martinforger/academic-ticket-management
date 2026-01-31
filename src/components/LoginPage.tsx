import React, { useState } from 'react';

interface LoginPageProps {
  onLogin: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin();
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
            <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-[#4c739a] hidden md:block">¿Necesita ayuda?</span>
                <button className="bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                    Soporte
                </button>
            </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 tech-grid relative flex items-center justify-center px-4 py-12">
            {/* Login Card */}
            <div className="w-full max-w-md bg-white dark:bg-[#1a2632] rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[#e7edf3] dark:border-slate-800 p-8 @container">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center size-14 rounded-full bg-primary/10 text-primary mb-4">
                        <span className="material-symbols-outlined text-3xl">terminal</span>
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-[#0d141b] dark:text-white">Inicio de Sesión Académico</h2>
                    <p className="text-[#4c739a] dark:text-slate-400 mt-2 text-sm">Acceso seguro para estudiantes y profesores</p>
                </div>

                {/* Form */}
                <form className="space-y-5" onSubmit={handleSubmit}>
                    {/* Email */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-[#0d141b] dark:text-slate-200" htmlFor="email">
                            Correo Electrónico
                        </label>
                        <div className="relative">
                            <input
                                className="form-input flex w-full rounded-lg text-[#0d141b] dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 border border-[#cfdbe7] dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:border-primary h-12 px-4 text-base font-normal placeholder:text-[#4c739a]/60"
                                id="email"
                                placeholder="ej., estudiante@ing.escuela.edu"
                                required
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-semibold text-[#0d141b] dark:text-slate-200" htmlFor="password">
                                Contraseña
                            </label>
                            <a className="text-xs font-bold text-primary hover:underline" href="#">¿Olvidó su contraseña?</a>
                        </div>
                        <div className="flex w-full items-stretch relative">
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

                    {/* Remember Me */}
                    <div className="flex items-center gap-2 py-1">
                        <input className="rounded border-[#cfdbe7] text-primary focus:ring-primary h-4 w-4" id="remember" type="checkbox" />
                        <label className="text-sm text-[#4c739a] dark:text-slate-400" htmlFor="remember">Recordar este dispositivo</label>
                    </div>

                    {/* Submit Button */}
                    <button className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 px-6 rounded-lg transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2" type="submit">
                        <span className="truncate">Iniciar Sesión</span>
                        <span className="material-symbols-outlined text-lg">login</span>
                    </button>
                </form>

                {/* Footer */}
                <div className="mt-8 pt-6 border-t border-[#e7edf3] dark:border-slate-800 text-center">
                    <p className="text-xs text-[#4c739a] dark:text-slate-500 leading-relaxed">
                        Al iniciar sesión, acepta nuestros <a className="underline" href="#">Términos de Servicio</a> y <a className="underline" href="#">Política de Privacidad</a>. Este es un sistema institucional seguro.
                    </p>
                </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute bottom-10 right-10 opacity-10 pointer-events-none hidden xl:block">
                <div className="size-64 bg-primary/40 rounded-full blur-[100px]"></div>
            </div>
            <div className="absolute top-10 left-10 opacity-10 pointer-events-none hidden xl:block">
                <div className="size-48 bg-primary/30 rounded-full blur-[80px]"></div>
            </div>
        </main>

        {/* Page Footer */}
        <footer className="w-full py-6 px-10 border-t border-[#e7edf3] dark:border-slate-800 bg-white dark:bg-background-dark">
            <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex gap-6 items-center">
                    <div className="h-8 w-px bg-[#e7edf3] dark:bg-slate-800 hidden md:block"></div>
                    <p className="text-sm text-[#4c739a]">© 2024 Escuela de Ingeniería Informática - Sistema de Gestión de Registro Académico</p>
                </div>
                <div className="flex gap-4">
                    <div className="size-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-full text-[#4c739a] hover:text-primary cursor-pointer transition-colors">
                        <span className="material-symbols-outlined text-lg">language</span>
                    </div>
                    <div className="size-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-full text-[#4c739a] hover:text-primary cursor-pointer transition-colors">
                        <span className="material-symbols-outlined text-lg">help_outline</span>
                    </div>
                </div>
            </div>
        </footer>
    </div>
  );
};
