import { X } from 'lucide-react';

/**
 * Modal Component
 * 
 * Dialog overlay with close button.
 * Closes on overlay click or X button.
 */

export function Modal({ isOpen, onClose, title, children, footer, maxWidth = '500px' }) {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/50 flex justify-center items-center p-4 backdrop-blur-sm" 
      onClick={handleOverlayClick}
    >
      <div 
        className="bg-white rounded-xl shadow-xl w-full max-h-[90vh] overflow-y-auto flex flex-col" 
        style={{ maxWidth }}
      >
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10 transition-colors">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button 
            className="text-slate-400 hover:text-slate-700 transition-colors bg-transparent border-none cursor-pointer p-1" 
            onClick={onClose} 
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
        {footer && (
          <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 bg-slate-50 z-10">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
