import React, { useState, useEffect } from 'react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmWord?: string;
  isDeleting?: boolean;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Eliminar datos',
  description = 'Esta acción no se puede deshacer. Esto borrará permanentemente los datos.',
  confirmWord = 'ELIMINAR',
  isDeleting = false
}) => {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isConfirmDisabled = inputValue !== confirmWord || isDeleting;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="size-10 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-rose-600 dark:text-rose-500">warning</span>
            </div>
            <div className="flex-1 pt-1">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                {description}
              </p>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Escribe <strong className="text-rose-600 dark:text-rose-500 font-mono select-none">{confirmWord}</strong> para confirmar:
                </label>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={`Escribe ${confirmWord} aquí...`}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-mono text-center text-slate-900 dark:text-white transition-all"
                  autoComplete="off"
                  disabled={isDeleting}
                />
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button
                  onClick={onClose}
                  disabled={isDeleting}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isConfirmDisabled}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 text-white text-sm font-bold rounded-xl transition-all shadow-sm flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-slate-400 border-t-white"></span>
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                      Confirmar Eliminación
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
