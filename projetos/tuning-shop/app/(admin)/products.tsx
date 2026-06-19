import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { Alert, FlatList, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useState } from "react";
import { useStore } from "../../src/context/StoreContext";
import { colors } from "../../src/theme/colors";
import { getCategoryIcon } from "../../src/utils/categories";
import { safeProductImage } from "../../src/utils/images";

export default function AdminProductsScreen() {
  const { products, deleteProduct, loadingProducts } = useStore();
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("Todos");

  const filteredProducts = products.filter((item) => {
    const query = search.toLowerCase();
    const matchesSearch = `${item.name} ${item.brand} ${item.category}`.toLowerCase().includes(query);
    const matchesStock =
      stockFilter === "Todos" ||
      (stockFilter === "Baixo" && item.stock <= 6) ||
      (stockFilter === "Zerado" && item.stock === 0);

    return matchesSearch && matchesStock;
  });

  function confirmDelete(productId: string, productName: string) {
    Alert.alert("Excluir peca", `Deseja excluir ${productName}?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteProduct(productId);
          } catch (error: any) {
            Alert.alert("Erro", error?.message || "Nao foi possivel excluir a peca na API local.");
          }
        }
      }
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pecas</Text>
        <Link href="/product-form" asChild>
          <TouchableOpacity style={styles.add} accessibilityRole="button" accessibilityLabel="Adicionar peca">
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </Link>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color={colors.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nome, marca ou categoria"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filters}
      >
        {["Todos", "Baixo", "Zerado"].map((item) => (
          <TouchableOpacity
            key={item}
            style={[styles.filterButton, stockFilter === item && styles.filterActive]}
            onPress={() => setStockFilter(item)}
          >
            <Text style={[styles.filterText, stockFilter === item && styles.filterTextActive]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        style={styles.productList}
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {loadingProducts ? "Carregando pecas..." : "Nenhuma peca encontrada."}
          </Text>
        }
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {safeProductImage(item.image) ? (
              <Image source={{ uri: safeProductImage(item.image) }} style={styles.image} />
            ) : (
              <View style={[styles.image, styles.noImage]}>
                <Ionicons name="image" size={22} color={colors.muted} />
              </View>
            )}
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <View style={styles.metaRow}>
                <Ionicons name={getCategoryIcon(item.category)} size={14} color={colors.muted} />
                <Text style={styles.meta}>{item.brand} - {item.category}</Text>
              </View>
              <Text style={styles.price}>R$ {item.price.toFixed(2)} - Estoque {item.stock}</Text>
            </View>
            <View style={styles.actions}>
              <Link href={{ pathname: "/product-form", params: { id: item.id } }} asChild>
                <TouchableOpacity style={styles.iconButton} accessibilityRole="button" accessibilityLabel={`Editar ${item.name}`}>
                  <Ionicons name="pencil" size={18} color={colors.text} />
                </TouchableOpacity>
              </Link>
              <TouchableOpacity style={styles.deleteButton} onPress={() => confirmDelete(item.id, item.name)}>
                <Ionicons name="trash" size={18} color={colors.danger} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: 60, paddingHorizontal: 18 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  title: { color: colors.text, fontSize: 30, fontWeight: "900" },
  add: { width: 46, height: 46, borderRadius: 14, backgroundColor: colors.primary, justifyContent: "center", alignItems: "center" },
  searchBox: { flexDirection: "row", gap: 10, alignItems: "center", backgroundColor: colors.surface, borderRadius: 16, paddingHorizontal: 14, height: 50, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
  searchInput: { flex: 1 },
  filterBar: { height: 46, maxHeight: 46, flexGrow: 0, flexShrink: 0, marginBottom: 14 },
  filters: { gap: 8, alignItems: "center" },
  filterButton: { height: 38, borderRadius: 14, paddingHorizontal: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, justifyContent: "center" },
  filterActive: { backgroundColor: colors.dark, borderColor: colors.dark },
  filterText: { color: colors.muted, fontWeight: "800" },
  filterTextActive: { color: "#fff" },
  productList: { flexGrow: 0, flexShrink: 1 },
  list: { paddingBottom: 90, paddingTop: 0, flexGrow: 0 },
  empty: { color: colors.muted, textAlign: "center", marginTop: 60 },
  card: { flexDirection: "row", backgroundColor: colors.surface, borderRadius: 8, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  image: { width: 76, height: 76, borderRadius: 8, backgroundColor: colors.metal },
  noImage: { justifyContent: "center", alignItems: "center" },
  info: { flex: 1, marginLeft: 12 },
  name: { color: colors.text, fontSize: 16, fontWeight: "900" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 5 },
  meta: { color: colors.muted },
  price: { color: colors.primary, fontWeight: "900", marginTop: 6 },
  actions: { justifyContent: "space-between" },
  iconButton: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.background, justifyContent: "center", alignItems: "center" },
  deleteButton: { width: 34, height: 34, borderRadius: 10, backgroundColor: "#FEE4E2", justifyContent: "center", alignItems: "center" }
});
