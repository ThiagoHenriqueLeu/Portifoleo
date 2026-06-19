import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { BrandLogo } from "../../src/components/BrandLogo";
import { useStore } from "../../src/context/StoreContext";
import { colors } from "../../src/theme/colors";
import { UserRole } from "../../src/types";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useStore();
  const [email, setEmail] = useState("cliente@tuning.com");
  const [password, setPassword] = useState("Cliente123!");
  const [role, setRole] = useState<UserRole>("user");
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert("Erro", "Preencha e-mail e senha.");
      return;
    }

    try {
      await login(email, password, role);
      router.replace(role === "admin" ? "/(admin)/dashboard" : "/(user)/store");
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Nao foi possivel entrar.");
    }
  }

  function fillDemo(nextRole: UserRole) {
    setRole(nextRole);
    setEmail(nextRole === "admin" ? "admin@tuning.com" : "cliente@tuning.com");
    setPassword(nextRole === "admin" ? "Admin123!" : "Cliente123!");
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => router.replace("/")}>
        <Ionicons name="chevron-back" size={24} color={colors.text} />
      </TouchableOpacity>

      <BrandLogo />
      <Text style={styles.title}>Acessar loja</Text>
      <Text style={styles.subtitle}>Escolha o perfil para entrar no ambiente correto.</Text>

      <View style={styles.segment}>
        <TouchableOpacity
          style={[styles.segmentButton, role === "user" && styles.segmentActive]}
          onPress={() => fillDemo("user")}
        >
          <Text style={[styles.segmentText, role === "user" && styles.segmentTextActive]}>Usuario</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentButton, role === "admin" && styles.segmentActive]}
          onPress={() => fillDemo("admin")}
        >
          <Text style={[styles.segmentText, role === "admin" && styles.segmentTextActive]}>Admin</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="E-mail"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <View style={styles.passwordBox}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Senha"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword((current) => !current)}>
          <Ionicons name={showPassword ? "eye-off" : "eye"} size={22} color={colors.muted} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Entrar</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
        <Text style={styles.link}>Criar uma conta de usuario</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 24, paddingTop: 70 },
  back: { width: 42, height: 42, justifyContent: "center" },
  title: { fontSize: 34, color: colors.text, fontWeight: "900", marginTop: 20 },
  subtitle: { fontSize: 15, color: colors.muted, marginTop: 8, marginBottom: 28 },
  segment: { flexDirection: "row", backgroundColor: colors.surface, borderRadius: 16, padding: 5, marginBottom: 18 },
  segmentButton: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  segmentActive: { backgroundColor: colors.dark },
  segmentText: { color: colors.muted, fontWeight: "800" },
  segmentTextActive: { color: "#fff" },
  input: {
    height: 54,
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border
  },
  passwordBox: {
    height: 54,
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingLeft: 16,
    paddingRight: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center"
  },
  passwordInput: { flex: 1, height: "100%" },
  eyeButton: { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  button: {
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10
  },
  buttonText: { color: "#fff", fontSize: 17, fontWeight: "900" },
  link: { color: colors.primary, textAlign: "center", marginTop: 22, fontWeight: "800" }
});
