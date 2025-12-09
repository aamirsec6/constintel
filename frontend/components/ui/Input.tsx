// GENERATOR: ONBOARDING_SYSTEM
// Reusable Input component

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export default function Input({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id || `input-${Math.random().toString(36).substring(7)}`;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-foreground mb-1.5">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`
          w-full px-3 py-2.5 text-sm border rounded-md
          bg-background text-foreground
          focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50
          transition-all duration-200
          ${error ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : 'border-border'}
          placeholder:text-muted-foreground/60
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-sm text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
}

