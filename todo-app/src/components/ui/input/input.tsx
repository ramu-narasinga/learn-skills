import * as React from 'react';
import { cn } from '@/utils/cn';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id ?? React.useId();
    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'block w-full rounded-md border px-3 py-2 text-sm',
            'shadow-sm transition-colors',
            'placeholder:text-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            error
              ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300',
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  },
);
Input.displayName = 'Input';
