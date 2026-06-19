import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { colors } from "../../src/theme/colors";

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: "#B8C1CC",
        tabBarStyle: {
          height: 82,
          paddingTop: 8,
          paddingBottom: 10,
          backgroundColor: colors.dark,
          borderTopColor: colors.dark
        },
        tabBarItemStyle: {
          minHeight: 62,
          paddingVertical: 4
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "800",
          lineHeight: 14,
          marginTop: 2
        }
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: "Painel", tabBarIcon: ({ color }) => <Ionicons name="grid" size={22} color={color} /> }} />
      <Tabs.Screen name="products" options={{ title: "Pecas", tabBarIcon: ({ color }) => <Ionicons name="construct" size={22} color={color} /> }} />
      <Tabs.Screen name="orders" options={{ title: "Pedidos", tabBarIcon: ({ color }) => <Ionicons name="receipt" size={22} color={color} /> }} />
      <Tabs.Screen name="product-form" options={{ href: null }} />
    </Tabs>
  );
}
