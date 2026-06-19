import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { useStore } from "../context/StoreContext";
import { listenLatestNotification, RealtimeNotification } from "../services/realtimeNotifications";

type NotificationsModule = typeof import("expo-notifications");

let notificationsModule: NotificationsModule | null = null;

export function NotificationHost() {
  const { user } = useStore();
  const lastNotificationIdRef = useRef("");

  useEffect(() => {
    if (!user) return;

    let unsubscribe = () => {};
    let active = true;
    const listenerStartedAt = Date.now();

    setupLocalNotifications()
      .then((Notifications) => {
        if (!Notifications || !active) return;

        unsubscribe = listenLatestNotification(user, (notification) => {
          if (!shouldShowNotification(notification, listenerStartedAt, lastNotificationIdRef.current)) {
            lastNotificationIdRef.current = notification.id;
            return;
          }

          lastNotificationIdRef.current = notification.id;
          Notifications.scheduleNotificationAsync({
            content: {
              title: notification.title,
              body: notification.message,
              sound: "default",
              data: {
                notificationId: notification.id,
                target: notification.target,
                userId: notification.userId || ""
              }
            },
            trigger: null
          }).catch((error) => {
            console.warn("Nao foi possivel mostrar a notificacao local.", error?.message || error);
          });
        });
      })
      .catch((error) => {
        console.warn("Nao foi possivel preparar notificacoes locais.", error?.message || error);
      });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [user]);

  return null;
}

async function setupLocalNotifications() {
  if (notificationsModule) return notificationsModule;

  const Notifications = await import("expo-notifications");

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      priority: Notifications.AndroidNotificationPriority.HIGH
    })
  });

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("orders", {
      name: "Pedidos",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#F5B301",
      sound: "default"
    });
  }

  const permission = await Notifications.getPermissionsAsync();
  const finalPermission = permission.granted ? permission : await Notifications.requestPermissionsAsync();

  if (!finalPermission.granted) {
    console.warn("Permissao de notificacao nao concedida.");
    return null;
  }

  notificationsModule = Notifications;
  return notificationsModule;
}

function shouldShowNotification(
  notification: RealtimeNotification,
  listenerStartedAt: number,
  lastNotificationId: string
) {
  if (!notification?.id || notification.id === lastNotificationId) return false;

  const notificationTime = Date.parse(notification.createdAt || "");
  if (notificationTime && notificationTime < listenerStartedAt - 1000) return false;

  return true;
}
