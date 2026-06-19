import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { get, onValue, ref, remove, set, update } from "firebase/database";
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { auth, database } from "../services/firebase";
import { localApi } from "../services/localApi";
import { sendAdminOrderNotification, sendUserOrderStatusNotification } from "../services/realtimeNotifications";
import { AppUser, CartItem, Order, OrderStatus, Product, UserRole } from "../types";

type StoreContextType = {
  user: AppUser | null;
  products: Product[];
  cart: CartItem[];
  orders: Order[];
  favorites: string[];
  loadingProducts: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  register: (data: Omit<AppUser, "uid"> & { password: string }) => Promise<void>;
  updateUserProfile: (data: Pick<AppUser, "name" | "cellphone">) => Promise<void>;
  logout: () => Promise<void>;
  saveProduct: (product: Omit<Product, "id"> & { id?: string }) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addToCart: (product: Product) => void;
  changeQuantity: (productId: string, amount: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  closeOrder: (address: string, paymentMethod: string, shipping: number, discount?: number, couponCode?: string) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
  toggleFavorite: (productId: string) => Promise<void>;
  isFavorite: (productId: string) => boolean;
  cartTotal: number;
  cartCount: number;
};

const StoreContext = createContext({} as StoreContextType);

function getFirebaseAuthMessage(error: any) {
  const code = error?.code || "";

  if (code === "auth/configuration-not-found" || code === "auth/operation-not-allowed") {
    return "Ative Authentication > Email/Password no Firebase para cadastrar usuarios.";
  }

  if (code === "auth/invalid-credential" || code === "auth/user-not-found" || code === "auth/wrong-password") {
    return "E-mail ou senha incorretos.";
  }

  if (code === "auth/email-already-in-use") {
    return "Este e-mail ja esta cadastrado.";
  }

  if (code === "auth/weak-password") {
    return "A senha precisa ter pelo menos 6 caracteres.";
  }

  if (code === "auth/invalid-email") {
    return "Digite um e-mail valido.";
  }

  return error?.message || "Erro ao conectar com o Firebase Auth.";
}

function getPasswordValidationMessage(password: string) {
  if (password.length < 6) return "A senha precisa ter no minimo 6 caracteres.";
  if (!/[A-Z]/.test(password)) return "A senha precisa ter pelo menos uma letra maiuscula.";
  if (!/[a-z]/.test(password)) return "A senha precisa ter pelo menos uma letra minuscula.";
  if (!/[^A-Za-z0-9]/.test(password)) return "A senha precisa ter pelo menos um simbolo.";
  return "";
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    localApi.getProducts()
      .then((apiProducts) => {
        setProducts(apiProducts);
        setLoadingProducts(false);
      })
      .catch(() => {});

    localApi.getOrders()
      .then(setOrders)
      .catch(() => {});

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        return;
      }

      try {
        const apiUser = await localApi.getUser(firebaseUser.uid);
        setUser(apiUser);
        return;
      } catch {}

      const snapshot = await get(ref(database, `users/${firebaseUser.uid}`));
      if (snapshot.exists()) {
        const firebaseProfile = snapshot.val() as AppUser;
        setUser(firebaseProfile);
        localApi.saveUser(firebaseProfile).catch(() => {});
      }
    });

    const productsRef = ref(database, "products");
    const unsubscribeProducts = onValue(productsRef, async (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setProducts([]);
        setLoadingProducts(false);
        return;
      }

      setProducts(Object.values(data) as Product[]);
      setLoadingProducts(false);
    });

    const ordersRef = ref(database, "orders");
    const unsubscribeOrders = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      setOrders(data ? (Object.values(data) as Order[]) : []);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeProducts();
      unsubscribeOrders();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setFavorites([]);
      return;
    }

    const favoritesRef = ref(database, `favorites/${user.uid}`);
    localApi.getFavorites(user.uid)
      .then(setFavorites)
      .catch(() => {});

    const unsubscribeFavorites = onValue(favoritesRef, (snapshot) => {
      const data = snapshot.val();
      setFavorites(data ? Object.keys(data) : []);
    });

    return () => unsubscribeFavorites();
  }, [user]);

  const cartTotal = useMemo(
    () => cart.reduce((total, item) => total + item.product.price * item.quantity, 0),
    [cart]
  );

  const cartCount = useMemo(
    () => cart.reduce((total, item) => total + item.quantity, 0),
    [cart]
  );

  async function ensureDemoUser(email: string, password: string, role: UserRole) {
    const isDemoAdmin = email.toLowerCase() === "admin@tuning.com" && password === "Admin123!" && role === "admin";
    const isDemoUser = email.toLowerCase() === "cliente@tuning.com" && password === "Cliente123!" && role === "user";

    if (!isDemoAdmin && !isDemoUser) {
      return null;
    }

    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const demoUser: AppUser = {
      uid: credential.user.uid,
      name: isDemoAdmin ? "Administrador" : "Cliente Tuning",
      email,
      cellphone: isDemoAdmin ? "(11) 99999-0000" : "(11) 98888-1111",
      role
    };

    try {
      await localApi.saveUser(demoUser);
    } catch {
      await set(ref(database, `users/${demoUser.uid}`), demoUser);
    }

    return demoUser;
  }

  async function login(email: string, password: string, role: UserRole) {
    let credential;

    try {
      credential = await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      try {
        const demoUser = await ensureDemoUser(email, password, role);
        if (demoUser) {
          setUser(demoUser);
          return;
        }
      } catch (createError: any) {
        throw new Error(getFirebaseAuthMessage(createError));
      }

      throw new Error(getFirebaseAuthMessage(error));
    }

    let foundUser: AppUser | null = null;

    try {
      foundUser = await localApi.getUser(credential.user.uid);
    } catch {
      const snapshot = await get(ref(database, `users/${credential.user.uid}`));
      if (snapshot.exists()) {
        foundUser = snapshot.val() as AppUser;
        localApi.saveUser(foundUser).catch(() => {});
      }
    }

    if (!foundUser) {
      await signOut(auth);
      throw new Error("Usuario existe no Auth, mas nao tem perfil no banco.");
    }

    if (foundUser.role !== role) {
      await signOut(auth);
      throw new Error("Este login nao pertence ao perfil selecionado.");
    }

    setUser(foundUser);
  }

  async function register(data: Omit<AppUser, "uid"> & { password: string }) {
    const passwordMessage = getPasswordValidationMessage(data.password);
    if (passwordMessage) {
      throw new Error(passwordMessage);
    }

    let credential;

    try {
      credential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    } catch (error: any) {
      throw new Error(getFirebaseAuthMessage(error));
    }

    const newUser: AppUser = {
      uid: credential.user.uid,
      name: data.name,
      email: data.email,
      cellphone: data.cellphone,
      role: data.role
    };

    try {
      await localApi.saveUser(newUser);
    } catch {
      await set(ref(database, `users/${newUser.uid}`), newUser);
    }

    setUser(newUser);
  }

  async function updateUserProfile(data: Pick<AppUser, "name" | "cellphone">) {
    if (!user) {
      throw new Error("Usuario nao logado.");
    }

    const updatedUser = {
      ...user,
      name: data.name,
      cellphone: data.cellphone
    };

    const orderUpdates = orders
      .filter((order) => order.userId === user.uid)
      .reduce<Record<string, string>>((updates, order) => {
        updates[`orders/${order.id}/customerName`] = data.name;
        return updates;
      }, {});

    try {
      await localApi.saveUser(updatedUser);
    } catch {
      await update(ref(database), {
        [`users/${user.uid}`]: updatedUser,
        ...orderUpdates
      });
    }

    setUser(updatedUser);
  }

  async function logout() {
    await signOut(auth);
    setUser(null);
    setCart([]);
    setFavorites([]);
  }

  async function saveProduct(product: Omit<Product, "id"> & { id?: string }) {
    const productId = product.id || `p${Date.now()}`;
    if (!productId) throw new Error("Nao foi possivel gerar o codigo da peca.");

    const productToSave = {
      ...product,
      id: productId
    };

    const savedProduct = await localApi.saveProduct(productToSave);
    setProducts((current) => {
      const exists = current.some((item) => item.id === savedProduct.id);
      return exists
        ? current.map((item) => (item.id === savedProduct.id ? savedProduct : item))
        : [...current, savedProduct];
    });
  }

  async function deleteProduct(id: string) {
    await localApi.deleteProduct(id);
    setProducts((current) => current.filter((product) => product.id !== id));

    setCart((current) => current.filter((item) => item.product.id !== id));
  }

  function addToCart(product: Product) {
    if (product.stock <= 0) return;

    setCart((current) => {
      const exists = current.find((item) => item.product.id === product.id);
      if (exists) {
        if (exists.quantity >= product.stock) return current;
        return current.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...current, { product, quantity: 1 }];
    });
  }

  function changeQuantity(productId: string, amount: number) {
    setCart((current) =>
      current
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: Math.min(item.product.stock, Math.max(0, item.quantity + amount)) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function removeFromCart(productId: string) {
    setCart((current) => current.filter((item) => item.product.id !== productId));
  }

  function clearCart() {
    setCart([]);
  }

  async function closeOrder(address: string, paymentMethod: string, shipping = 5, discount = 0, couponCode = "") {
    if (!user || cart.length === 0) {
      throw new Error("Carrinho vazio ou usuario nao logado.");
    }

    const orderId = `o${Date.now()}`;
    const dbProducts = products.reduce<Record<string, Product>>((items, product) => {
      items[product.id] = product;
      return items;
    }, {});
    const stockUpdates: Record<string, number> = {};

    for (const item of cart) {
      const currentProduct = dbProducts[item.product.id];
      if (!currentProduct) {
        throw new Error(`A peca ${item.product.name} nao existe mais no estoque.`);
      }

      if (currentProduct.stock < item.quantity) {
        throw new Error(`Estoque insuficiente para ${item.product.name}. Disponivel: ${currentProduct.stock}.`);
      }

      stockUpdates[item.product.id] = currentProduct.stock - item.quantity;
    }

    const appliedDiscount = Math.min(Math.max(discount, 0), cartTotal);
    const order: Order = {
      id: orderId,
      userId: user.uid,
      customerName: user.name,
      customerEmail: user.email,
      address,
      paymentMethod,
      items: cart,
      subtotal: cartTotal,
      shipping,
      discount: appliedDiscount,
      couponCode,
      total: cartTotal - appliedDiscount + shipping,
      status: "Recebido",
      createdAt: new Date().toISOString()
    };

    try {
      await localApi.checkout(order, stockUpdates);
      setProducts((current) =>
        current.map((product) =>
          stockUpdates[product.id] !== undefined ? { ...product, stock: stockUpdates[product.id] } : product
        )
      );
      setOrders((current) => [order, ...current]);
    } catch {
      const firebaseStockUpdates = Object.entries(stockUpdates).reduce<Record<string, number>>((updates, [id, stock]) => {
        updates[`products/${id}/stock`] = stock;
        return updates;
      }, {});

      await update(ref(database), {
        [`orders/${orderId}`]: order,
        ...firebaseStockUpdates
      });
    }

    await sendAdminOrderNotification(order).catch(() => {});
    setCart([]);
    return order;
  }

  async function updateOrderStatus(orderId: string, status: OrderStatus) {
    const currentOrder = orders.find((order) => order.id === orderId);

    try {
      await localApi.updateOrderStatus(orderId, status);
      setOrders((current) =>
        current.map((order) => (order.id === orderId ? { ...order, status } : order))
      );
    } catch {
      await update(ref(database, `orders/${orderId}`), { status });
    }

    if (currentOrder) {
      await sendUserOrderStatusNotification({ ...currentOrder, status }, status).catch(() => {});
    }
  }

  async function cancelOrder(orderId: string) {
    await updateOrderStatus(orderId, "Cancelado");
  }

  async function deleteOrder(orderId: string) {
    try {
      await localApi.deleteOrder(orderId);
      setOrders((current) => current.filter((order) => order.id !== orderId));
    } catch {
      await remove(ref(database, `orders/${orderId}`));
    }
  }

  async function toggleFavorite(productId: string) {
    if (!user) return;
    const isAlreadyFavorite = favorites.includes(productId);
    const favoriteRef = ref(database, `favorites/${user.uid}/${productId}`);

    if (isAlreadyFavorite) {
      try {
        await localApi.removeFavorite(user.uid, productId);
      } catch {
        await remove(favoriteRef);
      }
      setFavorites((current) => current.filter((id) => id !== productId));
      return;
    }

    try {
      await localApi.addFavorite(user.uid, productId);
    } catch {
      await set(favoriteRef, true);
    }

    setFavorites((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId]
    );
  }

  function isFavorite(productId: string) {
    return favorites.includes(productId);
  }

  return (
    <StoreContext.Provider
      value={{
        user,
        products,
        cart,
        orders,
        favorites,
        loadingProducts,
        login,
        register,
        updateUserProfile,
        logout,
        saveProduct,
        deleteProduct,
        addToCart,
        changeQuantity,
        removeFromCart,
        clearCart,
        closeOrder,
        updateOrderStatus,
        cancelOrder,
        deleteOrder,
        toggleFavorite,
        isFavorite,
        cartTotal,
        cartCount
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  return useContext(StoreContext);
}
