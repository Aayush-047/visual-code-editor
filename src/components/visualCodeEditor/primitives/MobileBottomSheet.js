import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, X } from 'lucide-react';

const MobileBottomSheet = ({
  isOpen,
  title,
  onClose,
  children,
  className = '',
  overlayClassName = '',
  overlayVisible = true,
  variant = 'bottom',
  showHandle = true,
  closeMode = 'icon',
}) => {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[130] lg:hidden">
      <button
        type="button"
        aria-label="Close sheet"
        className={`absolute bottom-0 left-0 right-0 top-[72px] ${overlayVisible ? 'bg-slate-950/45' : 'bg-transparent'} ${overlayClassName}`}
        onClick={onClose}
      />
      <div
        className={`mobile-bottom-sheet absolute border border-[var(--panel-border)] bg-[var(--surface-modal)] px-4 pb-0 pt-4 shadow-2xl ${
          variant === 'drawer'
            ? 'mobile-side-drawer left-0 top-[72px] bottom-0 w-[75vw] max-w-[420px] overflow-y-auto rounded-r-[24px] border-b-0 border-l-0 border-t-0'
            : 'bottom-0 left-0 right-0 top-[72px] max-h-[calc(100vh-72px)] overflow-y-auto rounded-t-[24px] border-b-0'
        } ${className}`}
      >
        {showHandle ? <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-300/80" /> : null}
        {closeMode === 'back' ? (
          <div className="mb-4 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--panel-border)] bg-[var(--surface-chip)] text-[var(--text-primary)]"
              aria-label="Go back"
            >
              <ChevronLeft size={16} />
            </button>
            <h2 className="min-w-0 truncate text-base font-bold text-[var(--text-primary)]">{title}</h2>
          </div>
        ) : (
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-[var(--text-primary)]">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-chip)] text-[var(--text-primary)]"
            >
              <X size={18} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body
  );
};

export default MobileBottomSheet;
