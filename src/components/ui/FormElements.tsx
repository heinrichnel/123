import React from 'react';

interface InputProps {
  label: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  error?: string | false;
  onBlur?: () => void;
  step?: string;
  min?: string;
  disabled?: boolean;
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  value, 
  onChange, 
  type = 'text', 
  placeholder, 
  required, 
  error, 
  onBlur,
  step,
  min,
  disabled
}) => (
  <div className="mb-4">
    <label className="block font-medium mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      onBlur={onBlur}
      step={step}
      min={min}
      disabled={disabled}
      className={`w-full border rounded px-3 py-2 ${error ? 'border-red-500' : ''} ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
    />
    {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
  </div>
);

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: SelectOption[];
  required?: boolean;
  error?: string | false;
  onBlur?: () => void;
  disabled?: boolean;
}

export const Select: React.FC<SelectProps> = ({ 
  label, 
  value, 
  onChange, 
  options = [], 
  required, 
  error, 
  onBlur,
  disabled
}) => (
  <div className="mb-4">
    <label className="block font-medium mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
      value={value}
      onChange={onChange}
      required={required}
      onBlur={onBlur}
      disabled={disabled}
      className={`w-full border rounded px-3 py-2 ${error ? 'border-red-500' : ''} ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
    >
      <option value="">Select...</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
  </div>
);

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string | false;
}

export const TextArea: React.FC<TextAreaProps> = ({ label, error, ...props }) => (
  <div className="flex flex-col">
    {label && <label className="mb-1 font-medium">{label}</label>}
    <textarea 
      {...props} 
      className={`border rounded p-2 focus:ring ${error ? 'border-red-500' : ''} ${props.disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`} 
    />
    {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
  </div>
);

export { TextArea as Textarea };

// Default export optional
export default {
  Input,
  Select,
  TextArea,
};