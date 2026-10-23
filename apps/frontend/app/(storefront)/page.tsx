import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';

const HIGHLIGHTS = [
  {
    title: 'Tất theo mùa',
    body: 'Cổ ngắn cho mùa hè, len dày cho mùa đông — chọn theo mùa thay vì đoán chất liệu.',
  },
  {
    title: 'Gói quà sẵn',
    body: 'Mỗi đơn quà tặng đều được gói miễn phí, kèm thiệp viết tay nếu bạn yêu cầu.',
  },
  {
    title: 'Không cần tài khoản',
    body: 'Để lại tên, số điện thoại và địa chỉ là xong. Chúng tôi gọi xác nhận trước khi giao.',
  },
];

export default function HomePage() {
  return (
    <>
      <section className="bg-brand-50">
        <div className="container-page flex flex-col items-start gap-6 py-16 lg:py-24">
          <Badge tone="accent">Thanh toán khi nhận hàng</Badge>

          <h1 className="max-w-2xl text-4xl leading-tight font-semibold tracking-tight text-balance text-brand-950 lg:text-5xl">
            Tất cho từng mùa, quà cho từng dịp
          </h1>

          <p className="max-w-xl text-lg text-ink-muted">
            Chọn theo mùa, theo kiểu tất hoặc theo dịp tặng quà. Đặt hàng trong
            vài bước, đội ngũ gọi xác nhận trước khi giao.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/products" size="lg">
              Xem sản phẩm
            </ButtonLink>
            <ButtonLink href="/gifts" size="lg" variant="secondary">
              Quà tặng theo dịp
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="container-page grid gap-6 py-16 sm:grid-cols-3">
        {HIGHLIGHTS.map((highlight) => (
          <div
            key={highlight.title}
            className="flex flex-col gap-2 rounded-card border border-border p-6"
          >
            <h2 className="font-semibold text-ink">{highlight.title}</h2>
            <p className="text-sm text-ink-muted">{highlight.body}</p>
          </div>
        ))}
      </section>
    </>
  );
}
