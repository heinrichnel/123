import React from 'react';

interface InputProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  error?: string | false;
  onBlur?: () => void;
}

export const Input: React.FC<InputProps> = ({ label, value, onChange, type = 'text', placeholder, required, error, onBlur }) => (
  <div className="mb-4">
    <label className="block font-medium mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => {
        if (type === 'number') {
          // Allow empty string for controlled input, otherwise parse number
          const val = e.target.value;
          onChange(val === '' ? '' : val);
        } else {
          onChange(e.target.value);
        }
      }}
      placeholder={placeholder}
      required={required}
      onBlur={onBlur}
      className={`w-full border rounded px-3 py-2 ${error ? 'border-red-500' : ''}`}
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
  onChange: (value: string) => void;
  options: SelectOption[];
  required?: boolean;
  error?: string | false;
  onBlur?: () => void;
}

export const Select: React.FC<SelectProps> = ({ label, value, onChange, options, required, error, onBlur }) => (
  <div className="mb-4">
    <label className="block font-medium mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      onBlur={onBlur}
      className={`w-full border rounded px-3 py-2 ${error ? 'border-red-500' : ''}`}
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
}

export const TextArea: React.FC<TextAreaProps> = ({ label, ...props }) => (
  <div className="flex flex-col">
    {label && <label className="mb-1 font-medium">{label}</label>}
    <textarea {...props} className="border rounded p-2 focus:ring" />
  </div>
);

export { TextArea };

// Default export optional
export default {
  Input,
  Select,
  TextArea,
};
