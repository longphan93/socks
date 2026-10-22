import { plainToInstance, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

export enum NodeEnv {
  Development = 'development',
  Test = 'test',
  Production = 'production',
}

const toInt = () =>
  Transform(({ value }) => (value === undefined || value === '' ? undefined : Number(value)));

const toBool = () =>
  Transform(({ value }) => (value === undefined || value === '' ? undefined : value === 'true'));

/**
 * Biến môi trường của backend.
 *
 * Bắt buộc từ Phase 1: NODE_ENV, PORT, D1_GATEWAY_*.
 * Các nhóm còn lại (Cloudflare, R2, SMTP, admin seed) vẫn được kiểm tra kiểu
 * nếu có mặt, nhưng chưa bắt buộc để backend khởi động được trước khi tới
 * phase dùng đến chúng. Phase nào bắt buộc được ghi ngay trên từng nhóm.
 */
export class Env {
  @IsEnum(NodeEnv)
  NODE_ENV: NodeEnv = NodeEnv.Development;

  @toInt()
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT = 3000;

  /** Domain được phép gọi API, phân tách bằng dấu phẩy. */
  @IsString()
  CORS_ORIGINS = 'http://localhost:3001';

  /* --- D1 gateway (Phase 1) --- */

  @IsUrl({ require_tld: false, protocols: ['http', 'https'] })
  D1_GATEWAY_URL!: string;

  @IsString()
  @MinLength(16, { message: 'D1_GATEWAY_SECRET phải dài ít nhất 16 ký tự' })
  D1_GATEWAY_SECRET!: string;

  @toInt()
  @IsInt()
  @Min(100)
  D1_GATEWAY_TIMEOUT_MS = 10_000;

  /** Số lần thử lại khi gateway lỗi mạng. Chỉ áp dụng cho câu lệnh đọc. */
  @toInt()
  @IsInt()
  @Min(0)
  @Max(5)
  D1_GATEWAY_RETRIES = 2;

  /** TTL cache catalog. Mỗi truy vấn D1 là một lượt gọi HTTPS nên cache ngắn vẫn đáng giá. */
  @toInt()
  @IsInt()
  @Min(0)
  CATALOG_CACHE_TTL_MS = 30_000;

  /* --- Cloudflare (Phase 1 dùng cho migration, Phase 13 cho backup) --- */

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  CLOUDFLARE_ACCOUNT_ID?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  CLOUDFLARE_API_TOKEN?: string;

  /* --- R2 (bắt buộc từ Phase 5) --- */

  @IsOptional()
  @IsUrl({ require_tld: false })
  R2_ENDPOINT?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  R2_BUCKET?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  R2_ACCESS_KEY_ID?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  R2_SECRET_ACCESS_KEY?: string;

  /** Base URL công khai của bucket, dùng để dựng link ảnh. */
  @IsOptional()
  @IsUrl({ require_tld: false })
  R2_PUBLIC_BASE_URL?: string;

  /* --- Email (bắt buộc từ Phase 8) --- */

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  SMTP_HOST?: string;

  @IsOptional()
  @toInt()
  @IsInt()
  @Min(1)
  @Max(65535)
  SMTP_PORT?: number;

  @IsOptional()
  @toBool()
  @IsBoolean()
  SMTP_SECURE?: boolean;

  @IsOptional()
  @IsString()
  SMTP_USER?: string;

  @IsOptional()
  @IsString()
  SMTP_PASS?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  MAIL_FROM?: string;

  @IsOptional()
  @IsEmail()
  ADMIN_NOTIFY_EMAIL?: string;

  /** Link form xin feedback gửi kèm email khi đơn COMPLETED. */
  @IsOptional()
  @IsUrl({ require_tld: false })
  FEEDBACK_URL?: string;

  /* --- Admin seed (bắt buộc từ Phase 3) --- */

  @IsOptional()
  @IsEmail()
  ADMIN_EMAIL?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  ADMIN_PASSWORD?: string;
}

export function validateEnv(raw: Record<string, unknown>): Env {
  const env = plainToInstance(Env, raw, {
    enableImplicitConversion: false,
    exposeDefaultValues: true,
    excludeExtraneousValues: false,
  });

  const errors = validateSync(env, { skipMissingProperties: false, whitelist: false });
  if (errors.length > 0) {
    const details = errors
      .map((error) => `  - ${error.property}: ${Object.values(error.constraints ?? {}).join(', ')}`)
      .join('\n');
    throw new Error(`Biến môi trường không hợp lệ:\n${details}`);
  }

  return env;
}

export function splitOrigins(value: string): string[] {
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}
