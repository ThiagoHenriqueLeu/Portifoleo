import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

type BrandLogoProps = {
  light?: boolean;
  compact?: boolean;
};

export function BrandLogo({ light = false, compact = false }: BrandLogoProps) {
  return (
    <View style={styles.container}>
      <View style={[styles.mark, compact && styles.markCompact]}>
        <Ionicons name="speedometer" size={compact ? 24 : 34} color={colors.accent} />
      </View>
      <View>
        <Text style={[styles.name, compact && styles.nameCompact, light && styles.lightText]}>
          TurboParts
        </Text>
        {!compact && (
          <Text style={[styles.tagline, light && styles.lightMuted]}>
            pecas de performance
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "center", gap: 12 },
  mark: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: colors.dark,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.primary
  },
  markCompact: { width: 44, height: 44, borderRadius: 14 },
  name: { color: colors.text, fontSize: 30, fontWeight: "900" },
  nameCompact: { fontSize: 22 },
  tagline: { color: colors.muted, fontWeight: "800", marginTop: -2 },
  lightText: { color: "#fff" },
  lightMuted: { color: "#DDE3EA" }
});
