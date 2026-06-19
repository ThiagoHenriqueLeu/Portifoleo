import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { NotificationHost } from "../src/components/NotificationHost";
import { StoreProvider } from "../src/context/StoreContext";

export default function RootLayout() {
  return (
    <StoreProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(user)" />
        <Stack.Screen name="(admin)" />
      </Stack>
      <NotificationHost />
    </StoreProvider>
  );
}
