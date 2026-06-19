import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { FlatList, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useStore } from "../../src/context/StoreContext";
import { colors } from "../../src/theme/colors";
import { Product } from "../../src/types";
import { getCategoryIcon } from "../../src/utils/categories";
import { safeProductImage } from "../../src/utils/images";

export default function StoreScreen() {
  const { products, addToCart, cartCount, user, toggleFavorite, isFavorite, loadingProducts } = useStore();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todos");
  const [sort, setSort] = useState("Destaques");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const categories = ["Todos", ...Array.from(new Set(products.map((item) => item.category)))];

  const filtered = products
    .filter((item) => {
      const matchesCategory = category === "Todos" || item.category === category;
      const query = search.toLowerCase();
      return matchesCategory && `${item.name} ${item.brand} ${item.category}`.toLowerCase().includes(query);
    })
    .sort((a, b) => {
      if (sort === "Menor preco") return a.price - b.price;
      if (sort === "Maior preco") return b.price - a.price;
      if (sort === "Nome") return a.name.localeCompare(b.name);
      return b.stock - a.stock;
    });

  function renderProduct({ item }: { item: Product }) {
    const productImage = safeProductImage(item.image);

    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.88} onPress={() => setSelectedProduct(item)}>
        {productImage ? (
          <Image source={{ uri: productImage }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.noImage]}>
            <Ionicons name="image" size={34} color={colors.muted} />
          </View>
        )}
        <TouchableOpacity style={styles.favoriteButton} onPress={() => toggleFavorite(item.id)}>
          <Ionicons name={isFavorite(item.id) ? "heart" : "heart-outline"} size={22} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.cardBody}>
          <Text style={styles.category}>{item.category}</Text>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.description}>{item.description}</Text>
          <Text style={styles.stock}>{item.stock} unidades em estoque</Text>
          <View style={styles.row}>
            <Text style={styles.price}>R$ {item.price.toFixed(2)}</Text>
            <TouchableOpacity
              style={[styles.cartButton, item.stock <= 0 && styles.cartButtonDisabled]}
              onPress={() => addToCart(item)}
              disabled={item.stock <= 0}
            >
              <Ionicons name="add" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Bem-vindo</Text>
          <Text style={styles.title}>{user?.name || "Cliente"}</Text>
        </View>
        <View style={styles.badge}>
          <Ionicons name="cart" size={20} color={colors.primary} />
          <Text style={styles.badgeText}>{cartCount}</Text>
        </View>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color={colors.muted} />
        <TextInput style={styles.searchInput} placeholder="Buscar rodas, farol, turbo..." value={search} onChangeText={setSearch} />
      </View>

      <View style={styles.categoryBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.chip, category === item && styles.chipActive]}
              onPress={() => setCategory(item)}
            >
              <Ionicons
                name={item === "Todos" ? "apps" : getCategoryIcon(item)}
                size={16}
                color={category === item ? "#fff" : colors.muted}
              />
              <Text style={[styles.chipText, category === item && styles.chipTextActive]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.sortBar}>
        {["Destaques", "Menor preco", "Maior preco", "Nome"].map((item) => (
          <TouchableOpacity
            key={item}
            style={[styles.sortButton, sort === item && styles.sortActive]}
            onPress={() => setSort(item)}
          >
            <Text style={[styles.sortText, sort === item && styles.sortTextActive]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderProduct}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {loadingProducts ? "Carregando pecas..." : "Nenhuma peca cadastrada ainda."}
          </Text>
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
      />

      <Modal visible={!!selectedProduct} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedProduct && (
              <>
                {safeProductImage(selectedProduct.image) ? (
                  <Image source={{ uri: safeProductImage(selectedProduct.image) }} style={styles.modalImage} />
                ) : (
                  <View style={[styles.modalImage, styles.noImage]}>
                    <Ionicons name="image" size={38} color={colors.muted} />
                  </View>
                )}
                <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedProduct(null)}>
                  <Ionicons name="close" size={22} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.modalCategory}>{selectedProduct.category}</Text>
                <Text style={styles.modalTitle}>{selectedProduct.name}</Text>
                <Text style={styles.modalDescription}>{selectedProduct.description}</Text>
                <View style={styles.specs}>
                  <Text style={styles.specText}>Marca: {selectedProduct.brand}</Text>
                  <Text style={styles.specText}>Estoque: {selectedProduct.stock}</Text>
                </View>
                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.modalFavorite} onPress={() => toggleFavorite(selectedProduct.id)}>
                    <Ionicons name={isFavorite(selectedProduct.id) ? "heart" : "heart-outline"} size={22} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalCart}
                    onPress={() => {
                      addToCart(selectedProduct);
                      setSelectedProduct(null);
                    }}
                  >
                    <Text style={styles.modalCartText}>Adicionar ao carrinho</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: 58, paddingHorizontal: 18 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  eyebrow: { color: colors.muted, fontWeight: "700" },
  title: { color: colors.text, fontSize: 27, fontWeight: "900" },
  badge: { flexDirection: "row", gap: 6, alignItems: "center", backgroundColor: colors.surface, borderRadius: 16, padding: 12 },
  badgeText: { color: colors.text, fontWeight: "900" },
  searchBox: { flexDirection: "row", gap: 10, alignItems: "center", backgroundColor: colors.surface, borderRadius: 18, paddingHorizontal: 14, height: 52, borderWidth: 1, borderColor: colors.border },
  searchInput: { flex: 1 },
  categoryBar: { height: 58, marginTop: 14, marginBottom: 12 },
  categoriesContent: { alignItems: "center", paddingRight: 8, paddingVertical: 4 },
  chip: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 16, height: 38, borderRadius: 18, backgroundColor: colors.surface, justifyContent: "center", marginRight: 10, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.dark, borderColor: colors.dark },
  chipText: { color: colors.muted, fontWeight: "800" },
  chipTextActive: { color: "#fff" },
  sortBar: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  sortButton: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 11, paddingVertical: 8 },
  sortActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  sortText: { color: colors.muted, fontSize: 12, fontWeight: "800" },
  sortTextActive: { color: "#fff" },
  list: { paddingBottom: 90 },
  card: { backgroundColor: colors.surface, borderRadius: 8, overflow: "hidden", marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  image: { width: "100%", height: 170, backgroundColor: colors.metal },
  noImage: { justifyContent: "center", alignItems: "center" },
  favoriteButton: { position: "absolute", top: 10, right: 10, width: 42, height: 42, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.94)", justifyContent: "center", alignItems: "center" },
  cardBody: { padding: 14 },
  category: { color: colors.primary, fontWeight: "900", fontSize: 12, textTransform: "uppercase" },
  name: { color: colors.text, fontSize: 20, fontWeight: "900", marginTop: 4 },
  description: { color: colors.muted, marginTop: 6, lineHeight: 20 },
  stock: { color: colors.success, fontWeight: "800", marginTop: 8, fontSize: 12 },
  row: { marginTop: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  price: { color: colors.text, fontSize: 20, fontWeight: "900" },
  cartButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primary, justifyContent: "center", alignItems: "center" },
  cartButtonDisabled: { backgroundColor: colors.metal },
  empty: { color: colors.muted, textAlign: "center", marginTop: 60 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(16,24,32,0.58)", justifyContent: "center", padding: 22 },
  modalContent: { backgroundColor: colors.surface, borderRadius: 8, overflow: "hidden" },
  modalImage: { width: "100%", height: 190, backgroundColor: colors.metal },
  closeButton: { position: "absolute", top: 10, right: 10, width: 40, height: 40, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.95)", justifyContent: "center", alignItems: "center" },
  modalCategory: { color: colors.primary, fontWeight: "900", fontSize: 12, textTransform: "uppercase", marginTop: 16, marginHorizontal: 16 },
  modalTitle: { color: colors.text, fontSize: 24, fontWeight: "900", marginHorizontal: 16, marginTop: 4 },
  modalDescription: { color: colors.muted, lineHeight: 21, marginHorizontal: 16, marginTop: 8 },
  specs: { backgroundColor: colors.background, margin: 16, borderRadius: 8, padding: 12, gap: 6 },
  specText: { color: colors.text, fontWeight: "800" },
  modalActions: { flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingBottom: 16 },
  modalFavorite: { width: 54, height: 54, borderRadius: 16, backgroundColor: colors.background, justifyContent: "center", alignItems: "center" },
  modalCart: { flex: 1, height: 54, borderRadius: 16, backgroundColor: colors.primary, justifyContent: "center", alignItems: "center" },
  modalCartText: { color: "#fff", fontWeight: "900" }
});
