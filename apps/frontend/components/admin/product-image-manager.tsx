'use client';

import Image from 'next/image';
import { useState, type ChangeEvent, type DragEvent } from 'react';
import { adminFetch } from '@/lib/admin/client';
import { useAsyncData } from '@/lib/admin/use-async-data';
import {
  ALLOWED_IMAGE_TYPES,
  presignImage,
  putToStorage,
  validateImage,
  type PresignResult,
} from '@/lib/admin/upload';
import { ApiError } from '@/lib/api/client';
import type { ProductImageDetail } from '@/lib/api/types';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/cn';

interface Uploading {
  name: string;
  percent: number;
}

export function ProductImageManager({ productId }: { productId: string }) {
  const { data: images, reload } = useAsyncData(`images-${productId}`, () =>
    adminFetch<ProductImageDetail[]>(`/admin/products/${productId}/images`),
  );

  const [uploading, setUploading] = useState<Uploading[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      // Kiểm ngay tại chỗ: sai định dạng hay quá nặng thì khỏi gọi API.
      const problem = validateImage(file);

      if (problem) {
        toast.error(problem);
        continue;
      }

      await uploadOne(file);
    }

    reload();
  }

  async function uploadOne(file: File): Promise<void> {
    setUploading((current) => [...current, { name: file.name, percent: 0 }]);

    const track = (percent: number) =>
      setUploading((current) =>
        current.map((item) => (item.name === file.name ? { ...item, percent } : item)),
      );

    try {
      const presigned: PresignResult = await presignImage(file);

      // File đi thẳng từ trình duyệt lên kho, không qua backend.
      await putToStorage(presigned.uploadUrl, file, track);

      await adminFetch(`/admin/products/${productId}/images`, {
        method: 'POST',
        body: { key: presigned.key },
      });

      toast.success(`Đã tải lên ${file.name}`);
    } catch (error) {
      toast.error(
        error instanceof ApiError || error instanceof Error
          ? error.message
          : `Không tải lên được ${file.name}`,
      );
    } finally {
      setUploading((current) => current.filter((item) => item.name !== file.name));
    }
  }

  async function remove(image: ProductImageDetail) {
    if (!window.confirm('Xoá ảnh này? Ảnh cũng bị xoá khỏi kho lưu trữ.')) return;

    try {
      await adminFetch(`/admin/products/${productId}/images/${image.id}`, { method: 'DELETE' });
      toast.success('Đã xoá ảnh');
      reload();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Không xoá được ảnh');
    }
  }

  async function drop(event: DragEvent, targetIndex: number) {
    event.preventDefault();

    if (dragIndex === null || !images || dragIndex === targetIndex) return;

    const reordered = [...images];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    setDragIndex(null);

    try {
      await adminFetch(`/admin/products/${productId}/images/order`, {
        method: 'PUT',
        body: { ids: reordered.map((image) => image.id) },
      });
      reload();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Không đổi được thứ tự');
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-ink">
          Ảnh
          {images && images.length > 0 && (
            <span className="ml-1 font-normal text-ink-subtle">
              ({images.length} — ảnh đầu tiên hiện ngoài lưới sản phẩm)
            </span>
          )}
        </p>

        <label className="cursor-pointer">
          <input
            type="file"
            multiple
            accept={ALLOWED_IMAGE_TYPES.join(',')}
            className="sr-only"
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              void handleFiles(event.target.value ? event.target.files : null);
              event.target.value = '';
            }}
          />
          <span className="inline-flex h-9 items-center rounded-full border border-border-strong px-3 text-sm text-ink transition-colors hover:bg-surface-muted">
            Chọn ảnh
          </span>
        </label>
      </div>

      {uploading.map((item) => (
        <div key={item.name} className="rounded-xl border border-border px-3 py-2">
          <div className="flex justify-between text-xs text-ink-muted">
            <span className="truncate">{item.name}</span>
            <span>{item.percent}%</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-sunken">
            <div
              className="h-full rounded-full bg-brand-600 transition-[width]"
              style={{ width: `${item.percent}%` }}
            />
          </div>
        </div>
      ))}

      {images === null ? (
        <p className="text-sm text-ink-subtle">Đang tải…</p>
      ) : images.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-ink-muted">
          Chưa có ảnh nào. Ảnh đầu tiên sẽ là ảnh hiện ngoài lưới sản phẩm.
        </p>
      ) : (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.map((image, index) => (
            <li
              key={image.id}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => void drop(event, index)}
              className={cn(
                'group relative aspect-square overflow-hidden rounded-xl border bg-surface-sunken',
                dragIndex === index ? 'border-brand-600 opacity-50' : 'border-border',
              )}
            >
              <Image
                src={image.url}
                alt={image.alt ?? ''}
                fill
                sizes="160px"
                className="object-cover"
                // Không qua bộ tối ưu của Next: nó từ chối host loopback của
                // LocalStack khi dev. Ảnh admin tối đa 5 MB và mỗi sản phẩm
                // vài tấm nên chấp nhận được; storefront ở Phase 10 sẽ cấu
                // hình tối ưu với domain ảnh thật.
                unoptimized
              />

              {index === 0 && (
                <span className="absolute top-1 left-1 rounded bg-ink/70 px-1.5 py-0.5 text-[0.6875rem] text-white">
                  Ảnh chính
                </span>
              )}

              <button
                type="button"
                onClick={() => void remove(image)}
                aria-label="Xoá ảnh"
                className="absolute top-1 right-1 rounded-full bg-ink/70 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              >
                <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      {images && images.length > 1 && (
        <p className="text-xs text-ink-subtle">Kéo thả để đổi thứ tự.</p>
      )}
    </div>
  );
}
