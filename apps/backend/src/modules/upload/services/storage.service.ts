import {
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from '../../../config/env.js';
import { PRESIGN_EXPIRES_SECONDS } from '../constants/index.js';
import { StorageObjectInterface } from '../interfaces/index.js';

/**
 * Bọc kho lưu trữ tương thích S3.
 *
 * Production là Cloudflare R2, khi dev là LocalStack — cùng giao thức nên cùng
 * một đoạn code. Dùng path-style vì cả hai đều đánh địa chỉ
 * `<endpoint>/<bucket>/<key>`.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client | null;
  private readonly bucket?: string;
  private readonly publicBaseUrl?: string;

  constructor(config: ConfigService<Env, true>) {
    const endpoint = config.get('R2_ENDPOINT', { infer: true });
    const accessKeyId = config.get('R2_ACCESS_KEY_ID', { infer: true });
    const secretAccessKey = config.get('R2_SECRET_ACCESS_KEY', { infer: true });

    this.bucket = config.get('R2_BUCKET', { infer: true });
    this.publicBaseUrl = config.get('R2_PUBLIC_BASE_URL', { infer: true });

    // Chưa cấu hình kho lưu trữ thì app vẫn chạy được, chỉ upload là hỏng —
    // để health và phần bán hàng không chết theo.
    this.client =
      endpoint && accessKeyId && secretAccessKey && this.bucket
        ? new S3Client({
            region: 'auto',
            endpoint,
            forcePathStyle: true,
            credentials: { accessKeyId, secretAccessKey },
            // Từ bản 3.729 SDK tự thêm x-amz-checksum-crc32 và ký kèm, nhưng
            // trình duyệt PUT lên bằng URL ký thì không gửi header đó nên kho
            // trả "Value for x-amz-checksum-crc32 header is invalid". Chỉ tính
            // checksum khi thao tác thật sự bắt buộc.
            requestChecksumCalculation: 'WHEN_REQUIRED',
            responseChecksumValidation: 'WHEN_REQUIRED',
          })
        : null;

    if (!this.client) {
      this.logger.warn('Chưa cấu hình R2_*, chức năng upload ảnh sẽ không dùng được');
    }
  }

  get isConfigured(): boolean {
    return this.client !== null;
  }

  /** URL để trình duyệt PUT thẳng lên kho, backend không nhận file. */
  presignPut(key: string, contentType: string): Promise<string> {
    return getSignedUrl(
      this.require(),
      // Ký kèm ContentType: client gửi loại khác thì chữ ký không khớp và kho
      // từ chối, nên không lách được kiểm tra định dạng ở bước xin URL.
      new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: contentType }),
      {
        expiresIn: PRESIGN_EXPIRES_SECONDS,
        // Không khai báo thì SDK chỉ ký `host`, và client gửi Content-Type nào
        // cũng qua — kiểm tra định dạng ở bước xin URL thành vô nghĩa vì người
        // ta xin URL cho .png rồi đẩy lên file .exe.
        signableHeaders: new Set(['content-type']),
      },
    );
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.require().send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));

      return true;
    } catch {
      return false;
    }
  }

  async remove(key: string): Promise<void> {
    await this.require().send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  async list(prefix: string): Promise<StorageObjectInterface[]> {
    const objects: StorageObjectInterface[] = [];
    let token: string | undefined;

    do {
      const page = await this.require().send(
        new ListObjectsV2Command({ Bucket: this.bucket, Prefix: prefix, ContinuationToken: token }),
      );

      for (const item of page.Contents ?? []) {
        if (item.Key) objects.push({ key: item.Key, lastModified: item.LastModified });
      }

      token = page.NextContinuationToken;
    } while (token);

    return objects;
  }

  publicUrl(key: string): string {
    return `${(this.publicBaseUrl ?? '').replace(/\/+$/, '')}/${key}`;
  }

  private require(): S3Client {
    if (!this.client) {
      throw new InternalServerErrorException('upload.storage_not_configured');
    }

    return this.client;
  }
}
