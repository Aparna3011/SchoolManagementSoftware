/**
 * Button Component
 * 
 * Variants: primary, secondary, danger, ghost, success
 * Sizes: sm, md (default), lg
 */

const baseClasses = "inline-flex items-center justify-center gap-2 font-medium rounded-md transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed border border-transparent";

const variants = {
  primary: "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md",
  secondary: "bg-white text-slate-900 border-slate-200 hover:bg-slate-50 hover:border-slate-400",
  danger: "bg-red-500 text-white hover:bg-red-600 hover:shadow-md",
  ghost: "bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-900",
  success: "bg-emerald-500 text-white hover:bg-emerald-600 hover:shadow-md"
};

const sizes = {
  sm: "px-3 py-1 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base"
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  onClick,
  className = '',
  ...props
}) {
  const sizeClass = sizes[size] || sizes.md;
  const variantClass = variants[variant] || variants.primary;

  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClass} ${sizeClass} ${className}`.trim()}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}
