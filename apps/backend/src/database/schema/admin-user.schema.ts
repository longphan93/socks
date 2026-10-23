import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { pk, timestamp } from './columns.helper.js';

export const adminUsers = sqliteTable('admin_users', {
  id: pk(),
  email: text().notNull().unique(),
  passwordHash: text().notNull(),
  name: text().notNull(),
  createdAt: timestamp(),
});
