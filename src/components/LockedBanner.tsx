import React from 'react';

interface LockedBannerProps {
  lockedBy: string;
  className?: string;
}

/**
 * Banner component to display when a request is locked by another user.
 * Shows a warning with the user's initials who has the lock.
 */
export const LockedBanner: React.FC<LockedBannerProps> = ({ lockedBy, className = '' }) => {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg ${className}`}
    >
      {/* Animated lock icon */}
      <div className="relative flex-shrink-0">
        <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-xl">
          lock
        </span>
        {/* Pulsing dot indicator */}
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
      </div>

      <div className="flex-1">
        <p className="text-sm font-bold text-amber-800 dark:text-amber-200">
          Solicitud en revisión por otro usuario
        </p>
        <p className="text-xs text-amber-600 dark:text-amber-400">
          <span className="font-bold">{lockedBy}</span> está trabajando en esta solicitud.
          Vista de solo lectura activa.
        </p>
      </div>

      {/* Live indicator */}
      <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-100 dark:bg-amber-900/40 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
          En vivo
        </span>
      </div>
    </div>
  );
};

/**
 * Compact version of the locked banner for use in list items.
 */
export const LockedBadge: React.FC<{ lockedBy: string }> = ({ lockedBy }) => {
  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-full">
      <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-[14px]">
        lock
      </span>
      <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300">
        {lockedBy}
      </span>
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
    </div>
  );
};

export default LockedBanner;
