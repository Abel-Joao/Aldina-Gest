import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { dbGet, dbPost } from "../../lib/supabase";
import { colors, spacing, radius, typography } from "../../lib/theme";
import { Plus, Minus, Trash, ShoppingCartSimple, Check } from "phosphor-react-native";

interface Produto {
  id: string;
  nome: string;
  preco: number;
  stock?: number;
  unidade?: string;
}

interface CartItem {
  produto: Produto;
  qty: number;
}

interface Fatura {
  id: string;
  numero: string;
  total: number;
}

function kz(val: number) {
  return new Intl.NumberFormat("pt-AO", { style: "currency", currency: "AOA", minimumFractionDigits: 0 }).format(val || 0);
}

export default function POSScreen() {
  const qc = useQueryClient();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [cliente, setCliente] = useState("");
  const [success, setSuccess] = useState(false);

  const produtos = useQuery({
    queryKey: ["produtos"],
    queryFn: () => dbGet<Produto>("produtos", "order=nome"),
  });

  const faturas = useQuery({
    queryKey: ["faturas"],
    queryFn: () => dbGet<Fatura>("faturas", "select=numero&order=data.desc"),
  });

  function addToCart(p: Produto) {
    setCart((prev) => {
      const exists = prev.find((i) => i.produto.id === p.id);
      if (exists) {
        return prev.map((i) =>
          i.produto.id === p.id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...prev, { produto: p, qty: 1 }];
    });
  }

  function updateQty(id: string, delta: number) {
    setCart((prev) =>
      prev
        .map((i) => (i.produto.id === id ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0)
    );
  }

  function removeItem(id: string) {
    setCart((prev) => prev.filter((i) => i.produto.id !== id));
  }

  const subtotal = cart.reduce((a, i) => a + i.qty * i.produto.preco, 0);
  const iva = subtotal * 0.14;
  const total = subtotal + iva;

  function nextNum() {
    const nums = (faturas.data || [])
      .map((f) => parseInt(f.numero?.replace(/\D/g, "") || "0"))
      .filter((n) => !isNaN(n));
    const max = nums.length ? Math.max(...nums) : 0;
    return `FT-${String(max + 1).padStart(4, "0")}`;
  }

  const vender = useMutation({
    mutationFn: async () => {
      if (!cart.length) throw new Error("Carrinho vazio");
      const itens = cart.map((i) => ({
        produtoId: i.produto.id,
        descricao: i.produto.nome,
        quantidade: i.qty,
        precoUnit: i.produto.preco,
        total: i.qty * i.produto.preco,
      }));
      const payload = {
        numero: nextNum(),
        cliente: cliente || "Cliente Balcão",
        total,
        subtotal,
        iva,
        status: "paga",
        data: new Date().toISOString().slice(0, 10),
        itens,
        origem: "pos",
      };
      return dbPost<Fatura>("faturas", payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["faturas"] });
      setCart([]);
      setCliente("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    },
    onError: (e: any) => Alert.alert("Erro", e.message),
  });

  const filtered = (produtos.data || []).filter((p) =>
    p.nome?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        {/* Left: produtos */}
        <View style={styles.left}>
          <Text style={[typography.h3, { padding: spacing.lg }]}>Produtos</Text>
          <View style={styles.searchWrap}>
            <TextInput
              style={styles.searchInput}
              placeholder="Pesquisar..."
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
            />
          </View>
          {produtos.isLoading ? (
            <ActivityIndicator color={colors.accent} style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(p) => p.id}
              numColumns={2}
              columnWrapperStyle={{ gap: 8 }}
              contentContainerStyle={{ padding: spacing.lg, gap: 8 }}
              renderItem={({ item: p }) => (
                <TouchableOpacity
                  style={styles.prodCard}
                  onPress={() => addToCart(p)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.prodNome} numberOfLines={2}>{p.nome}</Text>
                  <Text style={styles.prodPreco}>{kz(p.preco)}</Text>
                  {p.stock !== undefined && (
                    <Text style={styles.prodStock}>Stock: {p.stock}</Text>
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>Sem produtos</Text>
              }
            />
          )}
        </View>

        {/* Right: cart */}
        <View style={styles.right}>
          <Text style={[typography.h3, { padding: spacing.lg, paddingBottom: spacing.sm }]}>
            Carrinho
          </Text>

          <TextInput
            style={styles.clienteInput}
            placeholder="Nome do cliente (opcional)"
            placeholderTextColor={colors.textMuted}
            value={cliente}
            onChangeText={setCliente}
          />

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {cart.length === 0 && (
              <View style={styles.emptyCart}>
                <ShoppingCartSimple size={32} color={colors.textMuted} />
                <Text style={styles.emptyText}>Carrinho vazio</Text>
              </View>
            )}
            {cart.map((item) => (
              <View key={item.produto.id} style={styles.cartItem}>
                <Text style={styles.cartItemName} numberOfLines={1}>{item.produto.nome}</Text>
                <View style={styles.cartItemRow}>
                  <View style={styles.qtyRow}>
                    <TouchableOpacity onPress={() => updateQty(item.produto.id, -1)} style={styles.qtyBtn}>
                      <Minus size={12} color={colors.textPrimary} weight="bold" />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.qty}</Text>
                    <TouchableOpacity onPress={() => updateQty(item.produto.id, 1)} style={styles.qtyBtn}>
                      <Plus size={12} color={colors.textPrimary} weight="bold" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.cartItemTotal}>{kz(item.qty * item.produto.preco)}</Text>
                  <TouchableOpacity onPress={() => removeItem(item.produto.id)}>
                    <Trash size={14} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Totais */}
          <View style={styles.totais}>
            <View style={styles.totaisRow}>
              <Text style={styles.totaisLabel}>Subtotal</Text>
              <Text style={styles.totaisVal}>{kz(subtotal)}</Text>
            </View>
            <View style={styles.totaisRow}>
              <Text style={styles.totaisLabel}>IVA (14%)</Text>
              <Text style={styles.totaisVal}>{kz(iva)}</Text>
            </View>
            <View style={[styles.totaisRow, styles.totalLine]}>
              <Text style={styles.totalLabel}>TOTAL</Text>
              <Text style={styles.totalVal}>{kz(total)}</Text>
            </View>
          </View>

          {success ? (
            <View style={styles.successBtn}>
              <Check size={20} color={colors.white} weight="bold" />
              <Text style={styles.venderText}>Venda registada!</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.venderBtn, (cart.length === 0 || vender.isPending) && { opacity: 0.5 }]}
              onPress={() => vender.mutate()}
              disabled={cart.length === 0 || vender.isPending}
              activeOpacity={0.8}
            >
              {vender.isPending ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.venderText}>Finalizar Venda</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, flexDirection: "row" },
  left: { flex: 1.2, borderRightWidth: 1, borderRightColor: colors.border },
  right: { flex: 1, padding: 0 },
  searchWrap: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  searchInput: { color: colors.textPrimary, fontSize: 13 },
  prodCard: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 72,
    justifyContent: "space-between",
  },
  prodNome: { ...typography.caption, color: colors.textPrimary, fontWeight: "600", fontSize: 12 },
  prodPreco: { color: colors.accent, fontWeight: "800", fontSize: 13, marginTop: 4 },
  prodStock: { color: colors.textMuted, fontSize: 10, marginTop: 2 },
  clienteInput: {
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 10,
    color: colors.textPrimary,
    fontSize: 13,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyCart: { alignItems: "center", paddingVertical: 30, gap: 8 },
  emptyText: { ...typography.caption, textAlign: "center" },
  cartItem: {
    marginHorizontal: spacing.lg,
    marginBottom: 6,
    backgroundColor: colors.bgCard,
    borderRadius: radius.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cartItemName: { fontSize: 11, color: colors.textPrimary, fontWeight: "600", marginBottom: 4 },
  cartItemRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  qtyBtn: {
    width: 20,
    height: 20,
    backgroundColor: colors.bgElevated,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  qtyText: { fontSize: 12, color: colors.textPrimary, fontWeight: "700", minWidth: 16, textAlign: "center" },
  cartItemTotal: { fontSize: 11, color: colors.textPrimary, fontWeight: "700" },
  totais: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: 4,
  },
  totaisRow: { flexDirection: "row", justifyContent: "space-between" },
  totaisLabel: { ...typography.caption },
  totaisVal: { ...typography.caption, color: colors.textPrimary },
  totalLine: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 6,
    marginTop: 4,
  },
  totalLabel: { fontSize: 12, fontWeight: "700", color: colors.textPrimary },
  totalVal: { fontSize: 14, fontWeight: "800", color: colors.accent },
  venderBtn: {
    backgroundColor: colors.success,
    margin: spacing.lg,
    marginTop: 0,
    borderRadius: radius.md,
    padding: 13,
    alignItems: "center",
  },
  successBtn: {
    backgroundColor: colors.success,
    margin: spacing.lg,
    marginTop: 0,
    borderRadius: radius.md,
    padding: 13,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  venderText: { color: colors.white, fontWeight: "700", fontSize: 14 },
});
