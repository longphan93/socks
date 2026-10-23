'use client';

import { useState } from 'react';
import { adminFetch } from '@/lib/admin/client';
import { useAsyncData } from '@/lib/admin/use-async-data';
import { ApiError } from '@/lib/api/client';
import type {
  ApiEnvelope,
  Category,
  ProductDetail,
  ProductSummary,
  VariantOptionDetail,
} from '@/lib/api/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import { formatVnd } from '@/lib/format';
import { DataCard, EmptyState } from './data-card';
import { PageHeader } from './page-header';
import {
  ProductForm,
  emptyProductForm,
  toProductForm,
  type ProductFormState,
} from './product-form';

const PAGE_SIZE = 20;

export function ProductManager() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data: formData } = useAsyncData('product-form-data', async () => {
      const [categoryRows, optionRows] = await Promise.all([
        adminFetch<Category[]>('/admin/categories'),
        adminFetch<VariantOptionDetail[]>('/admin/variant-options'),
      ]);

    return { categories: categoryRows, options: optionRows.filter((row) => row.isActive) };
  });
  const [form, setForm] = useState<ProductFormState | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: listing, reload: load } = useAsyncData(`${page}|${search.trim()}`, async () => {
    const query = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });

    if (search.trim()) query.set('search', search.trim());

    // Lấy nguyên envelope vì cần cả `meta` phân trang, không chỉ `data`.
    return adminFetch<ApiEnvelope<ProductSummary[]>>(`/admin/products?${query}`, {
      unwrap: false,
    });
  });

  const products = listing?.data ?? null;
  const meta = {
    page: Number(listing?.meta?.page ?? 1),
    totalPages: Number(listing?.meta?.totalPages ?? 1),
    total: Number(listing?.meta?.total ?? 0),
  };



  async function openEdit(id: string) {
    try {
      setForm(toProductForm(await adminFetch<ProductDetail>(`/admin/products/${id}`)));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Không mở được sản phẩm');
    }
  }

  async function save() {
    if (!form) return;

    if (form.variants.length === 0) {
      toast.error('Sản phẩm phải có ít nhất một biến thể');

      return;
    }

    setSaving(true);

    const body = {
      name: form.name.en ? form.name : { vi: form.name.vi },
      ...(form.description.vi
        ? { description: form.description.en ? form.description : { vi: form.description.vi } }
        : {}),
      slug: form.slug,
      categoryIds: form.categoryIds,
      variants: form.variants,
      isActive: form.isActive,
      isFeatured: form.isFeatured,
    };

    try {
      if (form.id) await adminFetch(`/admin/products/${form.id}`, { method: 'PUT', body });
      else await adminFetch('/admin/products', { method: 'POST', body });

      toast.success(form.id ? 'Đã lưu sản phẩm' : 'Đã tạo sản phẩm');
      setForm(null);
      load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Lưu không thành công');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Sản phẩm"
        description={meta.total > 0 ? `${meta.total} sản phẩm` : undefined}
        action={<Button onClick={() => setForm(emptyProductForm())}>Thêm sản phẩm</Button>}
      />

      <div className="mb-4 max-w-sm">
        <Input
          id="product-search"
          label="Tìm theo tên"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
      </div>

      {products === null ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-16" />
          ))}
        </div>
      ) : (
        <DataCard>
          {products.length === 0 ? (
            <EmptyState>Không có sản phẩm nào khớp</EmptyState>
          ) : (
            <ul className="divide-y divide-border">
              {products.map((product) => (
                <li key={product.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-ink">{product.name}</p>
                    <p className="truncate text-xs text-ink-subtle">
                      /{product.slug} · {product.variants.length} biến thể
                    </p>
                  </div>

                  <span className="hidden shrink-0 text-sm text-ink-muted sm:block">
                    {product.priceMin === product.priceMax
                      ? formatVnd(product.priceMin)
                      : `${formatVnd(product.priceMin)} – ${formatVnd(product.priceMax)}`}
                  </span>

                  {product.isFeatured && <Badge tone="accent">Nổi bật</Badge>}

                  <Button size="sm" variant="ghost" onClick={() => void openEdit(product.id)}>
                    Sửa
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </DataCard>
      )}

      {meta.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <Button
            size="sm"
            variant="secondary"
            disabled={meta.page <= 1}
            onClick={() => setPage(meta.page - 1)}
          >
            Trước
          </Button>
          <span className="text-sm text-ink-muted">
            Trang {meta.page} / {meta.totalPages}
          </span>
          <Button
            size="sm"
            variant="secondary"
            disabled={meta.page >= meta.totalPages}
            onClick={() => setPage(meta.page + 1)}
          >
            Sau
          </Button>
        </div>
      )}

      <Modal
        open={form !== null}
        onClose={() => setForm(null)}
        title={form?.id ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}
        className="max-w-3xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setForm(null)}>
              Huỷ
            </Button>
            <Button loading={saving} onClick={() => void save()}>
              Lưu
            </Button>
          </>
        }
      >
        {form && (
          <ProductForm
            form={form}
            onChange={setForm}
            categories={formData?.categories ?? []}
            options={formData?.options ?? []}
          />
        )}
      </Modal>
    </>
  );
}
