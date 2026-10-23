'use client';

import { useState } from 'react';
import type { TranslatedField } from '@/lib/api/types';
import { CONTROL_CLASS, Field } from '@/components/ui/field';
import { cn } from '@/lib/cn';

interface TranslatedInputProps {
  id: string;
  label: string;
  value: TranslatedField;
  onChange: (value: TranslatedField) => void;
  multiline?: boolean;
  required?: boolean;
  hint?: string;
}

const TABS = [
  { locale: 'vi' as const, label: 'Tiếng Việt' },
  { locale: 'en' as const, label: 'English' },
];

/**
 * Ô nhập cho nội dung dịch được.
 *
 * Tiếng Anh để trống vẫn lưu được — backend rơi về tiếng Việt khi hiển thị,
 * nên bắt nhập đủ hai thứ tiếng chỉ làm chậm việc lên hàng.
 */
export function TranslatedInput({
  id,
  label,
  value,
  onChange,
  multiline,
  required,
  hint,
}: TranslatedInputProps) {
  const [active, setActive] = useState<'vi' | 'en'>('vi');
  const Control = multiline ? 'textarea' : 'input';

  return (
    <Field id={`${id}-${active}`} label={label} required={required} hint={hint}>
      <div className="mb-2 flex gap-1">
        {TABS.map((tab) => (
          <button
            key={tab.locale}
            type="button"
            onClick={() => setActive(tab.locale)}
            className={cn(
              'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
              active === tab.locale
                ? 'bg-brand-50 text-brand-700'
                : 'text-ink-subtle hover:bg-surface-sunken',
            )}
          >
            {tab.label}
            {tab.locale === 'en' && !value.en && (
              <span className="ml-1 text-ink-subtle" title="Chưa có bản dịch">
                •
              </span>
            )}
          </button>
        ))}
      </div>

      <Control
        id={`${id}-${active}`}
        value={active === 'vi' ? value.vi : (value.en ?? '')}
        required={required && active === 'vi'}
        rows={multiline ? 3 : undefined}
        onChange={(event: { target: { value: string } }) =>
          onChange({ ...value, [active]: event.target.value })
        }
        className={cn(CONTROL_CLASS, multiline ? 'py-2' : 'h-11')}
      />
    </Field>
  );
}
