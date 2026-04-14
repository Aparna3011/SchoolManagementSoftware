/**
 * Card Component
 * 
 * Content container with optional header, body, and footer.
 */

export function Card({ children, className = '', ...props }) {
  return (
    <div className={`bg-white border border-slate-200 rounded-xl shadow-sm transition-shadow hover:shadow-md ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={`px-6 py-5 border-b border-slate-100 flex items-center justify-between ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', ...props }) {
  return (
    <h3 className={`text-base font-semibold text-slate-900 ${className}`} {...props}>
      {children}
    </h3>
  );
}

export function CardBody({ children, className = '', ...props }) {
  return (
    <div className={`p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div className={`px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 ${className}`} {...props}>
      {children}
    </div>
  );
}
