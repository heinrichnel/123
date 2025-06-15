import React from 'react';

interface InputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}

export const Input: React.FC<InputProps> = ({ label, value, onChange, type = 'text', placeholder }) => (
  <div className="mb-4">
    <label className="block font-medium mb-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border rounded px-3 py-2"
    />
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
}

export const Select: React.FC<SelectProps> = ({ label, value, onChange, options }) => (
  <div className="mb-4">
    <label className="block font-medium mb-1">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border rounded px-3 py-2"
    >
      <option value="">Select...</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

interface TextAreaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

export const Textarea: React.FC<TextAreaProps> = ({ label, value, onChange, placeholder, rows = 4 }) => (
  <div className="mb-4">
    <label className="block font-medium mb-1">{label}</label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full border rounded px-3 py-2"
    />
  </div>
);

// Default export optional
export default {
  Input,
  Select,
  Textarea,
};
