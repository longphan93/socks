import { ButtonLink } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-start gap-5 py-20">
      <p className="text-sm font-medium text-brand-600">404</p>
      <h1 className="text-3xl font-semibold tracking-tight text-ink">
        Không tìm thấy trang
      </h1>
      <p className="max-w-md text-ink-muted">
        Đường dẫn này không tồn tại hoặc sản phẩm đã được gỡ khỏi cửa hàng.
      </p>
      <ButtonLink href="/">Về trang chủ</ButtonLink>
    </div>
  );
}
