import React from 'react';

interface InsightsListProps {
  title: string;
  insights: string[];
  variant?: 'default' | 'indigo' | 'red' | 'numbered';
  className?: string;
}

export function InsightsList({ title, insights, variant = 'default', className = '' }: InsightsListProps) {
  if (!insights.length) return null;

  const cardClass =
    variant === 'indigo'
      ? 'bg-indigo-50 border-indigo-100 text-indigo-800'
      : variant === 'red'
        ? 'bg-red-50 border-red-100 text-red-800'
        : 'bg-white border-slate-200 text-slate-600';

  const bulletClass =
    variant === 'red'
      ? 'text-red-500'
      : variant === 'indigo'
        ? 'text-indigo-500'
        : 'text-indigo-500';

  return (
    <div className={`border rounded-xl p-5 shadow-sm ${cardClass} ${className}`}>
      <h3 className="text-sm font-bold uppercase mb-4 tracking-wide">{title}</h3>
      <ul className="space-y-3 text-sm leading-relaxed">
        {insights.map((insight, i) => (
          <li key={i} className="flex gap-3">
            {variant === 'numbered' ? (
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
                {i + 1}
              </span>
            ) : (
              <span className={`${bulletClass} mt-1`}>•</span>
            )}
            <span>{insight}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
