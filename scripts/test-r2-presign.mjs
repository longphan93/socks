/**
 * Kiểm tra cấu hình R2: xin presigned PUT, upload thẳng lên bucket, đọc lại, dọn dẹp.
 *
 * Chạy: npm run r2:test
 * Nếu bước PUT lỗi CORS thì sửa CORS policy của bucket (cho phép PUT từ domain FE).
 */
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const required = ['R2_ENDPOINT', 'R2_BUCKET', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY'];
const missing = required.filter((name) => !process.env[name]);
if (missing.length > 0) {
  console.error(`Thiếu biến môi trường: ${missing.join(', ')}`);
  process.exit(1);
}

const client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const Bucket = process.env.R2_BUCKET;
const Key = `_smoke-test/${Date.now()}.txt`;
const body = `presign smoke test ${new Date().toISOString()}`;

async function main() {
  const putUrl = await getSignedUrl(
    client,
    new PutObjectCommand({ Bucket, Key, ContentType: 'text/plain' }),
    { expiresIn: 300 },
  );
  console.log(`1/3 Đã xin presigned PUT cho ${Key}`);

  const uploaded = await fetch(putUrl, {
    method: 'PUT',
    headers: { 'content-type': 'text/plain' },
    body,
  });
  if (!uploaded.ok) {
    throw new Error(`PUT thất bại: ${uploaded.status} ${await uploaded.text()}`);
  }
  console.log('2/3 Upload thẳng lên R2 thành công (backend không nhận file)');

  const getUrl = await getSignedUrl(client, new GetObjectCommand({ Bucket, Key }), {
    expiresIn: 300,
  });
  const downloaded = await fetch(getUrl);
  const text = await downloaded.text();
  if (text !== body) {
    throw new Error(`Nội dung đọc lại không khớp: "${text}"`);
  }
  console.log('3/3 Đọc lại đúng nội dung đã ghi');

  if (process.env.R2_PUBLIC_BASE_URL) {
    const publicUrl = `${process.env.R2_PUBLIC_BASE_URL.replace(/\/+$/, '')}/${Key}`;
    const publicResponse = await fetch(publicUrl);
    console.log(
      publicResponse.ok
        ? `   Bucket đọc công khai được: ${publicUrl}`
        : `   Bucket chưa public (${publicResponse.status}) — cần nếu FE hiển thị ảnh trực tiếp`,
    );
  }
}

try {
  await main();
  console.log('\nR2 OK.');
} catch (error) {
  console.error(`\nR2 lỗi: ${error.message}`);
  process.exitCode = 1;
} finally {
  await client.send(new DeleteObjectCommand({ Bucket, Key })).catch(() => {});
}
