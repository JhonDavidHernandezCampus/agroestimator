import React from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

interface AlertBannerProps {
  variant?: 'success' | 'error' | 'info';
  message: string;
}

const styles = {
  success: {
    container: 'border-secondary/10 bg-secondary-container/40 text-on-secondary-container',
    icon: CheckCircle2,
  },
  error: {
    container: 'border-error-custom/10 bg-error-container text-error-custom',
    icon: AlertCircle,
  },
  info: {
    container: 'border-primary/10 bg-primary-container/30 text-on-primary-container',
    icon: Info,
  },
};

export function AlertBanner({ variant = 'info', message }: AlertBannerProps) {
  const Icon = styles[variant].icon;

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm font-semibold flex items-start gap-2 ${styles[variant].container}`}>
      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}