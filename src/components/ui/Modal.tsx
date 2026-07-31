import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  className,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={cn(
          'relative w-full max-w-lg rounded-lg bg-white p-6 shadow-xl border border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100',
          className
        )}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            {title && <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">{title}</h2>}
            {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 rounded-full">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        <div className="py-4 text-sm">{children}</div>

        {footer && (
          <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
