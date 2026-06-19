import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Image, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useStore } from "../../src/context/StoreContext";
import { colors } from "../../src/theme/colors";
import { safeProductImage } from "../../src/utils/images";

export default function ProductFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { products, saveProduct } = useStore();
  const editing = products.find((item) => item.id === id);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!editing) return;
    setName(editing.name);
    setCategory(editing.category);
    setBrand(editing.brand);
    setPrice(String(editing.price));
    setStock(String(editing.stock));
    setDescription(editing.description);
    setImage(editing.image?.startsWith("blob:") ? "" : editing.image);
  }, [editing]);

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.45,
      base64: true
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      if (asset.base64) {
        const mimeType = asset.mimeType || "image/jpeg";
        setImage(`data:${mimeType};base64,${asset.base64}`);
        return;
      }

      setImage(asset.uri);
    }
  }

  async function handleSave() {
    if (!name || !category || !brand || !price || !stock) {
      setMessage("Preencha nome, categoria, marca, preco e estoque.");
      Alert.alert("Erro", "Preencha nome, categoria, marca, preco e estoque.");
      return;
    }

    const parsedPrice = Number(price.replace(",", "."));
    const parsedStock = Number(stock);

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setMessage("Digite um preco valido. Exemplo: 249.90");
      Alert.alert("Erro", "Digite um preco valido. Exemplo: 249.90");
      return;
    }

    if (!Number.isInteger(parsedStock) || parsedStock < 0) {
      setMessage("Digite um estoque valido. Exemplo: 5");
      Alert.alert("Erro", "Digite um estoque valido. Exemplo: 5");
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      if (image.startsWith("blob:")) {
        setMessage("Selecione a imagem novamente antes de salvar.");
        Alert.alert("Imagem temporaria", "Selecione a imagem novamente antes de salvar.");
        return;
      }

      const finalImage = image || "";

      await saveProduct({
        id: editing?.id,
        name,
        category,
        brand,
        price: parsedPrice,
        stock: parsedStock,
        description,
        image: finalImage
      });

      setMessage(editing ? "Peca atualizada." : "Peca cadastrada.");
      if (Platform.OS !== "web") {
        Alert.alert("Sucesso", editing ? "Peca atualizada." : "Peca cadastrada.");
      }
      router.replace("/products");
    } catch (error: any) {
      setMessage(error?.message || "Nao foi possivel salvar a peca.");
      Alert.alert("Erro", error?.message || "Nao foi possivel salvar a imagem/produto.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={styles.title}>{editing ? "Editar peca" : "Nova peca"}</Text>

      <TouchableOpacity style={styles.imageBox} onPress={pickImage}>
        {image ? <Image source={{ uri: safeProductImage(image) }} style={styles.preview} /> : <Text style={styles.imageText}>Selecionar foto da peca</Text>}
      </TouchableOpacity>

      <View style={styles.form}>
        <TextInput style={styles.input} placeholder="Nome da peca" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Categoria" value={category} onChangeText={setCategory} />
        <TextInput style={styles.input} placeholder="Marca" value={brand} onChangeText={setBrand} />
        <TextInput style={styles.input} placeholder="Preco" value={price} onChangeText={setPrice} keyboardType="numeric" />
        <TextInput style={styles.input} placeholder="Estoque" value={stock} onChangeText={setStock} keyboardType="numeric" />
        <TextInput style={styles.textArea} placeholder="Descricao" value={description} onChangeText={setDescription} multiline />
      </View>

      {!!message && <Text style={styles.message}>{message}</Text>}

      <TouchableOpacity style={[styles.button, saving && styles.buttonDisabled]} onPress={handleSave} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? "Salvando..." : "Salvar peca"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.background, padding: 22, paddingTop: 58, paddingBottom: 110 },
  back: { width: 42, height: 42, justifyContent: "center" },
  title: { color: colors.text, fontSize: 30, fontWeight: "900", marginVertical: 18 },
  imageBox: { height: 170, backgroundColor: colors.surface, borderRadius: 8, borderWidth: 2, borderColor: colors.border, borderStyle: "dashed", justifyContent: "center", alignItems: "center", overflow: "hidden", marginBottom: 16 },
  preview: { width: "100%", height: "100%" },
  imageText: { color: colors.primary, fontWeight: "900" },
  form: { gap: 10 },
  input: { height: 52, backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14 },
  textArea: { minHeight: 90, backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 14, textAlignVertical: "top" },
  message: { color: colors.primary, fontWeight: "900", marginTop: 14, textAlign: "center" },
  button: { height: 56, borderRadius: 16, backgroundColor: colors.primary, justifyContent: "center", alignItems: "center", marginTop: 18 },
  buttonDisabled: { backgroundColor: colors.metal },
  buttonText: { color: "#fff", fontWeight: "900", fontSize: 16 }
});
