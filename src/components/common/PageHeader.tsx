import React, { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Button } from './Button';

interface PageHeaderProps {
  title: string;
  description?: string;
  backUrl?: string;
  action?: ReactNode;
}

export function PageHeader({ title, description, backUrl, action }: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-stack-lg border-b border-outline-variant/20 pb-4">
      <div className="flex items-start gap-3">
        {backUrl && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(backUrl)}
            className="p-2 h-auto"
            icon={<ChevronLeft className="w-5 h-5 text-primary" />}
          >
            <span className="sr-only">Volver</span>
          </Button>
        )}
        <div className="flex flex-col">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-on-surface">
            {title}
          </h2>
          {description && (
            <p className="text-sm font-medium text-on-surface-variant mt-0.5">
              {description}
            </p>
          )}
        </div>
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}
