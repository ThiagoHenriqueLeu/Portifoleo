import { Ionicons } from "@expo/vector-icons";
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useStore } from "../../src/context/StoreContext";
import { colors } from "../../src/theme/colors";
import { safeProductImage } from "../../src/utils/images";

export default function FavoritesScreen() {
  const { products, favorites, addToCart, toggleFavorite } = useStore();
  const favoriteProducts = products.filter((product) => favorites.includes(product.id));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Favoritos</Text>
      <Text style={styles.subtitle}>Pecas salvas para comparar e comprar depois.</Text>

      <FlatList
        data={favoriteProducts}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.empty}>Nenhuma peca favoritada ainda.</Text>}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {safeProductImage(item.image) ? (
              <Image source={{ uri: safeProductImage(item.image) }} style={styles.image} />
            ) : (
              <View style={[styles.image, styles.noImage]}>
                <Ionicons name="image" size={30} color={colors.muted} />
              </View>
            )}
            <View style={styles.info}>
              <Text style={styles.category}>{item.category}</Text>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.price}>R$ {item.price.toFixed(2)}</Text>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.cartButton} onPress={() => addToCart(item)}>
                  <Ionicons name="cart" size={18} color="#fff" />
                  <Text style={styles.cartText}>Adicionar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.removeButton} onPress={() => toggleFavorite(item.id)}>
                  <Ionicons name="heart-dislike" size={18} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: 60, paddingHorizontal: 18 },
  title: { color: colors.text, fontSize: 30, fontWeight: "900" },
  subtitle: { color: colors.muted, marginTop: 6, marginBottom: 18 },
  list: { paddingBottom: 90 },
  empty: { color: colors.muted, textAlign: "center", marginTop: 80 },
  card: { backgroundColor: colors.surface, borderRadius: 8, marginBottom: 14, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
  image: { width: "100%", height: 150, backgroundColor: colors.metal },
  noImage: { justifyContent: "center", alignItems: "center" },
  info: { padding: 14 },
  category: { color: colors.primary, fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  name: { color: colors.text, fontSize: 19, fontWeight: "900", marginTop: 4 },
  price: { color: colors.text, fontSize: 20, fontWeight: "900", marginTop: 10 },
  actions: { flexDirection: "row", gap: 10, marginTop: 12 },
  cartButton: { flex: 1, height: 46, borderRadius: 14, backgroundColor: colors.primary, flexDirection: "row", gap: 8, justifyContent: "center", alignItems: "center" },
  cartText: { color: "#fff", fontWeight: "900" },
  removeButton: { width: 46, height: 46, borderRadius: 14, backgroundColor: "#FEE4E2", justifyContent: "center", alignItems: "center" }
});
