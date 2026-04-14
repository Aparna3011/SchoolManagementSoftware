/**
 * Input Component
 * 
 * Text input with label, error, and hint support.
 */

const baseInputStyles = "w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-200 rounded-md outline-none transition-all focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200 placeholder-slate-400 disabled:bg-slate-50 disabled:text-slate-500";
const errorInputStyles = "border-red-500 focus:border-red-500 focus:ring-red-100";

export function Input({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  required = false,
  error = '',
  hint = '',
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
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`${baseInputStyles} ${error ? errorInputStyles : ''}`}
        {...props}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
      {hint && !error && <span className="text-xs text-slate-400">{hint}</span>}
    </div>
  );
}

/**
 * Textarea Component
 */
export function Textarea({
  label,
  name,
  value,
  onChange,
  placeholder = '',
  required = false,
  error = '',
  rows = 3,
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
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        rows={rows}
        className={`${baseInputStyles} resize-y min-h-[80px] ${error ? errorInputStyles : ''}`}
        {...props}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
