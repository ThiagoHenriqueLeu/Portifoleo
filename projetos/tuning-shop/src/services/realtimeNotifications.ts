import { off, onValue, ref, set } from "firebase/database";
import { database } from "./firebase";
import { AppUser, Order, OrderStatus } from "../types";

export type RealtimeNotification = {
  id: string;
  title: string;
  message: string;
  target: "admin" | "user";
  userId?: string;
  createdAt: string;
};

function latestAdminNotificationPath() {
  return "notifications/admin/latest";
}

function latestUserNotificationPath(userId: string) {
  return `notifications/users/${userId}/latest`;
}

export function listenLatestNotification(
  user: AppUser,
  onNotification: (notification: RealtimeNotification) => void
) {
  const notificationRef = ref(
    database,
    user.role === "admin" ? latestAdminNotificationPath() : latestUserNotificationPath(user.uid)
  );

  const unsubscribe = onValue(notificationRef, (snapshot) => {
    if (!snapshot.exists()) return;
    onNotification(snapshot.val() as RealtimeNotification);
  });

  return () => {
    off(notificationRef);
    unsubscribe();
  };
}

export async function sendAdminOrderNotification(order: Order) {
  const notification: RealtimeNotification = {
    id: String(Date.now()),
    title: "Nova compra concluida",
    message: `${order.customerName} concluiu o pedido ${order.id}. Total: R$ ${order.total.toFixed(2)}.`,
    target: "admin",
    createdAt: new Date().toISOString()
  };

  await set(ref(database, latestAdminNotificationPath()), notification);
  return notification;
}

export async function sendUserOrderStatusNotification(order: Order, status: OrderStatus) {
  const notification: RealtimeNotification = {
    id: String(Date.now()),
    title: "Status do pedido atualizado",
    message: `Seu pedido ${order.id} mudou para ${status}.`,
    target: "user",
    userId: order.userId,
    createdAt: new Date().toISOString()
  };

  await set(ref(database, latestUserNotificationPath(order.userId)), notification);
  return notification;
}
