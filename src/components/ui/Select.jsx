/**
 * Select Component
 * 
 * Dropdown select with label and error support.
 */

const baseSelectStyles = "w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-200 rounded-md outline-none transition-all focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-50 disabled:text-slate-500";
const errorSelectStyles = "border-red-500 focus:border-red-500 focus:ring-red-100";

export function Select({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  required = false,
  error = '',
  disabled = false,
  className = '',
  ...props
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label htmlFor={name} className="text-sm font-medium text-slate-900">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={`${baseSelectStyles} ${error ? errorSelectStyles : ''}`}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
