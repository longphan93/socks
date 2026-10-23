import { Inject, Injectable } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { DRIZZLE, type Database } from '../../../database/drizzle.provider.js';
import { shippingMethods } from '../../../database/schema/index.js';

@Injectable()
export class ShippingMethodRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  findAllActive() {
    return this.db
      .select()
      .from(shippingMethods)
      .where(eq(shippingMethods.isActive, true))
      .orderBy(asc(shippingMethods.sortOrder));
  }

  findById(id: string) {
    return this.db.select().from(shippingMethods).where(eq(shippingMethods.id, id)).get();
  }

  findByCode(code: string) {
    return this.db.select().from(shippingMethods).where(eq(shippingMethods.code, code)).get();
  }
}
