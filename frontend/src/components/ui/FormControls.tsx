import React from "react";
import { LucideIcon } from "lucide-react";

export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  icon?: LucideIcon;
  required?: boolean;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  hint,
  error,
  icon: Icon,
  required,
  className = "",
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="cimas-form-group">
      {label && (
        <label htmlFor={inputId} className="cimas-form-group__label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}

      <div className="cimas-input-wrapper">
        {Icon && <Icon className="input-icon-left w-4 h-4" />}
        <input
          id={inputId}
          className={`cimas-input ${Icon ? "has-icon-left" : ""} ${
            error ? "is-invalid" : ""
          } ${className}`}
          {...props}
        />
      </div>

      {error ? (
        <span className="cimas-form-group__error">{error}</span>
      ) : hint ? (
        <span className="cimas-form-group__hint">{hint}</span>
      ) : null}
    </div>
  );
};

export interface FormSelectOption {
  value: string | number;
  label: string;
}

export interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  options: FormSelectOption[];
  required?: boolean;
}

export const FormSelect: React.FC<FormSelectProps> = ({
  label,
  hint,
  error,
  options,
  required,
  className = "",
  id,
  ...props
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="cimas-form-group">
      {label && (
        <label htmlFor={selectId} className="cimas-form-group__label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}

      <select
        id={selectId}
        className={`cimas-select ${error ? "is-invalid" : ""} ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {error ? (
        <span className="cimas-form-group__error">{error}</span>
      ) : hint ? (
        <span className="cimas-form-group__hint">{hint}</span>
      ) : null}
    </div>
  );
};
