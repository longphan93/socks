import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function DataCard({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('rounded-card border border-border bg-surface', className)}>{children}</div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="px-5 py-10 text-center text-sm text-ink-muted">{children}</p>;
}
