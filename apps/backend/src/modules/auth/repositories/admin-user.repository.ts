import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE, type Database } from '../../../database/drizzle.provider.js';
import { adminUsers } from '../../../database/schema/index.js';

@Injectable()
export class AdminUserRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  findByEmail(email: string) {
    return this.db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, email.toLowerCase().trim()))
      .get();
  }

  findById(id: string) {
    return this.db.select().from(adminUsers).where(eq(adminUsers.id, id)).get();
  }
}
