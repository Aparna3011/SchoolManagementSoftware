/**
 * Button Component
 * 
 * Variants: primary, secondary, danger, ghost, success
 * Sizes: sm, md (default), lg
 */

export function Button({
  children,
  variant = 'primary',
  size = '',
  type = 'button',
  disabled = false,
  onClick,
  className = '',
  ...props
}) {
  const sizeClass = size ? `btn-${size}` : '';
  const variantClass = `btn-${variant}`;

  return (
    <button
      type={type}
      className={`btn ${variantClass} ${sizeClass} ${className}`.trim()}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}
