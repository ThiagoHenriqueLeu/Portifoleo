import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useStore } from "../../src/context/StoreContext";
import { colors } from "../../src/theme/colors";

export default function OrdersScreen() {
  const { orders, user, cancelOrder } = useStore();
  const userOrders = orders.filter((order) => order.userId === user?.uid);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meus pedidos</Text>
      <FlatList
        data={userOrders}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.empty}>Nenhum pedido fechado ainda.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.id}>{item.id}</Text>
              <Text style={styles.status}>{item.status}</Text>
            </View>
            <Text style={styles.date}>{new Date(item.createdAt).toLocaleString()}</Text>
            <Text style={styles.items}>{item.items.length} item(ns) - {item.paymentMethod}</Text>
            {!!item.couponCode && (
              <Text style={styles.coupon}>Cupom {item.couponCode} aplicado</Text>
            )}
            <Text style={styles.total}>R$ {item.total.toFixed(2)}</Text>
            {item.status === "Recebido" && (
              <TouchableOpacity style={styles.cancelButton} onPress={() => cancelOrder(item.id)}>
                <Text style={styles.cancelText}>Cancelar pedido</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: 60, paddingHorizontal: 18 },
  title: { color: colors.text, fontSize: 30, fontWeight: "900", marginBottom: 18 },
  empty: { textAlign: "center", color: colors.muted, marginTop: 80 },
  card: { backgroundColor: colors.surface, borderRadius: 8, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  id: { color: colors.text, fontWeight: "900" },
  status: { color: "#fff", backgroundColor: colors.dark, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, overflow: "hidden", fontWeight: "800" },
  date: { color: colors.muted, marginTop: 8 },
  items: { color: colors.text, marginTop: 8 },
  coupon: { color: colors.primary, fontWeight: "900", marginTop: 8 },
  total: { color: colors.primary, fontSize: 20, fontWeight: "900", marginTop: 10 },
  cancelButton: { height: 42, borderRadius: 12, backgroundColor: "#FEE4E2", justifyContent: "center", alignItems: "center", marginTop: 12 },
  cancelText: { color: colors.danger, fontWeight: "900" }
});
