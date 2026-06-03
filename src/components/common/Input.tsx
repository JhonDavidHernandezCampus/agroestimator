import React, { forwardRef, InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, icon, id, type = 'text', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={id} className="text-sm font-semibold text-on-background-custom ml-1">
            {label}
          </label>
        )}
        <div className="relative w-full flex items-center">
          {icon && (
            <div className="absolute left-4 text-on-surface-variant flex items-center pointer-events-none">
              {icon}
            </div>
          )}
          <input
            id={id}
            type={type}
            ref={ref}
            className={`w-full h-12 bg-surface-lowest border ${
              error ? 'border-error-custom focus:ring-error-container' : 'border-outline-variant focus:border-primary focus:ring-primary-container'
            } rounded-xl px-4 ${icon ? 'pl-11' : ''} text-base font-medium placeholder:text-outline-variant outline-none focus:ring-4 transition-all ${className}`}
            {...props}
          />
        </div>
        {error && (
          <span className="text-xs font-semibold text-error-custom ml-1 animate-fadeIn">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
