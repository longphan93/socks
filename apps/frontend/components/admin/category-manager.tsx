'use client';

import { useState } from 'react';
import { adminFetch } from '@/lib/admin/client';
import { useAsyncData } from '@/lib/admin/use-async-data';
import { ApiError } from '@/lib/api/client';
import {
  CATEGORY_GROUPS,
  CATEGORY_GROUP_LABELS,
  type Category,
  type CategoryGroup,
  type TranslatedField,
} from '@/lib/api/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import { DataCard, EmptyState } from './data-card';
import { PageHeader } from './page-header';
import { TranslatedInput } from './translated-input';

interface AdminCategory extends Category {
  isActive?: boolean;
  sortOrder?: number;
}

interface FormState {
  id?: string;
  name: TranslatedField;
  description: TranslatedField;
  slug: string;
  group: CategoryGroup;
  sortOrder: number;
  isActive: boolean;
  isFeatured: boolean;
}

const EMPTY: FormState = {
  name: { vi: '' },
  description: { vi: '' },
  slug: '',
  group: 'TYPE',
  sortOrder: 0,
  isActive: true,
  isFeatured: false,
};

export function CategoryManager() {

  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: categories, reload: load } = useAsyncData(
    'categories',
    () => adminFetch<AdminCategory[]>('/admin/categories'),
  );


  async function save() {
    if (!form) return;

    setSaving(true);

    const body = {
      name: form.name.en ? form.name : { vi: form.name.vi },
      ...(form.description.vi
        ? { description: form.description.en ? form.description : { vi: form.description.vi } }
        : {}),
      slug: form.slug,
      group: form.group,
      sortOrder: form.sortOrder,
      isActive: form.isActive,
      isFeatured: form.isFeatured,
    };

    try {
      if (form.id) await adminFetch(`/admin/categories/${form.id}`, { method: 'PUT', body });
      else await adminFetch('/admin/categories', { method: 'POST', body });

      toast.success(form.id ? 'Đã lưu danh mục' : 'Đã tạo danh mục');
      setForm(null);
      load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Lưu không thành công');
    } finally {
      setSaving(false);
    }
  }

  async function remove(category: AdminCategory) {
    if (!window.confirm(`Xoá danh mục "${category.name}"? Sản phẩm vẫn giữ nguyên.`)) return;

    try {
      await adminFetch(`/admin/categories/${category.id}`, { method: 'DELETE' });
      toast.success('Đã xoá danh mục, sản phẩm không bị ảnh hưởng');
      load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Không xoá được');
    }
  }

  return (
    <>
      <PageHeader
        title="Danh mục"
        description="Một sản phẩm thuộc nhiều danh mục. Xoá danh mục chỉ gỡ liên kết, không xoá sản phẩm."
        action={<Button onClick={() => setForm({ ...EMPTY })}>Thêm danh mục</Button>}
      />

      {categories === null ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-14" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {CATEGORY_GROUPS.map((group) => {
            const rows = categories.filter((category) => category.group === group);

            if (rows.length === 0) return null;

            return (
              <DataCard key={group}>
                <p className="border-b border-border px-5 py-3 text-sm font-medium text-ink">
                  {CATEGORY_GROUP_LABELS[group]}
                </p>

                <ul className="divide-y divide-border">
                  {rows.map((category) => (
                    <li key={category.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-ink">{category.name}</p>
                        <p className="truncate text-xs text-ink-subtle">/{category.slug}</p>
                      </div>

                      {category.isFeatured && <Badge tone="accent">Nổi bật</Badge>}
                      {category.isActive === false && <Badge tone="neutral">Đã tắt</Badge>}

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setForm({
                            id: category.id,
                            name: { vi: category.name },
                            description: { vi: category.description ?? '' },
                            slug: category.slug,
                            group: category.group,
                            sortOrder: category.sortOrder ?? 0,
                            isActive: category.isActive ?? true,
                            isFeatured: category.isFeatured,
                          })
                        }
                      >
                        Sửa
                      </Button>

                      <Button size="sm" variant="ghost" onClick={() => void remove(category)}>
                        Xoá
                      </Button>
                    </li>
                  ))}
                </ul>
              </DataCard>
            );
          })}

          {categories.length === 0 && (
            <DataCard>
              <EmptyState>Chưa có danh mục nào</EmptyState>
            </DataCard>
          )}
        </div>
      )}

      <Modal
        open={form !== null}
        onClose={() => setForm(null)}
        title={form?.id ? 'Sửa danh mục' : 'Thêm danh mục'}
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
          <div className="flex flex-col gap-4">
            <TranslatedInput
              id="category-name"
              label="Tên danh mục"
              required
              value={form.name}
              onChange={(name) => setForm({ ...form, name })}
            />

            <Input
              id="category-slug"
              label="Đường dẫn"
              hint="Chữ thường, số và dấu gạch ngang. Ví dụ: qua-tet"
              required
              value={form.slug}
              onChange={(event) => setForm({ ...form, slug: event.target.value })}
            />

            <Select
              id="category-group"
              label="Nhóm"
              value={form.group}
              onChange={(event) =>
                setForm({ ...form, group: event.target.value as CategoryGroup })
              }
              options={CATEGORY_GROUPS.map((group) => ({
                value: group,
                label: CATEGORY_GROUP_LABELS[group],
              }))}
            />

            <TranslatedInput
              id="category-description"
              label="Mô tả"
              multiline
              value={form.description}
              onChange={(description) => setForm({ ...form, description })}
            />

            <Input
              id="category-sort"
              label="Thứ tự"
              type="number"
              value={String(form.sortOrder)}
              onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })}
            />

            <div className="flex gap-4">
              {(
                [
                  ['isActive', 'Đang bật'],
                  ['isFeatured', 'Nổi bật'],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={form[key]}
                    onChange={(event) => setForm({ ...form, [key]: event.target.checked })}
                    className="size-4 rounded border-border-strong"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
