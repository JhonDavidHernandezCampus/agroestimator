import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoaderProps {
  variant?: 'spinner' | 'skeleton-list' | 'skeleton-card';
}

export function Loader({ variant = 'spinner' }: LoaderProps) {
  if (variant === 'skeleton-list') {
    return (
      <div className="space-y-4 w-full">
        {[1, 2, 3].map((n) => (
          <div key={n} className="bg-surface-container animate-pulse h-20 rounded-xl w-full border border-outline-variant" />
        ))}
      </div>
    );
  }

  if (variant === 'skeleton-card') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        {[1, 2, 3].map((n) => (
          <div key={n} className="bg-surface-container animate-pulse h-32 rounded-xl border border-outline-variant" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-12 w-full gap-3">
      <Loader2 className="w-10 h-10 text-primary animate-spin" />
      <span className="text-sm font-semibold text-outline uppercase tracking-wider animate-pulse">
        Cargando datos agrícolas...
      </span>
    </div>
  );
}
