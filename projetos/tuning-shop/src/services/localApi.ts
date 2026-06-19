import { AppUser, Coupon, Order, OrderStatus, Product } from "../types";

declare const process: {
  env?: Record<string, string | undefined>;
};

const API_BASE_URL = process.env?.EXPO_PUBLIC_API_URL || "http://10.85.178.122:3333";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || "Erro ao conectar com a API local.");
  }

  return data as T;
}

export const localApi = {
  getProducts: () => request<Product[]>("/products"),
  getCoupons: () => request<Coupon[]>("/coupons"),
  saveProduct: (product: Omit<Product, "id"> & { id?: string }) =>
    request<Product>("/products", {
      method: "POST",
      body: JSON.stringify(product)
    }),
  deleteProduct: (id: string) =>
    request<{ ok: boolean }>(`/products/${id}`, {
      method: "DELETE"
    }),
  getOrders: () => request<Order[]>("/orders"),
  checkout: (order: Order, stockUpdates: Record<string, number>) =>
    request<Order>("/checkout", {
      method: "POST",
      body: JSON.stringify({ order, stockUpdates })
    }),
  updateOrderStatus: (orderId: string, status: OrderStatus) =>
    request<Order>(`/orders/${orderId}`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    }),
  deleteOrder: (orderId: string) =>
    request<{ ok: boolean }>(`/orders/${orderId}`, {
      method: "DELETE"
    }),
  getUser: (uid: string) => request<AppUser>(`/users/${uid}`),
  saveUser: (user: AppUser) =>
    request<AppUser>(`/users/${user.uid}`, {
      method: "PUT",
      body: JSON.stringify(user)
    }),
  getFavorites: (uid: string) => request<string[]>(`/favorites/${uid}`),
  addFavorite: (uid: string, productId: string) =>
    request<{ ok: boolean }>(`/favorites/${uid}/${productId}`, {
      method: "PUT"
    }),
  removeFavorite: (uid: string, productId: string) =>
    request<{ ok: boolean }>(`/favorites/${uid}/${productId}`, {
      method: "DELETE"
    }),
  syncFirebase: (direction: "pull" | "push" = "pull") =>
    request<{ ok: boolean }>(`/sync/firebase?direction=${direction}`, {
      method: "POST"
    }),
  savePushToken: (uid: string, token: string, role: AppUser["role"]) =>
    request<{ ok: boolean }>(`/push-tokens/${uid}`, {
      method: "PUT",
      body: JSON.stringify({ token, role })
    })
};
