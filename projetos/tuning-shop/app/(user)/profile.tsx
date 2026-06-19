import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useStore } from "../../src/context/StoreContext";
import { colors } from "../../src/theme/colors";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, orders, updateUserProfile } = useStore();
  const userOrders = orders.filter((order) => order.userId === user?.uid);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [cellphone, setCellphone] = useState(user?.cellphone || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setName(user?.name || "");
    setCellphone(user?.cellphone || "");
  }, [user]);

  function maskPhone(value: string) {
    const cleaned = value.replace(/\D/g, "").slice(0, 11);
    if (cleaned.length <= 2) return `(${cleaned}`;
    if (cleaned.length <= 7) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }

  function handleLogout() {
    logout();
    router.replace("/");
  }

  async function handleSaveProfile() {
    if (!name.includes(" ")) {
      setMessage("Digite nome e sobrenome.");
      Alert.alert("Erro", "Digite nome e sobrenome.");
      return;
    }

    if (cellphone.length < 14) {
      setMessage("Digite um telefone completo.");
      Alert.alert("Erro", "Digite um telefone completo.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      await updateUserProfile({ name, cellphone });
      setEditing(false);
      setMessage("Dados atualizados.");
    } catch (error: any) {
      const errorMessage = error.message || "Nao foi possivel atualizar os dados.";
      setMessage(errorMessage);
      Alert.alert("Erro", errorMessage);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.avatar}>
        <Ionicons name="person" size={42} color="#fff" />
      </View>
      <Text style={styles.name}>{user?.name}</Text>
      <Text style={styles.email}>{user?.email}</Text>

      <TouchableOpacity style={[styles.editButton, editing && styles.editButtonCancel]} onPress={() => setEditing((current) => !current)}>
        <Ionicons name={editing ? "close" : "create"} size={18} color={editing ? colors.text : "#fff"} />
        <Text style={[styles.editText, editing && styles.editTextCancel]}>{editing ? "Cancelar edicao" : "Editar dados"}</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <Text style={styles.label}>Nome</Text>
        {editing ? (
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Nome e sobrenome" />
        ) : (
          <Text style={styles.value}>{user?.name}</Text>
        )}
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Telefone</Text>
        {editing ? (
          <TextInput
            style={styles.input}
            value={cellphone}
            onChangeText={(text) => setCellphone(maskPhone(text))}
            keyboardType="phone-pad"
            placeholder="Telefone"
          />
        ) : (
          <Text style={styles.value}>{user?.cellphone}</Text>
        )}
      </View>
      {!!message && <Text style={styles.message}>{message}</Text>}
      {editing && (
        <TouchableOpacity style={[styles.saveButton, saving && styles.saveButtonDisabled]} onPress={handleSaveProfile} disabled={saving}>
          <Text style={styles.saveText}>{saving ? "Salvando..." : "Salvar dados"}</Text>
        </TouchableOpacity>
      )}
      <View style={styles.card}>
        <Text style={styles.label}>Perfil</Text>
        <Text style={styles.value}>Usuario</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Pedidos realizados</Text>
        <Text style={styles.value}>{userOrders.length}</Text>
      </View>

      <TouchableOpacity style={styles.logout} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sair da conta</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.background, alignItems: "center", paddingTop: 70, paddingHorizontal: 22, paddingBottom: 110 },
  avatar: { width: 92, height: 92, borderRadius: 46, backgroundColor: colors.dark, justifyContent: "center", alignItems: "center", marginBottom: 16 },
  name: { color: colors.text, fontSize: 28, fontWeight: "900", textAlign: "center" },
  email: { color: colors.muted, marginTop: 5, marginBottom: 16 },
  editButton: { height: 44, borderRadius: 12, backgroundColor: colors.dark, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", paddingHorizontal: 16, marginBottom: 18 },
  editButtonCancel: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  editText: { color: "#fff", fontWeight: "900" },
  editTextCancel: { color: colors.text },
  card: { width: "100%", backgroundColor: colors.surface, borderRadius: 8, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  label: { color: colors.muted, fontWeight: "700" },
  value: { color: colors.text, fontSize: 18, fontWeight: "900", marginTop: 6 },
  input: { height: 48, color: colors.text, fontSize: 17, fontWeight: "800", marginTop: 6, borderBottomWidth: 1, borderBottomColor: colors.border },
  message: { color: colors.primary, fontWeight: "900", marginBottom: 10, textAlign: "center" },
  saveButton: { width: "100%", height: 50, borderRadius: 14, backgroundColor: colors.dark, justifyContent: "center", alignItems: "center", marginBottom: 12 },
  saveButtonDisabled: { backgroundColor: colors.metal },
  saveText: { color: "#fff", fontWeight: "900", fontSize: 16 },
  logout: { width: "100%", height: 54, borderRadius: 16, backgroundColor: colors.primary, justifyContent: "center", alignItems: "center", marginTop: 18 },
  logoutText: { color: "#fff", fontWeight: "900", fontSize: 16 }
});
