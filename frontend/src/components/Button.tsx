import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', className = '', children, ...props }) => {
  const base = 'inline-flex items-center justify-center font-sans font-medium transition-colors';
  const styles =
    variant === 'primary'
      ? 'bg-text-display text-background px-6 py-2 rounded-pill hover:opacity-90'
      : 'bg-transparent text-text-primary border border-border px-4 py-2 rounded hover:border-text-primary';

  return (
    <button className={`${base} ${styles} ${className}`} {...props}>
      {children}
    </button>
  );
};
