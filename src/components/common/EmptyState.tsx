import React from 'react';
import { Leaf } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export function EmptyState({ title, description, actionText, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center text-center p-12 bg-surface-container-lowest border border-[#EEFFCD] rounded-xl shadow-[0px_4px_20px_rgba(30,41,59,0.05)] w-full">
      <div className="w-16 h-16 bg-primary-container rounded-full flex items-center justify-center text-primary mb-5 border-2 border-primary/10">
        <Leaf className="w-8 h-8" />
      </div>
      <h4 className="text-xl font-bold text-on-surface mb-2">{title}</h4>
      <p className="text-sm font-medium text-on-surface-variant max-w-sm mb-6">
        {description}
      </p>
      {actionText && onAction && (
        <Button onClick={onAction} variant="primary">
          {actionText}
        </Button>
      )}
    </div>
  );
}
