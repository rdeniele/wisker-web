import React, { useState, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputBoxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel';
  showPasswordToggle?: boolean;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
  labelClassName?: string;
}

const InputBox = forwardRef<HTMLInputElement, InputBoxProps>(
  (
    {
      label,
      placeholder,
      type = 'text',
      showPasswordToggle = false,
      error,
      helperText,
      required = false,
      disabled = false,
      fullWidth = true,
      className,
      labelClassName,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const inputType = type === 'password' && showPassword ? 'text' : type;

    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword);
    };

    return (
      <div className={cn('flex flex-col gap-2', fullWidth && 'w-full', className)}>
        {/* Label */}
        <label className={cn(
          'text-lg md:text-xl font-semibold text-gray-900 dark:text-white',
          labelClassName
        )}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>

        {/* Input Container */}
        <div className="relative">
          <input
            ref={ref}
            type={inputType}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              'w-full px-6 py-4 text-lg md:text-xl',
              'bg-gray-50 dark:bg-gray-800',
              'border-2 rounded-2xl',
              'placeholder:text-gray-500 dark:placeholder:text-gray-400',
              'text-gray-900 dark:text-white',
              'transition-all duration-200 ease-in-out',
              'focus:outline-none focus:ring-2',
              // Border states
              error
                ? 'border-red-400 focus:border-red-500 focus:ring-red-300'
                : isFocused
                ? 'border-orange-400 focus:border-orange-500 focus:ring-orange-300'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500',
              // Disabled state
              disabled && 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-900',
              // Padding adjustment for password toggle
              (type === 'password' && showPasswordToggle) && 'pr-14'
            )}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />

          {/* Password Toggle Icon */}
          {type === 'password' && showPasswordToggle && (
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className={cn(
                'absolute right-4 top-1/2 -translate-y-1/2',
                'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
                'focus:outline-none focus:text-gray-700 dark:focus:text-gray-200',
                'transition-colors duration-200',
                disabled && 'cursor-not-allowed opacity-50'
              )}
              disabled={disabled}
            >
              {showPassword ? (
                // Eye slash icon (hidden)
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                </svg>
              ) : (
                // Eye icon (visible)
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          )}
        </div>

        {/* Helper Text or Error */}
        {(error || helperText) && (
          <p className={cn(
            'text-sm md:text-base',
            error ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'
          )}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

InputBox.displayName = 'InputBox';

export default InputBox;