/**
 * Badge Component
 * 
 * Status indicator pills.
 * Variants: primary, success, warning, danger, neutral
 */

const variants = {
  primary: "bg-indigo-100 text-indigo-800",
  success: "bg-emerald-100 text-emerald-800",
  warning: "bg-amber-100 text-amber-800",
  danger: "bg-red-100 text-red-800",
  neutral: "bg-slate-100 text-slate-600"
};

export function Badge({ children, variant = 'primary', className = '' }) {
  const variantClass = variants[variant] || variants.primary;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${variantClass} ${className}`}>
      {children}
    </span>
  );
}
