import React, { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  key?: React.Key;
}

export function Card({ children, className = '', onClick, ...props }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-surface-lowest rounded-xl p-5 border border-[#EEFFCD] shadow-[0px_4px_20px_rgba(30,41,59,0.05)] transition-all ${
        onClick ? 'cursor-pointer hover:border-primary-container hover:-translate-y-0.5 duration-200' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

