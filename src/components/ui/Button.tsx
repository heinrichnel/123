import React from 'react';
import Button from '../ui/Button.js';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode; // ✅ allows JSX elements like <Upload />
  isLoading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

// Only keep ONE of these:
const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  ...props
}) => (
  <button
    className={`btn btn-${variant} btn-${size}`}
    {...props}
  >
    {icon && <span className="mr-2">{icon}</span>}
    {children}
  </button>
);

export default Button;