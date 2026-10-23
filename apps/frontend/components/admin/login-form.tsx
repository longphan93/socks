'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { saveSession } from '@/lib/admin/auth';
import { ApiError, apiFetch } from '@/lib/api/client';
import type { LoginResult } from '@/lib/api/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await apiFetch<LoginResult>('/admin/auth/login', {
        method: 'POST',
        body: { email, password },
      });

      saveSession(result.accessToken, result.admin);

      // `next` đến từ middleware khi người dùng mở thẳng một trang admin.
      // Chỉ nhận đường dẫn nội bộ để không bị lừa chuyển sang site khác.
      const next = searchParams.get('next');
      router.replace(next?.startsWith('/admin') ? next : '/admin');
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Không kết nối được máy chủ, vui lòng thử lại.',
      );
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        id="admin-email"
        label="Email"
        type="email"
        autoComplete="username"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />

      <Input
        id="admin-password"
        label="Mật khẩu"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />

      {error && (
        <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <Button type="submit" loading={loading} fullWidth>
        Đăng nhập
      </Button>
    </form>
  );
}
