import React, { useEffect } from 'react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, onClose, title, message }) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl flex flex-col items-center p-8 border border-slate-200 dark:border-slate-800 animate-in zoom-in slide-in-from-bottom-4 duration-300"
      >
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-emerald-500/20 dark:bg-emerald-500/10 rounded-full blur-xl scale-150 animate-pulse"></div>
          <div className="relative w-24 h-24 bg-emerald-50 dark:bg-emerald-500/20 rounded-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-emerald-600 dark:text-emerald-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline
                points="20 6 9 17 4 12"
                style={{
                  strokeDasharray: 50,
                  strokeDashoffset: 50,
                  animation: 'drawLine-custom 0.6s ease-out forwards 0.2s'
                }}
              />
            </svg>
          </div>
        </div>

        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 text-center tracking-tight">
          {title}
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-center text-base font-medium leading-relaxed">
          {message}
        </p>

        <div className="mt-8 w-full flex flex-col gap-3">
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Continuar
          </button>
        </div>
      </div>

      {/* Inline style for the specific stroke animation since 1000 might be too much for a small checkmark */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes drawLine-custom {
          from { stroke-dashoffset: 50; }
          to { stroke-dashoffset: 0; }
        }
      `}} />
    </div>
  );
};
