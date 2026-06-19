import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { BrandLogo } from "../../src/components/BrandLogo";
import { useStore } from "../../src/context/StoreContext";
import { colors } from "../../src/theme/colors";

export default function DashboardScreen() {
  const router = useRouter();
  const { products, orders, logout } = useStore();
  const validOrders = orders.filter((order) => order.status !== "Cancelado");
  const revenue = validOrders.reduce((sum, order) => sum + order.total, 0);
  const lowStock = products.filter((product) => product.stock <= 6);

  function handleLogout() {
    logout();
    router.replace("/");
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <BrandLogo light compact />
          <Text style={styles.eyebrow}>Admin</Text>
          <Text style={styles.title}>Painel da loja</Text>
        </View>
        <TouchableOpacity style={styles.exit} onPress={handleLogout}>
          <Ionicons name="log-out" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Pecas</Text>
          <Text style={styles.metricValue}>{products.length}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Pedidos</Text>
          <Text style={styles.metricValue}>{orders.length}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Estoque baixo</Text>
          <Text style={styles.metricValue}>{lowStock.length}</Text>
        </View>
        <View style={styles.metricWide}>
          <Text style={styles.metricLabel}>Faturamento</Text>
          <Text style={styles.metricValue}>R$ {revenue.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.alertBox}>
        <Text style={styles.alertTitle}>Alertas de estoque</Text>
        <Text style={styles.alertText}>
          {lowStock.length > 0
            ? `${lowStock.length} peca(s) precisam de reposicao.`
            : "Todas as pecas estao com estoque confortavel."}
        </Text>
      </View>

      <TouchableOpacity style={styles.action} onPress={() => router.push("/(admin)/product-form")}>
        <Ionicons name="add-circle" size={24} color="#fff" />
        <Text style={styles.actionText}>Cadastrar nova peca</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dark, paddingTop: 62, paddingHorizontal: 20 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 28 },
  eyebrow: { color: colors.accent, fontWeight: "900" },
  title: { color: "#fff", fontSize: 32, fontWeight: "900" },
  exit: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primary, justifyContent: "center", alignItems: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  metric: { flex: 1, minWidth: "45%", backgroundColor: "#1E2A35", borderRadius: 8, padding: 16 },
  metricWide: { width: "100%", backgroundColor: "#1E2A35", borderRadius: 8, padding: 16 },
  metricLabel: { color: "#B8C1CC", fontWeight: "800" },
  metricValue: { color: "#fff", fontSize: 28, fontWeight: "900", marginTop: 10 },
  alertBox: { backgroundColor: "#1E2A35", borderRadius: 8, padding: 16, marginTop: 18, borderWidth: 1, borderColor: "rgba(245,179,1,0.35)" },
  alertTitle: { color: colors.accent, fontWeight: "900", fontSize: 16 },
  alertText: { color: "#E8EEF4", marginTop: 6 },
  action: { height: 58, borderRadius: 16, backgroundColor: colors.primary, flexDirection: "row", gap: 10, alignItems: "center", justifyContent: "center", marginTop: 24 },
  actionText: { color: "#fff", fontWeight: "900", fontSize: 16 }
});
