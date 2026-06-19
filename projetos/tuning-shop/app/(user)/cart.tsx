import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useStore } from "../../src/context/StoreContext";
import { colors } from "../../src/theme/colors";
import { safeProductImage } from "../../src/utils/images";

export default function CartScreen() {
  const router = useRouter();
  const { cart, cartTotal, changeQuantity, removeFromCart, clearCart } = useStore();
  const shipping = cartTotal >= 500 || cart.length === 0 ? 0 : 39.9;

  function confirmRemoveItem(productId: string, productName: string) {
    Alert.alert("Remover item", `Deseja remover ${productName} do carrinho?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Remover", style: "destructive", onPress: () => removeFromCart(productId) }
    ]);
  }

  function confirmClearCart() {
    Alert.alert("Limpar carrinho", "Deseja remover todos os itens do carrinho?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Limpar tudo", style: "destructive", onPress: clearCart }
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Carrinho</Text>
        {cart.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={confirmClearCart}>
            <Ionicons name="trash" size={16} color={colors.danger} />
            <Text style={styles.clearText}>Limpar Tudo</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={cart}
        keyExtractor={(item) => item.product.id}
        ListEmptyComponent={<Text style={styles.empty}>Seu carrinho ainda esta vazio.</Text>}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.item}>
            {safeProductImage(item.product.image) ? (
              <Image source={{ uri: safeProductImage(item.product.image) }} style={styles.image} />
            ) : (
              <View style={[styles.image, styles.noImage]}>
                <Ionicons name="image" size={22} color={colors.muted} />
              </View>
            )}
            <View style={styles.info}>
              <Text style={styles.name}>{item.product.name}</Text>
              <Text style={styles.price}>R$ {item.product.price.toFixed(2)}</Text>
              <View style={styles.quantity}>
                <TouchableOpacity style={styles.iconButton} onPress={() => changeQuantity(item.product.id, -1)}>
                  <Ionicons name="remove" size={18} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.qty}>{item.quantity}</Text>
                <TouchableOpacity style={styles.iconButton} onPress={() => changeQuantity(item.product.id, 1)}>
                  <Ionicons name="add" size={18} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.trash}
                  onPress={() => confirmRemoveItem(item.product.id, item.product.name)}
                >
                  <Ionicons name="trash" size={18} color={colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />

      <View style={styles.summary}>
        <View style={styles.summaryLine}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>R$ {cartTotal.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryLine}>
          <Text style={styles.summaryLabel}>Frete</Text>
          <Text style={styles.summaryValue}>{shipping === 0 ? "Gratis" : `R$ ${shipping.toFixed(2)}`}</Text>
        </View>
        <View style={styles.totalLine}>
          <Text style={styles.totalText}>Total</Text>
          <Text style={styles.totalText}>R$ {(cartTotal + shipping).toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.checkout, cart.length === 0 && styles.checkoutDisabled]}
          disabled={cart.length === 0}
          onPress={() => router.push("/(user)/checkout")}
        >
          <Text style={styles.checkoutText}>Fechar compra</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: 60, paddingHorizontal: 18 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  title: { color: colors.text, fontSize: 30, fontWeight: "900" },
  clearButton: { height: 38, borderRadius: 12, backgroundColor: "#FEE4E2", paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 6 },
  clearText: { color: colors.danger, fontWeight: "900", fontSize: 12 },
  list: { paddingBottom: 240 },
  empty: { color: colors.muted, textAlign: "center", marginTop: 80 },
  item: { flexDirection: "row", backgroundColor: colors.surface, borderRadius: 8, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  image: { width: 92, height: 92, borderRadius: 8, backgroundColor: colors.metal },
  noImage: { justifyContent: "center", alignItems: "center" },
  info: { flex: 1, marginLeft: 12 },
  name: { color: colors.text, fontSize: 16, fontWeight: "900" },
  price: { color: colors.primary, fontWeight: "900", marginTop: 6 },
  quantity: { flexDirection: "row", alignItems: "center", marginTop: 12, gap: 8 },
  iconButton: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.background, justifyContent: "center", alignItems: "center" },
  trash: { width: 34, height: 34, borderRadius: 10, backgroundColor: "#FEE4E2", justifyContent: "center", alignItems: "center", marginLeft: "auto" },
  qty: { minWidth: 22, textAlign: "center", fontWeight: "900" },
  summary: { position: "absolute", left: 18, right: 18, bottom: 86, backgroundColor: colors.surface, borderRadius: 8, padding: 16, borderWidth: 1, borderColor: colors.border },
  summaryLine: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  summaryLabel: { color: colors.muted },
  summaryValue: { color: colors.text, fontWeight: "800" },
  totalLine: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, marginTop: 6 },
  totalText: { color: colors.text, fontSize: 20, fontWeight: "900" },
  checkout: { height: 54, borderRadius: 16, backgroundColor: colors.primary, justifyContent: "center", alignItems: "center", marginTop: 14 },
  checkoutDisabled: { backgroundColor: colors.metal },
  checkoutText: { color: "#fff", fontWeight: "900", fontSize: 16 }
});
