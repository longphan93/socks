'use client';

import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Một dòng giỏ hàng là một biến thể (size + màu) cụ thể. */
export interface CartItem {
  variantId: string;
  productId: string;
  productSlug: string;
  productName: string;
  /** Ví dụ: "Size M · Xanh navy" */
  variantLabel: string;
  /** VND, số nguyên. */
  unitPrice: number;
  imageUrl: string | null;
  quantity: number;
  /** Tồn kho đọc được lúc thêm vào giỏ. Backend vẫn kiểm tra lại khi đặt hàng. */
  stock: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clear: () => void;
}

/**
 * Giỏ hàng nằm hoàn toàn ở trình duyệt (localStorage) — MVP không có tài khoản
 * khách hàng và không có bảng Cart. Giá và tồn kho ở đây chỉ để hiển thị;
 * backend tính lại khi checkout.
 */
export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],

      addItem: (item, quantity = 1) =>
        set((state) => {
          const existing = state.items.find(
            (line) => line.variantId === item.variantId,
          );

          if (!existing) {
            return {
              items: [
                ...state.items,
                { ...item, quantity: clamp(quantity, item.stock) },
              ],
            };
          }

          return {
            items: state.items.map((line) =>
              line.variantId === item.variantId
                ? {
                    ...line,
                    ...item,
                    quantity: clamp(line.quantity + quantity, item.stock),
                  }
                : line,
            ),
          };
        }),

      setQuantity: (variantId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((line) => line.variantId !== variantId)
              : state.items.map((line) =>
                  line.variantId === variantId
                    ? { ...line, quantity: clamp(quantity, line.stock) }
                    : line,
                ),
        })),

      removeItem: (variantId) =>
        set((state) => ({
          items: state.items.filter((line) => line.variantId !== variantId),
        })),

      clear: () => set({ items: [] }),
    }),
    {
      name: 'socks-cart',
      version: 1,
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

function clamp(quantity: number, stock: number): number {
  return Math.max(1, Math.min(quantity, Math.max(stock, 1)));
}

/* --------------------------------------------------------------- selectors */

export function selectTotalQuantity(state: CartState): number {
  return state.items.reduce((total, line) => total + line.quantity, 0);
}

export function selectSubtotal(state: CartState): number {
  return state.items.reduce(
    (total, line) => total + line.unitPrice * line.quantity,
    0,
  );
}

/**
 * localStorage chỉ có ở trình duyệt, nên lần render đầu trên server và lần
 * hydrate đầu tiên phải coi như giỏ rỗng để không lệch HTML.
 */
export function useCartHydrated(): boolean {
  return useSyncExternalStore(
    (onStoreChange) => useCartStore.persist.onFinishHydration(onStoreChange),
    () => useCartStore.persist.hasHydrated(),
    () => false,
  );
}
