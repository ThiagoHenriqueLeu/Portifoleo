import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { BrandLogo } from "../../src/components/BrandLogo";
import { useStore } from "../../src/context/StoreContext";
import { colors } from "../../src/theme/colors";

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cellphone, setCellphone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function maskPhone(value: string) {
    let cleaned = value.replace(/\D/g, "").slice(0, 11);
    if (cleaned.length <= 2) return `(${cleaned}`;
    if (cleaned.length <= 7) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }

  function getPasswordValidationMessage(value: string) {
    if (value.length < 6) return "A senha precisa ter no minimo 6 caracteres.";
    if (!/[A-Z]/.test(value)) return "A senha precisa ter pelo menos uma letra maiuscula.";
    if (!/[a-z]/.test(value)) return "A senha precisa ter pelo menos uma letra minuscula.";
    if (!/[^A-Za-z0-9]/.test(value)) return "A senha precisa ter pelo menos um simbolo.";
    return "";
  }

  function showError(text: string) {
    setMessage(text);
    Alert.alert("Erro", text);
  }

  async function handleRegister() {
    const passwordMessage = getPasswordValidationMessage(password);

    if (!name.includes(" ")) return showError("Digite nome e sobrenome.");
    if (!email.includes("@")) return showError("Digite um e-mail valido.");
    if (cellphone.length < 14) return showError("Digite um telefone completo.");
    if (passwordMessage) return showError(passwordMessage);
    if (password !== confirm) return showError("As senhas nao conferem.");

    try {
      setMessage("");
      await register({ name, email, cellphone, password, role: "user" });
      router.replace("/(user)/store");
    } catch (error: any) {
      showError(error.message || "Nao foi possivel criar a conta.");
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={24} color={colors.text} />
      </TouchableOpacity>

      <BrandLogo compact />
      <Text style={styles.title}>Criar conta</Text>
      <Text style={styles.subtitle}>Conta de cliente para comprar pecas e acompanhar pedidos.</Text>

      <TextInput style={styles.input} placeholder="Nome e sobrenome" value={name} onChangeText={setName} />
      <TextInput
        style={styles.input}
        placeholder="E-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Telefone"
        value={cellphone}
        onChangeText={(text) => setCellphone(maskPhone(text))}
        keyboardType="phone-pad"
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
      <View style={styles.passwordBox}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Confirmar senha"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword((current) => !current)}>
          <Ionicons name={showPassword ? "eye-off" : "eye"} size={22} color={colors.muted} />
        </TouchableOpacity>
      </View>
      <Text style={styles.passwordHint}>
        A senha deve ter maiuscula, minuscula, simbolo e no minimo 6 caracteres.
      </Text>
      {!!message && <Text style={styles.message}>{message}</Text>}

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Cadastrar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.background, padding: 24, paddingTop: 70 },
  back: { width: 42, height: 42, justifyContent: "center", marginBottom: 18 },
  title: { fontSize: 34, color: colors.text, fontWeight: "900", marginTop: 22 },
  subtitle: { color: colors.muted, marginTop: 8, marginBottom: 24 },
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
  passwordHint: { color: colors.muted, fontWeight: "700", marginTop: -2, marginBottom: 10 },
  message: { color: colors.primary, fontWeight: "900", marginBottom: 10, textAlign: "center" },
  button: {
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12
  },
  buttonText: { color: "#fff", fontWeight: "900", fontSize: 17 }
});
