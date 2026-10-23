'use client';

import { useMemo, useState } from 'react';
import type {
  Category,
  ProductDetail,
  TranslatedField,
  VariantOptionDetail,
} from '@/lib/api/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/cn';
import { formatVnd } from '@/lib/format';
import { ProductImageManager } from './product-image-manager';
import { TranslatedInput } from './translated-input';

export interface ProductFormState {
  id?: string;
  name: TranslatedField;
  description: TranslatedField;
  slug: string;
  categoryIds: string[];
  variants: VariantRow[];
  isActive: boolean;
  isFeatured: boolean;
}

export interface VariantRow {
  id?: string;
  sizeId: string;
  colorId: string;
  price: number;
  stock: number;
}

export function emptyProductForm(): ProductFormState {
  return {
    name: { vi: '' },
    description: { vi: '' },
    slug: '',
    categoryIds: [],
    variants: [],
    isActive: true,
    isFeatured: false,
  };
}

export function toProductForm(product: ProductDetail): ProductFormState {
  return {
    id: product.id,
    name: { vi: product.name },
    description: { vi: product.description ?? '' },
    slug: product.slug,
    categoryIds: product.categories.map((category) => category.id),
    variants: product.variants.map((variant) => ({
      id: variant.id,
      sizeId: variant.size.id,
      colorId: variant.color.id,
      price: variant.price,
      stock: variant.stock,
    })),
    isActive: true,
    isFeatured: product.isFeatured,
  };
}

interface ProductFormProps {
  form: ProductFormState;
  onChange: (form: ProductFormState) => void;
  categories: Category[];
  options: VariantOptionDetail[];
}

export function ProductForm({ form, onChange, categories, options }: ProductFormProps) {
  const sizes = useMemo(() => options.filter((option) => option.kind === 'SIZE'), [options]);
  const colors = useMemo(() => options.filter((option) => option.kind === 'COLOR'), [options]);
  const [bulkPrice, setBulkPrice] = useState('');

  function addVariant() {
    if (sizes.length === 0 || colors.length === 0) return;

    onChange({
      ...form,
      variants: [
        ...form.variants,
        { sizeId: sizes[0].id, colorId: colors[0].id, price: Number(bulkPrice) || 0, stock: 0 },
      ],
    });
  }

  function patchVariant(index: number, changes: Partial<VariantRow>) {
    onChange({
      ...form,
      variants: form.variants.map((variant, position) =>
        position === index ? { ...variant, ...changes } : variant,
      ),
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <TranslatedInput
        id="product-name"
        label="Tên sản phẩm"
        required
        value={form.name}
        onChange={(name) => onChange({ ...form, name })}
      />

      <Input
        id="product-slug"
        label="Đường dẫn"
        hint="Chữ thường, số và dấu gạch ngang"
        required
        value={form.slug}
        onChange={(event) => onChange({ ...form, slug: event.target.value })}
      />

      <TranslatedInput
        id="product-description"
        label="Mô tả"
        multiline
        value={form.description}
        onChange={(description) => onChange({ ...form, description })}
      />

      <div>
        <p className="mb-2 text-sm font-medium text-ink">Danh mục</p>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((category) => {
            const picked = form.categoryIds.includes(category.id);

            return (
              <button
                key={category.id}
                type="button"
                onClick={() =>
                  onChange({
                    ...form,
                    categoryIds: picked
                      ? form.categoryIds.filter((id) => id !== category.id)
                      : [...form.categoryIds, category.id],
                  })
                }
                className={cn(
                  'rounded-full border px-3 py-1 text-sm transition-colors',
                  picked
                    ? 'border-brand-600 bg-brand-50 text-brand-700'
                    : 'border-border text-ink-muted hover:border-border-strong',
                )}
              >
                {category.name}
              </button>
            );
          })}
        </div>
      </div>

      {form.id ? (
        <ProductImageManager productId={form.id} />
      ) : (
        <p className="rounded-xl border border-dashed border-border px-4 py-5 text-center text-sm text-ink-muted">
          Lưu sản phẩm trước rồi mới thêm được ảnh — ảnh cần gắn vào một sản phẩm đã tồn tại.
        </p>
      )}

      <div>
        <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
          <p className="text-sm font-medium text-ink">
            Biến thể
            <span className="ml-1 font-normal text-ink-subtle">
              ({form.variants.length} — cần ít nhất 1)
            </span>
          </p>

          <div className="flex items-end gap-2">
            <Input
              id="bulk-price"
              label="Giá mặc định"
              type="number"
              className="h-9 w-32"
              value={bulkPrice}
              onChange={(event) => setBulkPrice(event.target.value)}
            />
            <Button size="sm" variant="secondary" onClick={addVariant}>
              Thêm biến thể
            </Button>
          </div>
        </div>

        {form.variants.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-ink-muted">
            Chưa có biến thể nào. Mỗi biến thể là một cặp size + màu với giá và tồn kho riêng.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {form.variants.map((variant, index) => (
              <li
                key={variant.id ?? `new-${index}`}
                className="grid grid-cols-2 gap-2 rounded-xl border border-border p-3 sm:grid-cols-[1fr_1fr_1fr_1fr_auto]"
              >
                <Select
                  id={`variant-size-${index}`}
                  label="Size"
                  value={variant.sizeId}
                  onChange={(event) => patchVariant(index, { sizeId: event.target.value })}
                  options={sizes.map((size) => ({ value: size.id, label: size.label }))}
                />
                <Select
                  id={`variant-color-${index}`}
                  label="Màu"
                  value={variant.colorId}
                  onChange={(event) => patchVariant(index, { colorId: event.target.value })}
                  options={colors.map((color) => ({ value: color.id, label: color.label }))}
                />
                <Input
                  id={`variant-price-${index}`}
                  label="Giá"
                  type="number"
                  hint={variant.price > 0 ? formatVnd(variant.price) : undefined}
                  value={String(variant.price)}
                  onChange={(event) => patchVariant(index, { price: Number(event.target.value) })}
                />
                <Input
                  id={`variant-stock-${index}`}
                  label="Tồn kho"
                  type="number"
                  value={String(variant.stock)}
                  onChange={(event) => patchVariant(index, { stock: Number(event.target.value) })}
                />
                <div className="flex items-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      onChange({
                        ...form,
                        variants: form.variants.filter((_, position) => position !== index),
                      })
                    }
                  >
                    Bỏ
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex gap-4">
        {(
          [
            ['isActive', 'Đang bán'],
            ['isFeatured', 'Nổi bật'],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={form[key]}
              onChange={(event) => onChange({ ...form, [key]: event.target.checked })}
              className="size-4 rounded border-border-strong"
            />
            {label}
          </label>
        ))}
      </div>
    </div>
  );
}
