/**
 * Chạy backend và frontend trong cùng một container.
 *
 * Viết bằng Node thay vì shell vì `wait -n` không có trên ash của Alpine: cần
 * một tiến trình chết là cả container dừng, nếu không orchestrator sẽ thấy
 * container vẫn "khoẻ" trong khi một nửa ứng dụng đã chết.
 */
import { spawn } from 'node:child_process';

const BACKEND_PORT = process.env.PORT ?? '4000';
const FRONTEND_PORT = process.env.FRONTEND_PORT ?? '4001';

// Cả hai server đều đọc biến PORT, nên mỗi tiến trình nhận một env riêng.
const processes = [
  {
    name: 'backend',
    args: ['apps/backend/dist/main.js'],
    env: { PORT: BACKEND_PORT },
  },
  {
    name: 'frontend',
    args: ['apps/frontend/server.js'],
    env: { PORT: FRONTEND_PORT, HOSTNAME: process.env.HOSTNAME ?? '0.0.0.0' },
  },
];

const children = processes.map(({ name, args, env }) => {
  const child = spawn('node', args, { stdio: 'inherit', env: { ...process.env, ...env } });

  child.on('exit', (code, signal) => {
    console.error(`[start] ${name} dừng (code=${code}, signal=${signal}), dừng container`);
    shutdown(code ?? 1);
  });

  return child;
});

let shuttingDown = false;

function shutdown(code) {
  if (shuttingDown) return;

  shuttingDown = true;

  for (const child of children) {
    if (child.exitCode === null) child.kill('SIGTERM');
  }

  // Cho các tiến trình con 10 giây để đóng kết nối đang xử lý.
  setTimeout(() => process.exit(code), 10_000).unref();
  process.exitCode = code;
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => shutdown(0));
}
