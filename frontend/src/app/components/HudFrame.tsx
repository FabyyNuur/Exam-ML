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
    <div className="relative w-screen h-screen overflow-hidden flex flex-col">
      {/* Decorative Soft Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-300/30 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-fuchsia-300/30 blur-[120px]" />
        <div className="absolute top-[30%] left-[40%] w-[30%] h-[30%] rounded-full bg-indigo-300/20 blur-[100px]" />
      </div>

      {/* Top Bar */}
      <header className="absolute top-0 left-0 right-0 h-16 bg-white/50 backdrop-blur-xl border-b border-white/60 flex items-center justify-between px-6 z-50 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-10 h-10 bg-white/80 text-indigo-600 rounded-lg shadow-sm border border-white">
            <BarChart2 size={24} />
          </div>
          <div className="font-semibold text-slate-800 tracking-wide flex items-center gap-2">
            {title}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {showHome && (
            <button 
              onClick={onHome}
              className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md border border-white/60 text-slate-600 text-sm font-medium rounded-lg hover:bg-white hover:text-indigo-600 transition-all duration-200 shadow-sm"
            >
              <ArrowLeft size={16} />
              Retour au Hub
            </button>
          )}
          <div className="flex items-center gap-2 ml-4 pl-4 border-l border-slate-300/50">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Système Actif</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative z-10 pt-16">
        {children}
      </main>

    </div>
  );
}
