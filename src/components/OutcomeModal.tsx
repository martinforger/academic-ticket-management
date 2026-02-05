import { useEffect } from 'react';

interface OutcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'success' | 'error';
  title: string;
  message: string;
}

export function OutcomeModal({ isOpen, onClose, type, title, message }: OutcomeModalProps) {
  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
      <div
        className="fixed inset-0 bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      <div className="relative transform overflow-hidden rounded-2xl bg-white dark:bg-slate-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6 animate-in fade-in zoom-in-95 duration-200">

        <div className="flex flex-col items-center text-center">
          {type === 'success' ? (
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 mb-4 animate-[bounce_1s_ease-in-out_1]">
              <span className="material-symbols-outlined text-4xl text-green-600 dark:text-green-400">check_circle</span>
            </div>
          ) : (
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-4 animate-shake">
              <span className="material-symbols-outlined text-4xl text-red-600 dark:text-red-400">error</span>
            </div>
          )}

          <h3 className="text-lg font-bold leading-6 text-slate-900 dark:text-white mb-2">
            {title}
          </h3>

          <div className="mt-2">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <button
            type="button"
            className={`inline-flex w-full justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-colors ${type === 'success'
                ? 'bg-green-600 hover:bg-green-500 focus-visible:outline-green-600'
                : 'bg-red-600 hover:bg-red-500 focus-visible:outline-red-600'
              }`}
            onClick={onClose}
          >
            {type === 'success' ? 'Aceptar' : 'Cerrar'}
          </button>
        </div>
      </div>
    </div>
  );
}
