import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  isLoading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
  outline: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  success: 'bg-green-500 hover:bg-green-600 text-white',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm rounded',
  md: 'px-4 py-2 text-base rounded-md',
  lg: 'px-6 py-3 text-lg rounded-lg',
};

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  isLoading,
  fullWidth,
  children,
  ...props
}) => (
  <button
    className={`inline-flex items-center justify-center font-medium focus:outline-none transition ${variantClasses[variant]} ${sizeClasses[size]}${fullWidth ? ' w-full' : ''} ${props.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    disabled={isLoading || props.disabled}
    {...props}
  >
    {icon && <span className="mr-2">{icon}</span>}
    {isLoading ? 'Loading...' : children}
  </button>
);

export default Button;