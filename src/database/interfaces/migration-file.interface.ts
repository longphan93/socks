import { AbstractD1Migration } from '../abstract-d1.migration.js';

/** Một file migration đã nạp: tên dùng để ghi sổ và class để chạy. */
export interface MigrationFileInterface {
  name: string;
  migration: AbstractD1Migration;
}
