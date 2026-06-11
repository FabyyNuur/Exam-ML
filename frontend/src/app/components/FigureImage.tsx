import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { api } from '@/lib/api';

interface FigureImageProps {
  filename: string;
  title?: string;
  caption?: string;
  className?: string;
}

export function FigureImage({ filename, title, caption, className = '' }: FigureImageProps) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className={`bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-slate-400 gap-2 ${className}`}>
        <ImageOff size={32} />
        <p className="text-sm font-medium">Figure non disponible : {filename}</p>
        <p className="text-xs text-slate-400">Exécuter les notebooks pour générer les graphiques.</p>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden ${className}`}>
      {title && (
        <div className="px-4 py-3 border-b border-slate-100">
          <h4 className="text-sm font-bold text-slate-800 uppercase">{title}</h4>
          {caption && <p className="text-xs text-slate-500 mt-1">{caption}</p>}
        </div>
      )}
      <img
        src={api.figureUrl(filename)}
        alt={title ?? filename}
        className="w-full h-auto object-contain"
        onError={() => setError(true)}
      />
    </div>
  );
}
