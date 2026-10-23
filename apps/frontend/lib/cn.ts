import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Gộp class, class truyền từ ngoài vào luôn thắng class mặc định của component. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
