// GENERATOR: ONBOARDING_SYSTEM
// Reusable Card component

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  title?: string;
  subtitle?: string;
}

export default function Card({
  children,
  className = '',
  padding = 'md',
  title,
  subtitle,
}: CardProps) {
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const hasHeader = title || subtitle;
  const actualPadding = hasHeader && padding === 'md' ? 'p-0' : paddingStyles[padding];

  return (
    <div
      className={`
        bg-card text-card-foreground rounded-lg border border-border/50
        dark:border-border/30
        transition-all duration-200 hover:border-border/70 hover:shadow-sm
        ${actualPadding}
        ${className}
      `}
    >
      {hasHeader && (
        <div className={`${paddingStyles[padding]} pb-4 border-b-2 border-border/50`}>
          {title && <h3 className="text-xl font-bold text-foreground">{title}</h3>}
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      )}
      <div className={hasHeader ? paddingStyles[padding] : ''}>
        {children}
      </div>
    </div>
  );
}

