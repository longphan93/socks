'use client';

import { useState } from 'react';
import { adminFetch } from '@/lib/admin/client';
import { useAsyncData } from '@/lib/admin/use-async-data';
import { ApiError } from '@/lib/api/client';
import type { TranslatedField, VariantOptionDetail, VariantOptionKind } from '@/lib/api/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import { DataCard, EmptyState } from './data-card';
import { PageHeader } from './page-header';
import { TranslatedInput } from './translated-input';

interface FormState {
  id?: string;
  kind: VariantOptionKind;
  value: string;
  label: TranslatedField;
  hexColor: string;
  sortOrder: number;
}

const EMPTY: FormState = { kind: 'SIZE', value: '', label: { vi: '' }, hexColor: '#1a1a1a', sortOrder: 0 };

const KIND_LABEL: Record<VariantOptionKind, string> = { SIZE: 'Size', COLOR: 'Màu' };

export function VariantOptionManager() {

  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: options, reload: load } = useAsyncData(
    'variant-options',
    () => adminFetch<VariantOptionDetail[]>('/admin/variant-options'),
  );


  async function save() {
    if (!form) return;

    setSaving(true);

    const isColor = form.kind === 'COLOR';
    const body = {
      value: form.value,
      label: form.label.en ? form.label : { vi: form.label.vi },
      sortOrder: form.sortOrder,
      ...(isColor ? { hexColor: form.hexColor } : {}),
    };

    try {
      if (form.id) {
        await adminFetch(`/admin/variant-options/${form.id}`, { method: 'PUT', body });
      } else {
        await adminFetch('/admin/variant-options', {
          method: 'POST',
          body: { ...body, kind: form.kind },
        });
      }

      toast.success(form.id ? 'Đã lưu' : 'Đã thêm');
      setForm(null);
      load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Lưu không thành công');
    } finally {
      setSaving(false);
    }
  }

  async function hide(option: VariantOptionDetail) {
    try {
      await adminFetch(`/admin/variant-options/${option.id}`, { method: 'DELETE' });
      toast.success(`Đã ẩn ${option.label}`);
      load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Không ẩn được');
    }
  }

  return (
    <>
      <PageHeader
        title="Size và màu"
        description="Danh sách dùng chung cho mọi sản phẩm. Ẩn thay vì xoá để biến thể cũ còn tham chiếu được."
        action={<Button onClick={() => setForm({ ...EMPTY })}>Thêm</Button>}
      />

      {options === null ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-14" />
          ))}
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {(['SIZE', 'COLOR'] as const).map((kind) => {
            const rows = options.filter((option) => option.kind === kind);

            return (
              <DataCard key={kind}>
                <p className="border-b border-border px-5 py-3 text-sm font-medium text-ink">
                  {KIND_LABEL[kind]}
                </p>

                {rows.length === 0 ? (
                  <EmptyState>Chưa có mục nào</EmptyState>
                ) : (
                  <ul className="divide-y divide-border">
                    {rows.map((option) => (
                      <li key={option.id} className="flex items-center gap-3 px-5 py-3">
                        {option.hexColor && (
                          <span
                            className="size-5 shrink-0 rounded-full border border-border"
                            style={{ backgroundColor: option.hexColor }}
                            aria-hidden="true"
                          />
                        )}

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-ink">{option.label}</p>
                          <p className="truncate text-xs text-ink-subtle">{option.value}</p>
                        </div>

                        {!option.isActive && <Badge tone="neutral">Đã ẩn</Badge>}

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setForm({
                              id: option.id,
                              kind: option.kind,
                              value: option.value,
                              label: { vi: option.label },
                              hexColor: option.hexColor ?? '#1a1a1a',
                              sortOrder: option.sortOrder,
                            })
                          }
                        >
                          Sửa
                        </Button>

                        {option.isActive && (
                          <Button size="sm" variant="ghost" onClick={() => void hide(option)}>
                            Ẩn
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </DataCard>
            );
          })}
        </div>
      )}

      <Modal
        open={form !== null}
        onClose={() => setForm(null)}
        title={form?.id ? 'Sửa' : 'Thêm size hoặc màu'}
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
            {!form.id && (
              <div className="flex gap-2">
                {(['SIZE', 'COLOR'] as const).map((kind) => (
                  <Button
                    key={kind}
                    size="sm"
                    variant={form.kind === kind ? 'primary' : 'secondary'}
                    onClick={() => setForm({ ...form, kind })}
                  >
                    {KIND_LABEL[kind]}
                  </Button>
                ))}
              </div>
            )}

            <TranslatedInput
              id="option-label"
              label="Tên hiển thị"
              required
              value={form.label}
              onChange={(label) => setForm({ ...form, label })}
            />

            <Input
              id="option-value"
              label="Giá trị trong URL"
              hint="Chữ thường, số và dấu gạch ngang. Ví dụ: 39-42, xanh-navy"
              required
              value={form.value}
              onChange={(event) => setForm({ ...form, value: event.target.value })}
            />

            {form.kind === 'COLOR' && (
              <div className="flex items-end gap-3">
                <Input
                  id="option-hex"
                  label="Mã màu"
                  className="font-mono"
                  value={form.hexColor}
                  onChange={(event) => setForm({ ...form, hexColor: event.target.value })}
                />
                <input
                  type="color"
                  aria-label="Chọn màu"
                  value={form.hexColor}
                  onChange={(event) => setForm({ ...form, hexColor: event.target.value })}
                  className="mb-0.5 size-11 cursor-pointer rounded-xl border border-border bg-surface"
                />
              </div>
            )}

            <Input
              id="option-sort"
              label="Thứ tự"
              type="number"
              value={String(form.sortOrder)}
              onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })}
            />
          </div>
        )}
      </Modal>
    </>
  );
}
