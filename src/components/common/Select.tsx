import React, { forwardRef, SelectHTMLAttributes, ReactNode } from 'react';

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  icon?: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', label, error, options, icon, id, ...props }, ref) => {
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
          <select
            id={id}
            ref={ref}
            className={`w-full h-12 bg-surface-lowest border ${
              error ? 'border-error-custom focus:ring-error-container' : 'border-outline-variant focus:border-primary focus:ring-primary-container'
            } rounded-xl px-4 ${icon ? 'pl-11' : ''} text-base font-medium text-on-surface placeholder:text-outline-variant outline-none focus:ring-4 transition-all appearance-none cursor-pointer ${className}`}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-4 pointer-events-none text-on-surface-variant flex items-center">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
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

Select.displayName = 'Select';
