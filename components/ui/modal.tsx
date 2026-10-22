'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  /** Nút hành động đặt ở chân modal. */
  footer?: ReactNode;
  className?: string;
  children?: ReactNode;
}

/**
 * Dựng trên `<dialog>` của trình duyệt nên có sẵn focus trap, phím Esc và
 * thuộc tính aria đúng chuẩn.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  footer,
  className,
  children,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    // Khoá cuộn nền khi modal mở.
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onCancel={onClose}
      onClick={(event) => {
        // Bấm ra vùng nền ngoài khung nội dung thì đóng.
        if (event.target === dialogRef.current) onClose();
      }}
      aria-labelledby="modal-title"
      className={cn(
        'm-auto w-[calc(100vw-2rem)] max-w-lg rounded-card bg-surface p-0 text-ink shadow-pop',
        'backdrop:bg-ink/40',
        className,
      )}
    >
      <div className="flex flex-col gap-4 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 id="modal-title" className="text-lg font-semibold">
              {title}
            </h2>
            {description && (
              <p className="text-sm text-ink-muted">{description}</p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="-m-1 rounded-full p-1 text-ink-subtle transition-colors hover:bg-surface-sunken hover:text-ink"
          >
            <svg
              viewBox="0 0 24 24"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {children}

        {footer && (
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {footer}
          </div>
        )}
      </div>
    </dialog>
  );
}
