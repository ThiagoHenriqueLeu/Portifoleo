import { Picker } from "@react-native-picker/picker";
import { useMemo, useState } from "react";
import { Alert, FlatList, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useStore } from "../../src/context/StoreContext";
import { colors } from "../../src/theme/colors";
import { OrderStatus } from "../../src/types";

const statuses: OrderStatus[] = ["Recebido", "Em separacao", "Enviado", "Concluido", "Cancelado"];
const filters = ["Todos", ...statuses] as const;
type OrderFilter = (typeof filters)[number];

export default function AdminOrdersScreen() {
  const { orders, updateOrderStatus, deleteOrder } = useStore();
  const [selectedFilter, setSelectedFilter] = useState<OrderFilter>("Todos");
  const filteredOrders = useMemo(
    () => selectedFilter === "Todos" ? orders : orders.filter((order) => order.status === selectedFilter),
    [orders, selectedFilter]
  );

  async function confirmDeleteOrder(orderId: string) {
    try {
      await deleteOrder(orderId);
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Nao foi possivel excluir o pedido.");
    }
  }

  function handleDeleteOrder(orderId: string) {
    if (Platform.OS === "web") {
      const shouldDelete = window.confirm("Tem certeza que deseja excluir este pedido?");
      if (shouldDelete) {
        confirmDeleteOrder(orderId);
      }
      return;
    }

    Alert.alert("Excluir pedido", "Tem certeza que deseja excluir este pedido?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: () => confirmDeleteOrder(orderId)
      }
    ]);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pedidos</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={styles.filterContent}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterButton, selectedFilter === filter && styles.filterActive]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text style={[styles.filterText, selectedFilter === filter && styles.filterTextActive]}>{filter}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.empty}>Nenhum pedido neste filtro.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.id}>{item.id}</Text>
            <Text style={styles.customer}>{item.customerName} - {item.customerEmail}</Text>
            <Text style={styles.address}>{item.address}</Text>
            {!!item.couponCode && (
              <Text style={styles.coupon}>Cupom {item.couponCode}: - R$ {(item.discount || 0).toFixed(2)}</Text>
            )}
            <Text style={styles.total}>R$ {item.total.toFixed(2)}</Text>

            <View style={styles.pickerBox}>
              <Picker selectedValue={item.status} onValueChange={(value) => updateOrderStatus(item.id, value)}>
                {statuses.map((status) => (
                  <Picker.Item key={status} label={status} value={status} />
                ))}
              </Picker>
            </View>

            <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteOrder(item.id)}>
              <Text style={styles.deleteText}>Excluir pedido</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: 60, paddingHorizontal: 18 },
  title: { color: colors.text, fontSize: 30, fontWeight: "900", marginBottom: 18 },
  filterBar: { flexGrow: 0, flexShrink: 0, marginBottom: 14 },
  filterContent: { gap: 8, paddingRight: 6 },
  filterButton: { height: 34, borderRadius: 8, paddingHorizontal: 13, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, justifyContent: "center" },
  filterActive: { backgroundColor: colors.dark, borderColor: colors.dark },
  filterText: { color: colors.muted, fontWeight: "900", fontSize: 12 },
  filterTextActive: { color: "#fff" },
  empty: { color: colors.muted, textAlign: "center", marginTop: 80 },
  card: { backgroundColor: colors.surface, borderRadius: 8, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  id: { color: colors.text, fontWeight: "900", fontSize: 16 },
  customer: { color: colors.muted, marginTop: 8 },
  address: { color: colors.text, marginTop: 8 },
  coupon: { color: colors.primary, fontWeight: "900", marginTop: 8 },
  total: { color: colors.primary, fontSize: 20, fontWeight: "900", marginTop: 10 },
  pickerBox: { backgroundColor: colors.background, borderRadius: 8, marginTop: 12, overflow: "hidden" },
  deleteButton: { height: 42, borderRadius: 12, backgroundColor: "#FEE4E2", justifyContent: "center", alignItems: "center", marginTop: 12 },
  deleteText: { color: colors.danger, fontWeight: "900" }
});
