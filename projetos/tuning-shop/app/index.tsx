import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { BrandLogo } from "../src/components/BrandLogo";
import { colors } from "../src/theme/colors";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <ImageBackground
      source={{ uri: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200" }}
      style={styles.hero}
      imageStyle={styles.image}
    >
      <View style={styles.overlay}>
        <View style={styles.brand}>
          <BrandLogo light />
          <Text style={styles.logo}>Seu carro com mais presenca</Text>
          <Text style={styles.subtitle}>Pecas, estilo e performance para montar o carro do seu jeito.</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.push("/(auth)/login")}>
            <Text style={styles.primaryText}>Entrar</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push("/(auth)/register")}>
            <Text style={styles.secondaryText}>Criar conta</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  hero: { flex: 1, backgroundColor: colors.dark },
  image: { opacity: 0.58 },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(16,24,32,0.35)",
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 42,
    justifyContent: "space-between"
  },
  brand: { gap: 14 },
  logo: { color: "#fff", fontSize: 46, fontWeight: "900" },
  subtitle: { color: "#E8EEF4", fontSize: 17, lineHeight: 25, maxWidth: 360 },
  actions: { gap: 14 },
  primaryButton: {
    height: 58,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10
  },
  primaryText: { color: "#fff", fontSize: 18, fontWeight: "800" },
  secondaryButton: {
    height: 56,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center"
  },
  secondaryText: { color: colors.dark, fontSize: 17, fontWeight: "800" }
});
