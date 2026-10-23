'use client';

import { useEffect } from 'react';
import { create } from 'zustand';
import { cn } from '@/lib/cn';

export type ToastTone = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
  durationMs: number;
}

interface ToastState {
  toasts: Toast[];
  push: (tone: ToastTone, message: string, durationMs?: number) => void;
  dismiss: (id: number) => void;
}

let nextId = 0;

const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  push: (tone, message, durationMs = 4000) =>
    set((state) => ({
      toasts: [...state.toasts, { id: nextId++, tone, message, durationMs }],
    })),
  dismiss: (id) =>
    set((state) => ({ toasts: state.toasts.filter((item) => item.id !== id) })),
}));

/** Gọi được từ bất kỳ client component nào: `toast.success('Đã thêm vào giỏ')`. */
export const toast = {
  success: (message: string) =>
    useToastStore.getState().push('success', message),
  error: (message: string) => useToastStore.getState().push('error', message),
  info: (message: string) => useToastStore.getState().push('info', message),
};

const TONES: Record<ToastTone, string> = {
  success: 'border-success/30 bg-success-soft text-ink',
  error: 'border-danger/30 bg-danger-soft text-ink',
  info: 'border-border bg-surface text-ink',
};

/** Đặt một lần ở root layout. */
export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 sm:items-end"
    >
      {toasts.map((item) => (
        <ToastCard key={item.id} toast={item} />
      ))}
    </div>
  );
}

function ToastCard({ toast: item }: { toast: Toast }) {
  const dismiss = useToastStore((state) => state.dismiss);

  useEffect(() => {
    const timer = setTimeout(() => dismiss(item.id), item.durationMs);
    return () => clearTimeout(timer);
  }, [dismiss, item.id, item.durationMs]);

  return (
    <div
      className={cn(
        'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-card',
        TONES[item.tone],
      )}
    >
      <p className="flex-1 text-sm">{item.message}</p>
      <button
        type="button"
        onClick={() => dismiss(item.id)}
        aria-label="Đóng thông báo"
        className="-mr-1 rounded p-0.5 text-ink-subtle transition-colors hover:text-ink"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
