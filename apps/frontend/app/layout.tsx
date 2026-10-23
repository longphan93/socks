import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Be_Vietnam_Pro } from 'next/font/google';
import { Toaster } from '@/components/ui/toast';
import './globals.css';

// Be Vietnam Pro có đủ dấu tiếng Việt, kể cả các tổ hợp như ể, ỡ, ựu.
const beVietnamPro = Be_Vietnam_Pro({
  variable: '--font-be-vietnam-pro',
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:4001'),
  title: {
    default: 'Tất & Quà — Tất theo mùa và quà tặng',
    template: '%s · Tất & Quà',
  },
  description:
    'Tất nam, nữ, trẻ em theo từng mùa và quà tặng cho mọi dịp. Đặt hàng không cần tài khoản, thanh toán khi nhận hàng.',
};

/**
 * Chỉ giữ phần dùng chung cho cả storefront lẫn admin: html, font, toast.
 * Header và Footer nằm ở `(storefront)/layout.tsx`.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" className={`${beVietnamPro.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
