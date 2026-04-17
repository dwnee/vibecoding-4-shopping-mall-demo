import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { cartApi } from '../api/cart';

const isLoggedIn = () => !!localStorage.getItem('token');

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      // 로그인 후 서버 장바구니를 로컬 상태에 동기화
      syncFromServer: (serverItems) => {
        const items = serverItems.map((item) => ({
          _id: item.product?._id ?? item.product,
          name: item.product?.name ?? item.name,
          price: item.product?.price ?? item.price,
          images: item.product?.images ?? (item.image ? [item.image] : []),
          quantity: item.quantity,
        }));
        set({ items });
      },

      addItem: (product, quantity = 1) => {
        const items = get().items;
        const existing = items.find((item) => item._id === product._id);
        if (existing) {
          set({
            items: items.map((item) =>
              item._id === product._id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ),
          });
        } else {
          set({ items: [...items, { ...product, quantity }] });
        }
        if (isLoggedIn()) {
          cartApi.addItem(product._id, quantity).catch(() => {});
        }
      },

      removeItem: (id) => {
        set({ items: get().items.filter((item) => item._id !== id) });
        if (isLoggedIn()) {
          cartApi.removeItem(id).catch(() => {});
        }
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          set({ items: get().items.filter((item) => item._id !== id) });
          if (isLoggedIn()) {
            cartApi.removeItem(id).catch(() => {});
          }
        } else {
          set({
            items: get().items.map((item) =>
              item._id === id ? { ...item, quantity } : item
            ),
          });
          if (isLoggedIn()) {
            cartApi.updateItem(id, quantity).catch(() => {});
          }
        }
      },

      clearCart: () => {
        set({ items: [] });
        if (isLoggedIn()) {
          cartApi.clearCart().catch(() => {});
        }
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items }),
    }
  )
);

export default useCartStore;
