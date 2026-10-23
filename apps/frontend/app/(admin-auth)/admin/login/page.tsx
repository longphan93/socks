import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginForm } from '@/components/admin/login-form';

export const metadata: Metadata = {
  title: 'Đăng nhập',
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted p-4">
      <div className="w-full max-w-sm rounded-card border border-border bg-surface p-6 shadow-card">
        <div className="mb-6 flex flex-col gap-1">
          <span className="font-semibold tracking-tight text-brand-700">Tất &amp; Quà</span>
          <h1 className="text-lg font-semibold text-ink">Đăng nhập quản trị</h1>
        </div>

        <Suspense fallback={<div className="h-48" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
