import { readFile, readdir } from 'node:fs/promises';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { LocaleEnum } from '../enums/index.js';

type Messages = Record<string, string>;

/**
 * Dịch key lỗi sang câu người đọc được.
 *
 * Lỗi trong code luôn là key (`auth.invalid_credentials`), không phải câu, nên
 * thêm ngôn ngữ về sau không phải sửa chỗ ném lỗi. Key thiếu bản dịch thì rơi
 * về tiếng Việt; thiếu luôn thì trả lại chính key để lỗi lộ ra thay vì im lặng.
 */
@Injectable()
export class I18nService implements OnModuleInit {
  private readonly logger = new Logger(I18nService.name);
  private readonly messages = new Map<LocaleEnum, Messages>();

  async onModuleInit(): Promise<void> {
    for (const locale of Object.values(LocaleEnum)) {
      this.messages.set(locale, await this.load(locale));
    }
  }

  translate(key: string, locale: LocaleEnum = LocaleEnum.VI): string {
    return (
      this.messages.get(locale)?.[key] ?? this.messages.get(LocaleEnum.VI)?.[key] ?? key
    );
  }

  /** Lấy ngôn ngữ từ header `Accept-Language`; không nhận ra thì dùng tiếng Việt. */
  resolveLocale(acceptLanguage?: string): LocaleEnum {
    const requested = (acceptLanguage ?? '')
      .split(',')
      .map((part) => part.split(';')[0].trim().slice(0, 2).toLowerCase());

    return (
      requested.find((code): code is LocaleEnum =>
        Object.values(LocaleEnum).includes(code as LocaleEnum),
      ) ?? LocaleEnum.VI
    );
  }

  /** Gộp các file JSON của một ngôn ngữ thành bản đồ phẳng `<file>.<key>`. */
  private async load(locale: LocaleEnum): Promise<Messages> {
    const directory = new URL(`../../i18n/${locale}/`, import.meta.url);
    const messages: Messages = {};

    const files = await readdir(directory).catch(() => {
      this.logger.error(`Không đọc được thư mục i18n của ngôn ngữ "${locale}"`);

      return [] as string[];
    });

    for (const file of files.filter((name) => name.endsWith('.json'))) {
      const domain = file.replace(/\.json$/, '');
      const content = JSON.parse(await readFile(new URL(file, directory), 'utf8')) as Messages;

      for (const [key, value] of Object.entries(content)) {
        messages[`${domain}.${key}`] = value;
      }
    }

    return messages;
  }
}
