import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      isLoading = false,
      disabled = false,
      className,
      ...props
    },
    ref
  ) => {
    const baseStyles = `
      inline-flex items-center justify-center
      font-semibold text-center
      rounded-2xl
      transition-all duration-200 ease-in-out
      focus:outline-none focus:ring-2 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
      active:scale-95
      transform
      font-fredoka
    `;

    const variants = {
      primary: `
        bg-gradient-to-r from-orange-400 to-orange-500
        hover:from-orange-500 hover:to-orange-600
        text-white
        shadow-lg hover:shadow-xl
        focus:ring-orange-300
      `,
      secondary: `
        bg-gradient-to-r from-gray-500 to-gray-600
        hover:from-gray-600 hover:to-gray-700
        text-white
        shadow-lg hover:shadow-xl
        focus:ring-gray-300
      `,
      outline: `
        border-2 border-orange-400
        text-orange-500 hover:text-white
        hover:bg-gradient-to-r hover:from-orange-400 hover:to-orange-500
        focus:ring-orange-300
      `,
      ghost: `
        text-orange-500 hover:text-orange-600
        hover:bg-orange-50
        focus:ring-orange-300
      `,
    };

    const sizes = {
      sm: `
        px-4 py-2 text-sm
        min-h-[36px]
        sm:px-6 sm:py-3
      `,
      md: `
        px-6 py-3 text-base
        min-h-[44px]
        sm:px-8 sm:py-4
        md:text-lg
      `,
      lg: `
        px-8 py-4 text-lg
        min-h-[52px]
        sm:px-10 sm:py-5
        md:text-xl
      `,
      xl: `
        px-10 py-5 text-xl
        min-h-[60px]
        sm:px-12 sm:py-6
        md:text-2xl
      `,
    };

    const widthClass = fullWidth ? 'w-full' : 'w-auto min-w-[120px] sm:min-w-[140px]';

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          widthClass,
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Loading...
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;