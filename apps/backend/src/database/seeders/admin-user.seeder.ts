import { Logger } from '@nestjs/common';
import { hash } from 'bcrypt';
import { Database } from '../drizzle.provider.js';
import { adminUsers } from '../schema/index.js';

const BCRYPT_ROUNDS = 10;

export async function seedAdminUser(db: Database, email?: string, password?: string): Promise<void> {
  const logger = new Logger('Seed');

  if (!email || !password) {
    logger.warn('Bỏ qua admin: chưa đặt ADMIN_EMAIL và ADMIN_PASSWORD trong .env');

    return;
  }

  await db
    .insert(adminUsers)
    .values({ email, name: 'Quản trị viên', passwordHash: await hash(password, BCRYPT_ROUNDS) })
    .onConflictDoNothing();

  logger.log(`admin_users: ${email}`);
}
