import React, { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
}

export function Button({
  className = '',
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyle = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all active:scale-[0.98] outline-none disabled:opacity-50 disabled:pointer-events-none cursor-pointer';
  
  const variants = {
    primary: 'bg-primary text-white border-2 border-primary hover:bg-[#2b5400] hover:border-[#2b5400] shadow-sm',
    secondary: 'border-2 border-primary text-primary bg-transparent hover:bg-primary-container/20',
    danger: 'bg-error-custom text-white border-2 border-error-custom hover:bg-[#9a1414] hover:border-[#9a1414] shadow-sm',
    ghost: 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
  };

  const sizes = {
    sm: 'h-9 px-3 text-sm rounded-lg',
    md: 'h-12 px-6 text-base',
    lg: 'h-14 px-8 text-lg rounded-2xl'
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
      ) : icon ? (
        <span className="mr-2 flex items-center">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
