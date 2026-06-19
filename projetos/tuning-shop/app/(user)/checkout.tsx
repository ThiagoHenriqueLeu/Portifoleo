import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { get, ref } from "firebase/database";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useStore } from "../../src/context/StoreContext";
import { database } from "../../src/services/firebase";
import { localApi } from "../../src/services/localApi";
import { colors } from "../../src/theme/colors";
import { Coupon } from "../../src/types";

export default function CheckoutScreen() {
  const router = useRouter();
  const { cartTotal, cart, closeOrder } = useStore();
  const [address, setAddress] = useState("");
  const [cep, setCep] = useState("");
  const [payment, setPayment] = useState("Pix");
  const [coupon, setCoupon] = useState("");
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const shipping = calculateShippingByCep(cep, cart.length);
  const normalizedCoupon = coupon.trim().toUpperCase();
  const selectedCoupon = coupons.find((item) => item.active && item.code.toUpperCase() === normalizedCoupon);
  const isCouponValid = !!selectedCoupon;
  const discount = selectedCoupon ? cartTotal * (selectedCoupon.discountPercent / 100) : 0;
  const total = Math.max(0, cartTotal - discount + shipping);

  useEffect(() => {
    loadCoupons().catch(() => {});
  }, []);

  async function loadCoupons() {
    try {
      setCoupons(await localApi.getCoupons());
      return;
    } catch {}

    const snapshot = await get(ref(database, "coupons"));
    if (snapshot.exists()) {
      setCoupons(Object.values(snapshot.val()) as Coupon[]);
    }
  }

  async function handleCloseOrder() {
    if (!address.trim()) {
      Alert.alert("Erro", "Informe o endereco de entrega.");
      return;
    }

    if (!isValidCep(cep)) {
      Alert.alert("Erro", "Informe um CEP valido com 8 digitos.");
      return;
    }

    try {
      const deliveryAddress = `${address.trim()} - CEP ${formatCep(cep)}`;
      const order = await closeOrder(deliveryAddress, payment, shipping, discount, isCouponValid ? normalizedCoupon : "");
      Alert.alert("Pedido criado", `Compra ${order.id} finalizada com sucesso.`);
      router.replace("/(user)/orders");
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Nao foi possivel fechar a compra.");
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Finalizar compra</Text>
      <Text style={styles.label}>Endereco de entrega</Text>
      <TextInput
        style={styles.textArea}
        placeholder="Rua, numero, bairro, cidade"
        value={address}
        onChangeText={setAddress}
        multiline
      />

      <Text style={styles.label}>CEP</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: 15700-000"
        value={formatCep(cep)}
        onChangeText={setCep}
        keyboardType="numeric"
        maxLength={9}
      />
      <Text style={styles.shippingHint}>
        Frete calculado pela distancia estimada de Jales-SP.
      </Text>

      <Text style={styles.label}>Pagamento</Text>
      <View style={styles.payments}>
        {["Pix", "Cartao", "Dinheiro"].map((item) => (
          <TouchableOpacity key={item} style={[styles.payButton, payment === item && styles.payActive]} onPress={() => setPayment(item)}>
            <Text style={[styles.payText, payment === item && styles.payTextActive]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Cupom</Text>
      <View style={styles.couponRow}>
        <TextInput
          style={styles.couponInput}
          placeholder="Digite TURBO10"
          value={coupon}
          onChangeText={setCoupon}
          autoCapitalize="characters"
        />
        {isCouponValid && (
          <View style={styles.couponBadge}>
            <Text style={styles.couponBadgeText}>{selectedCoupon.discountPercent}% OFF</Text>
          </View>
        )}
      </View>
      {!!normalizedCoupon && !isCouponValid && (
        <Text style={styles.couponError}>Cupom invalido.</Text>
      )}

      <View style={styles.summary}>
        <View style={styles.line}>
          <Text style={styles.muted}>Produtos</Text>
          <Text style={styles.value}>R$ {cartTotal.toFixed(2)}</Text>
        </View>
        <View style={styles.line}>
          <Text style={styles.muted}>Frete</Text>
          <Text style={styles.value}>{shipping === 0 ? "Gratis" : `R$ ${shipping.toFixed(2)}`}</Text>
        </View>
        {isCouponValid && (
          <View style={styles.line}>
            <Text style={styles.muted}>Desconto {selectedCoupon.code}</Text>
            <Text style={styles.discountValue}>- R$ {discount.toFixed(2)}</Text>
          </View>
        )}
        <View style={styles.total}>
          <Text style={styles.totalText}>Total</Text>
          <Text style={styles.totalText}>R$ {total.toFixed(2)}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleCloseOrder}>
        <Text style={styles.buttonText}>Confirmar pedido</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.background, padding: 22, paddingTop: 62 },
  title: { color: colors.text, fontSize: 30, fontWeight: "900", marginBottom: 26 },
  label: { color: colors.text, fontWeight: "900", marginBottom: 8 },
  input: { height: 50, backgroundColor: colors.surface, borderRadius: 8, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.border, marginBottom: 8 },
  textArea: { minHeight: 100, backgroundColor: colors.surface, borderRadius: 8, padding: 14, textAlignVertical: "top", borderWidth: 1, borderColor: colors.border, marginBottom: 18 },
  shippingHint: { color: colors.muted, marginBottom: 18 },
  payments: { flexDirection: "row", gap: 10, marginBottom: 18 },
  payButton: { flex: 1, height: 48, borderRadius: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, justifyContent: "center", alignItems: "center" },
  payActive: { backgroundColor: colors.dark, borderColor: colors.dark },
  payText: { color: colors.muted, fontWeight: "800" },
  payTextActive: { color: "#fff" },
  couponRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  couponInput: { flex: 1, height: 50, backgroundColor: colors.surface, borderRadius: 8, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.border },
  couponBadge: { height: 50, borderRadius: 8, backgroundColor: colors.dark, paddingHorizontal: 14, justifyContent: "center", alignItems: "center" },
  couponBadgeText: { color: colors.accent, fontWeight: "900" },
  couponError: { color: colors.primary, fontWeight: "800", marginBottom: 12 },
  summary: { backgroundColor: colors.surface, borderRadius: 8, padding: 16, borderWidth: 1, borderColor: colors.border },
  line: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  muted: { color: colors.muted },
  value: { color: colors.text, fontWeight: "800" },
  discountValue: { color: colors.primary, fontWeight: "900" },
  total: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, marginTop: 4, flexDirection: "row", justifyContent: "space-between" },
  totalText: { color: colors.text, fontSize: 20, fontWeight: "900" },
  button: { height: 56, borderRadius: 16, backgroundColor: colors.primary, justifyContent: "center", alignItems: "center", marginTop: 18 },
  buttonText: { color: "#fff", fontWeight: "900", fontSize: 16 }
});

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function formatCep(value: string) {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function isValidCep(value: string) {
  return onlyDigits(value).length === 8;
}

function calculateShippingByCep(value: string, cartLength: number) {
  if (cartLength === 0) return 0;

  const digits = onlyDigits(value);
  if (digits.length < 5) return 5;

  const jalesCepPrefix = 15700;
  const cepPrefix = Number(digits.slice(0, 5));
  const distanceFactor = Math.abs(cepPrefix - jalesCepPrefix);
  const shipping = 5 + Math.round(Math.min(distanceFactor / 1200, 1) * 95);

  return Math.min(100, Math.max(5, shipping));
}
