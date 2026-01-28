import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#e7edf3] dark:border-gray-700 bg-surface-light dark:bg-surface-dark px-6 lg:px-10 py-3 shrink-0 z-20">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-4 text-[#0d141b] dark:text-white">
          <div className="size-8 flex items-center justify-center bg-primary/10 rounded-lg text-primary">
            <span className="material-symbols-outlined">school</span>
          </div>
          <h2 className="text-[#0d141b] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">Academic Admin</h2>
        </div>

        {/* Search Bar */}
        <label className="hidden md:flex flex-col min-w-40 !h-10 w-80">
          <div className="flex w-full flex-1 items-stretch rounded-lg h-full">
            <div className="text-[#4c739a] dark:text-gray-400 flex border-none bg-[#e7edf3] dark:bg-gray-800 items-center justify-center pl-4 rounded-l-lg border-r-0">
              <span className="material-symbols-outlined text-[20px]">search</span>
            </div>
            <input className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#0d141b] dark:text-white focus:outline-0 focus:ring-0 border-none bg-[#e7edf3] dark:bg-gray-800 focus:border-none h-full placeholder:text-[#4c739a] dark:placeholder:text-gray-500 px-4 rounded-l-none border-l-0 pl-2 text-base font-normal leading-normal" placeholder="Search name or ID..." />
          </div>
        </label>
      </div>

      <div className="flex flex-1 justify-end gap-6 items-center">
        <div className="flex gap-2">
          <button className="flex cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 w-10 hover:bg-[#e7edf3] dark:hover:bg-gray-800 text-[#0d141b] dark:text-gray-200 transition-colors">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="flex cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 w-10 hover:bg-[#e7edf3] dark:hover:bg-gray-800 text-[#0d141b] dark:text-gray-200 transition-colors">
            <span className="material-symbols-outlined">settings</span>
          </button>
        </div>
        <div className="flex items-center gap-3 pl-4 border-l border-[#e7edf3] dark:border-gray-700">
          <div className="hidden lg:block text-right">
            <p className="text-sm font-bold text-[#0d141b] dark:text-white">Prof. A. Davis</p>
            <p className="text-xs text-[#4c739a] dark:text-gray-400">Registrar</p>
          </div>
          <div
            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border-2 border-white dark:border-gray-800 shadow-sm cursor-pointer"
            style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBx_frzcxQMS0vMH1VisSqrHgutUaNu4Pcb636lFokQSrBWtjws3uh798j-rXu0AKxM-GrPYzdL4rRBZzDfBEsbRUL5-7fzRiy6xgExmVaCYGqRvQxXOsEiXmeXDHt47MUCMAaYX09a3NFNOO77Kwmis-mPxnpS262K23LLjSR6v79_ehaFI1AfeU0ocIrcyCzVWJSxdTPwxv2S0bedpAF8SaaleOVZPgCHe1sHbWBFbgvfAK9bB2AJ1l8tN_Jbui5R2SRdKy3Ly3QL")' }}
          ></div>
        </div>
      </div>
    </header>
  );
};
