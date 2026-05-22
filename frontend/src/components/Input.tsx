import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block font-mono text-xs uppercase text-text-secondary mb-1">
          {label}
        </label>
      )}
      <input
        className="w-full bg-surface border border-border rounded px-3 py-2 text-text-primary font-sans focus:outline-none focus:border-text-display transition-colors"
        {...props}
      />
    </div>
  );
};
