import React from 'react';
import { LayoutDashboard, ArrowLeft, BarChart2 } from 'lucide-react';

interface HudFrameProps {
  children: React.ReactNode;
  title: string;
  onHome: () => void;
  showHome: boolean;
}

export function HudFrame({ children, title, onHome, showHome }: HudFrameProps) {
  return (
    <div className="relative w-full min-h-[100dvh] h-[100dvh] overflow-hidden flex flex-col">
      {/* Decorative Soft Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-300/30 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-fuchsia-300/30 blur-[120px]" />
        <div className="absolute top-[30%] left-[40%] w-[30%] h-[30%] rounded-full bg-indigo-300/20 blur-[100px]" />
      </div>

      {/* Top Bar */}
      <header className="absolute top-0 left-0 right-0 h-14 sm:h-16 bg-white/50 backdrop-blur-xl border-b border-white/60 flex items-center justify-between px-3 sm:px-6 z-50 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] gap-2">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 shrink-0 bg-white/80 text-indigo-600 rounded-lg shadow-sm border border-white">
            <BarChart2 size={20} className="sm:hidden" />
            <BarChart2 size={24} className="hidden sm:block" />
          </div>
          <div className="font-semibold text-slate-800 tracking-wide min-w-0">
            <span className="block truncate text-xs sm:text-sm md:text-base">{title}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {showHome && (
            <button
              onClick={onHome}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-white/80 backdrop-blur-md border border-white/60 text-slate-600 text-xs sm:text-sm font-medium rounded-lg hover:bg-white hover:text-indigo-600 transition-all duration-200 shadow-sm"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Retour au Hub</span>
              <span className="sm:hidden">Hub</span>
            </button>
          )}
          <div className="flex items-center gap-2 sm:ml-4 sm:pl-4 sm:border-l border-slate-300/50">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="hidden sm:inline text-xs font-medium text-slate-500 uppercase tracking-wider">
              Système Actif
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative z-10 pt-14 sm:pt-16 min-h-0">
        {children}
      </main>

    </div>
  );
}
