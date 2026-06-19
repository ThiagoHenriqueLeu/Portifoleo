import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { colors } from "../../src/theme/colors";

export default function UserLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          height: 84,
          paddingTop: 8,
          paddingBottom: 10,
          backgroundColor: colors.surface,
          borderTopColor: colors.border
        },
        tabBarItemStyle: {
          minHeight: 64,
          paddingVertical: 4
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "800",
          lineHeight: 13,
          marginTop: 2
        }
      }}
    >
      <Tabs.Screen name="store" options={{ title: "Loja", tabBarIcon: ({ color }) => <Ionicons name="car-sport" size={22} color={color} /> }} />
      <Tabs.Screen name="favorites" options={{ title: "Favoritos", tabBarIcon: ({ color }) => <Ionicons name="heart" size={22} color={color} /> }} />
      <Tabs.Screen name="cart" options={{ title: "Carrinho", tabBarIcon: ({ color }) => <Ionicons name="cart" size={22} color={color} /> }} />
      <Tabs.Screen name="orders" options={{ title: "Pedidos", tabBarIcon: ({ color }) => <Ionicons name="receipt" size={22} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: "Perfil", tabBarIcon: ({ color }) => <Ionicons name="person" size={22} color={color} /> }} />
      <Tabs.Screen name="checkout" options={{ href: null }} />
    </Tabs>
  );
}
