import { ButtonLink } from '@/components/ui/button';

/**
 * Trang giữ chỗ cho các route đã có link trên header/footer nhưng nội dung
 * thuộc phase sau. Xoá khi phase tương ứng dựng trang thật.
 */
export function ComingSoon({ title, phase }: { title: string; phase: string }) {
  return (
    <div className="container-page flex flex-col items-start gap-5 py-20">
      <h1 className="text-3xl font-semibold tracking-tight text-ink">
        {title}
      </h1>
      <p className="max-w-md text-ink-muted">
        Phần này sẽ được dựng ở {phase}.
      </p>
      <ButtonLink href="/" variant="secondary">
        Về trang chủ
      </ButtonLink>
    </div>
  );
}
