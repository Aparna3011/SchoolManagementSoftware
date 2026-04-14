/**
 * Badge Component
 * 
 * Status indicator pills.
 * Variants: primary, success, warning, danger, neutral
 */

export function Badge({ children, variant = 'primary', className = '' }) {
  return (
    <span className={`badge badge-${variant} ${className}`}>
      {children}
    </span>
  );
}
