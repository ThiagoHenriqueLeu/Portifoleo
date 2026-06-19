export type UserRole = "admin" | "user";

export type AppUser = {
  uid: string;
  name: string;
  email: string;
  cellphone: string;
  role: UserRole;
};

export type Product = {
  id: string;
  name: string;
  category: string;
  brand: string;
  price: number;
  stock: number;
  description: string;
  image: string;
};

export type CartItem = {
  product: Product;
  quantity: number;
};

export type Coupon = {
  code: string;
  discountPercent: number;
  active: boolean;
  description: string;
};

export type OrderStatus = "Recebido" | "Em separacao" | "Enviado" | "Concluido" | "Cancelado";

export type Order = {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  address: string;
  paymentMethod: string;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  discount?: number;
  couponCode?: string;
  total: number;
  status: OrderStatus;
  createdAt: string;
};
