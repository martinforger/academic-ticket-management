import { useRef, useState } from 'react';

interface SemesterInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function SemesterInput({ value, onChange, disabled }: SemesterInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Focus the hidden input when clicking anywhere on the container
  const handleClick = () => {
    if (inputRef.current && !disabled) {
      inputRef.current.focus();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
    onChange(val);
  };

  // Validation Logic
  const yearStr = value.slice(0, 4);
  const period = value.length === 6 ? value.slice(4, 6) : '';

  let semesterType: 'regular' | 'intensive' | 'invalid' | null = null;
  let description = '';

  if (value.length === 6) {
    const year = parseInt(yearStr);
    const academicYear = `${year - 1}-${year}`;

    switch (period) {
      case '15':
        semesterType = 'regular';
        description = `${academicYear} Sep/Ene`;
        break;
      case '20':
        semesterType = 'intensive';
        description = `${academicYear} Febrero`;
        break;
      case '25':
        semesterType = 'regular';
        description = `${academicYear} Mar/Jul`;
        break;
      case '30':
        semesterType = 'intensive';
        description = `${academicYear} Agosto`;
        break;
      default:
        semesterType = 'invalid';
    }
  }

  // Visual slots
  const slots = Array.from({ length: 6 });

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Hidden Input */}
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        value={value}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="sr-only"
        disabled={disabled}
      />

      {/* Visual Container */}
      <div
        className={`flex gap-2 sm:gap-3 p-4 rounded-xl border-2 transition-all cursor-text ${isFocused ? 'border-primary bg-primary/5' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
          } ${semesterType === 'invalid' ? 'border-red-300 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10' : ''}`}
        onClick={handleClick}
      >
        {slots.map((_, idx) => {
          const char = value[idx] || '';
          const isNext = idx === value.length && isFocused;

          return (
            <div key={idx} className="relative">
              {/* Separator after year */}
              {idx === 4 && (
                <div className="absolute -left-2 sm:-left-3 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 font-bold select-none">
                  -
                </div>
              )}

              <div
                className={`w-10 h-12 sm:w-12 sm:h-14 flex items-center justify-center text-xl sm:text-2xl font-bold rounded-lg border transition-all ${isNext
                  ? 'border-primary ring-2 ring-primary/20 scale-110 z-10 bg-white dark:bg-slate-700'
                  : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900'
                  } ${char ? 'text-slate-900 dark:text-white border-slate-400 dark:border-slate-500' : 'text-slate-300'
                  }`}
              >
                {char}
                {isNext && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-0.5 h-6 bg-primary animate-blink"></div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Type Badge */}
      <div className={`h-8 transition-all duration-300 ${value.length === 6 ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-2'}`}>
        {semesterType === 'regular' && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 animate-in zoom-in">
            <span className="material-symbols-outlined text-lg">school</span>
            {description}
          </span>
        )}
        {semesterType === 'intensive' && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 animate-in zoom-in">
            <span className="material-symbols-outlined text-lg">local_fire_department</span>
            {description}
          </span>
        )}
        {semesterType === 'invalid' && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 animate-in bounce-in">
            <span className="material-symbols-outlined text-lg">error</span>
            Código Inválido
          </span>
        )}
      </div>
    </div>
  );
}
