import React, { useState, useEffect } from 'react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  features: string[];
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: '¡Bienvenido al Portal de Gestión!',
    description: 'Te guiaremos por las principales funcionalidades del sistema de observaciones académicas.',
    icon: 'waving_hand',
    color: 'from-primary to-blue-600',
    features: [
      'Gestión completa de observaciones de inscripción',
      'Seguimiento en tiempo real de solicitudes',
      'Análisis y métricas del sistema',
      'Control de usuarios y permisos'
    ]
  },
  {
    id: 'dashboard',
    title: 'Resumen Ejecutivo',
    description: 'Tu centro de comando con todas las métricas importantes de un vistazo.',
    icon: 'dashboard',
    color: 'from-emerald-500 to-teal-600',
    features: [
      'Estadísticas en tiempo real (estudiantes, solicitudes activas)',
      'Tasa de solución y casos por revisar',
      'Gráfico de volumen de solicitudes (últimos 30 días)',
      'Distribución por departamento con colores oficiales',
      'Ranking de responsables por desempeño',
      'Registro de auditoría (para coordinadores y admins)'
    ]
  },
  {
    id: 'students',
    title: 'Gestión de Estudiantes',
    description: 'Consulta el historial completo de solicitudes por estudiante.',
    icon: 'group',
    color: 'from-violet-500 to-purple-600',
    features: [
      'Búsqueda por cédula o nombre del estudiante',
      'Vista agrupada de todas las solicitudes por persona',
      'Información de semestre y promedio',
      'Acceso rápido al detalle de cada caso'
    ]
  },
  {
    id: 'requests',
    title: 'Listado de Solicitudes',
    description: 'Control individual de cada observación recibida con filtros avanzados.',
    icon: 'assignment_late',
    color: 'from-amber-500 to-orange-600',
    features: [
      'Tabla con todas las solicitudes del sistema',
      'Filtros por departamento y estado',
      'Búsqueda por estudiante, materia o número de caso',
      'Modal de edición con campos de respuesta',
      'Actualización de estado con registro automático de auditoría'
    ]
  },
  {
    id: 'users',
    title: 'Gestión de Usuarios',
    description: 'Administra los usuarios del sistema y sus permisos (solo administradores).',
    icon: 'manage_accounts',
    color: 'from-rose-500 to-pink-600',
    features: [
      'Lista de todos los usuarios registrados',
      'Asignación de roles (lector, coordinador, administrador)',
      'Aprobación de nuevos usuarios pendientes',
      'Configuración de iniciales para auditoría'
    ]
  },
  {
    id: 'roles',
    title: 'Roles y Permisos',
    description: 'Cada rol tiene diferentes niveles de acceso al sistema.',
    icon: 'security',
    color: 'from-slate-600 to-slate-800',
    features: [
      '👁️ Lector: Solo visualización de datos',
      '✏️ Coordinador: Edición de solicitudes y acceso a auditoría',
      '👑 Administrador: Control total, gestión de usuarios'
    ]
  }
];

interface OnboardingTourProps {
  onComplete: () => void;
  onSkip: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');

  const step = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  const goToStep = (index: number) => {
    if (index === currentStep || isAnimating) return;
    setDirection(index > currentStep ? 'next' : 'prev');
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep(index);
      setIsAnimating(false);
    }, 150);
  };

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      goToStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      goToStep(currentStep - 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'Escape') {
        onSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        </div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-4xl mx-4">
        {/* Skip Button */}
        <button
          onClick={onSkip}
          className="absolute -top-12 right-0 text-slate-400 hover:text-white text-sm font-medium transition-colors flex items-center gap-1"
        >
          Saltar tour
          <span className="material-symbols-outlined text-lg">skip_next</span>
        </button>

        {/* Main Card */}
        <div
          className={`bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 ${isAnimating ? (direction === 'next' ? 'opacity-0 translate-x-4' : 'opacity-0 -translate-x-4') : 'opacity-100 translate-x-0'
            }`}
        >
          {/* Header with gradient */}
          <div className={`bg-gradient-to-r ${step.color} p-8 pb-16 relative overflow-hidden`}>
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-1/4 w-24 h-24 bg-white/10 rounded-full translate-y-1/2"></div>

            <div className="relative">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                  <span className="material-symbols-outlined text-4xl text-white">{step.icon}</span>
                </div>
                <div>
                  <p className="text-white/70 text-sm font-medium uppercase tracking-wider">
                    Paso {currentStep + 1} de {ONBOARDING_STEPS.length}
                  </p>
                  <h2 className="text-white text-3xl font-black">{step.title}</h2>
                </div>
              </div>
              <p className="text-white/90 text-lg max-w-2xl">{step.description}</p>
            </div>
          </div>

          {/* Features List */}
          <div className="p-8 -mt-8">
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">star</span>
                Funcionalidades Principales
              </h3>
              <ul className="space-y-3">
                {step.features.map((feature, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-slate-700 dark:text-slate-300"
                    style={{
                      animation: `fadeInUp 0.3s ease-out ${index * 0.1}s both`
                    }}
                  >
                    {!feature.startsWith('👁️') && !feature.startsWith('✏️') && !feature.startsWith('👑') && (
                      <span className="material-symbols-outlined text-emerald-500 text-lg flex-shrink-0 mt-0.5">check_circle</span>
                    )}
                    <span className={feature.startsWith('👁️') || feature.startsWith('✏️') || feature.startsWith('👑') ? 'text-base' : ''}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Navigation */}
          <div className="px-8 pb-8 flex items-center justify-between">
            {/* Step Indicators */}
            <div className="flex items-center gap-2">
              {ONBOARDING_STEPS.map((s, index) => (
                <button
                  key={s.id}
                  onClick={() => goToStep(index)}
                  className={`transition-all duration-300 rounded-full ${index === currentStep
                      ? 'w-8 h-2 bg-primary'
                      : index < currentStep
                        ? 'w-2 h-2 bg-primary/50 hover:bg-primary/70'
                        : 'w-2 h-2 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400'
                    }`}
                  aria-label={`Ir al paso ${index + 1}`}
                />
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-3">
              {!isFirstStep && (
                <button
                  onClick={handlePrev}
                  className="px-5 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-lg">arrow_back</span>
                  Anterior
                </button>
              )}
              <button
                onClick={handleNext}
                className={`px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg ${isLastStep
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:shadow-emerald-500/25 hover:scale-105'
                    : 'bg-gradient-to-r from-primary to-blue-600 text-white hover:shadow-primary/25 hover:scale-105'
                  }`}
              >
                {isLastStep ? (
                  <>
                    <span className="material-symbols-outlined text-lg">rocket_launch</span>
                    ¡Comenzar!
                  </>
                ) : (
                  <>
                    Siguiente
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Keyboard hints */}
        <div className="flex justify-center mt-6 gap-6 text-slate-400 text-xs">
          <span className="flex items-center gap-1">
            <kbd className="px-2 py-1 bg-slate-700 rounded text-slate-300 font-mono">←</kbd>
            <kbd className="px-2 py-1 bg-slate-700 rounded text-slate-300 font-mono">→</kbd>
            Navegar
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-2 py-1 bg-slate-700 rounded text-slate-300 font-mono">Enter</kbd>
            Continuar
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-2 py-1 bg-slate-700 rounded text-slate-300 font-mono">Esc</kbd>
            Saltar
          </span>
        </div>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

// Hook to manage onboarding state
export const useOnboarding = () => {
  const STORAGE_KEY = 'escuela-onboarding-completed';

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Check if user has completed onboarding
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      setShowOnboarding(true);
    }
    setIsReady(true);
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShowOnboarding(false);
  };

  const skipOnboarding = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShowOnboarding(false);
  };

  const resetOnboarding = () => {
    localStorage.removeItem(STORAGE_KEY);
    setShowOnboarding(true);
  };

  return {
    showOnboarding,
    isReady,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding
  };
};
