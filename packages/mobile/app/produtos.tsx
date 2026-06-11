import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useRouter } from "expo-router";
import { dbGet, dbPost, dbDelete } from "../lib/supabase";
import { colors, spacing, radius, typography } from "../lib/theme";
import { Plus, MagnifyingGlass, X, Package, ArrowLeft, Trash } from "phosphor-react-native";

interface Produto {
  id: string;
  nome: string;
  preco: number;
  custo?: number;
  stock?: number;
  stockMinimo?: number;
  unidade?: string;
  categoria?: string;
  descricao?: string;
  ativo?: boolean;
}

function kz(val: number) {
  return new Intl.NumberFormat("pt-AO", { style: "currency", currency: "AOA", minimumFractionDigits: 0 }).format(val || 0);
}

export default function ProdutosScreen() {
  const qc = useQueryClient();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [custo, setCusto] = useState("");
  const [stock, setStock] = useState("0");
  const [stockMin, setStockMin] = useState("0");
  const [unidade, setUnidade] = useState("un");
  const [categoria, setCategoria] = useState("");

  const produtos = useQuery({
    queryKey: ["produtos"],
    queryFn: () => dbGet<Produto>("produtos", "order=nome"),
  });

  async function onRefresh() {
    setRefreshing(true);
    await produtos.refetch();
    setRefreshing(false);
  }

  const create = useMutation({
    mutationFn: async () => {
      if (!nome.trim()) throw new Error("Nome obrigatório");
      if (!preco.trim() || isNaN(parseFloat(preco))) throw new Error("Preço inválido");
      return dbPost<Produto>("produtos", {
        nome,
        preco: parseFloat(preco),
        custo: custo ? parseFloat(custo) : null,
        stock: parseInt(stock) || 0,
        stockMinimo: parseInt(stockMin) || 0,
        unidade,
        categoria,
        ativo: true,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["produtos"] });
      resetForm();
      setShowModal(false);
    },
    onError: (e: any) => Alert.alert("Erro", e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => dbDelete("produtos", `id=eq.${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["produtos"] }),
    onError: (e: any) => Alert.alert("Erro", e.message),
  });

  function resetForm() {
    setNome(""); setPreco(""); setCusto(""); setStock("0"); setStockMin("0"); setUnidade("un"); setCategoria("");
  }

  const filtered = (produtos.data || []).filter((p) =>
    p.nome?.toLowerCase().includes(search.toLowerCase()) ||
    p.categoria?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={typography.h2}>Produtos</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)} activeOpacity={0.8}>
          <Plus size={20} color={colors.white} weight="bold" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <MagnifyingGlass size={16} color={colors.textMuted} />
        <TextInput style={styles.searchInput} placeholder="Pesquisar produtos..." placeholderTextColor={colors.textMuted} value={search} onChangeText={setSearch} />
      </View>

      {produtos.isLoading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} />}
        >
          {filtered.length === 0 && (
            <View style={styles.empty}>
              <Package size={40} color={colors.textMuted} />
              <Text style={styles.emptyText}>Sem produtos</Text>
            </View>
          )}
          {filtered.map((p) => (
            <View key={p.id} style={styles.card}>
              <View style={styles.cardLeft}>
                <View style={styles.icon}><Package size={18} color={colors.accent} weight="fill" /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName}>{p.nome}</Text>
                  {p.categoria ? <Text style={styles.cardMeta}>{p.categoria}</Text> : null}
                  <Text style={styles.cardMeta}>{p.unidade || "un"} · Stock: {p.stock ?? "—"}</Text>
                </View>
              </View>
              <View style={{ alignItems: "flex-end", gap: 4 }}>
                <Text style={styles.cardPreco}>{kz(p.preco)}</Text>
                {p.stockMinimo !== undefined && p.stock !== undefined && p.stock <= p.stockMinimo && (
                  <View style={styles.alertBadge}><Text style={styles.alertText}>Baixo</Text></View>
                )}
                <TouchableOpacity onPress={() =>
                  Alert.alert("Eliminar produto?", p.nome, [
                    { text: "Cancelar", style: "cancel" },
                    { text: "Eliminar", style: "destructive", onPress: () => remove.mutate(p.id) },
                  ])
                }>
                  <Trash size={15} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalSafe} edges={["top", "left", "right"]}>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <View style={styles.modalHeader}>
              <Text style={typography.h3}>Novo Produto</Text>
              <TouchableOpacity onPress={() => { setShowModal(false); resetForm(); }}>
                <X size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: spacing.xl }}>
              {[
                { label: "Nome *", val: nome, set: setNome, ph: "Nome do produto" },
                { label: "Preço de Venda (Kz) *", val: preco, set: setPreco, ph: "0", kb: "numeric" as const },
                { label: "Custo (Kz)", val: custo, set: setCusto, ph: "0", kb: "numeric" as const },
                { label: "Stock Inicial", val: stock, set: setStock, ph: "0", kb: "numeric" as const },
                { label: "Stock Mínimo", val: stockMin, set: setStockMin, ph: "0", kb: "numeric" as const },
                { label: "Unidade", val: unidade, set: setUnidade, ph: "un / kg / l" },
                { label: "Categoria", val: categoria, set: setCategoria, ph: "Ex: Alimentação" },
              ].map(({ label, val, set, ph, kb }) => (
                <View key={label}>
                  <Text style={styles.fl}>{label}</Text>
                  <TextInput style={styles.input} placeholder={ph} placeholderTextColor={colors.textMuted} value={val} onChangeText={set} keyboardType={kb} />
                </View>
              ))}
              <TouchableOpacity
                style={[styles.submitBtn, create.isPending && { opacity: 0.6 }]}
                onPress={() => create.mutate()}
                disabled={create.isPending}
                activeOpacity={0.8}
              >
                {create.isPending ? <ActivityIndicator color={colors.white} /> : <Text style={styles.submitBtnText}>Criar Produto</Text>}
              </TouchableOpacity>
              <View style={{ height: 40 }} />
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: "row", alignItems: "center", padding: spacing.xl, gap: 12 },
  backBtn: { padding: 4 },
  addBtn: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center", marginLeft: "auto" },
  searchWrap: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: spacing.xl, marginBottom: spacing.lg, backgroundColor: colors.bgCard, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput: { flex: 1, color: colors.textPrimary, fontSize: 14 },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: colors.bgCard, borderRadius: radius.lg, marginHorizontal: spacing.xl, marginBottom: spacing.sm, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  cardLeft: { flex: 1, flexDirection: "row", gap: 12, alignItems: "center" },
  icon: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.accentDim, alignItems: "center", justifyContent: "center" },
  cardName: { ...typography.body, fontWeight: "600" },
  cardMeta: { ...typography.caption, marginTop: 2 },
  cardPreco: { color: colors.accent, fontWeight: "800", fontSize: 15 },
  alertBadge: { backgroundColor: colors.warningDim, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: colors.warning },
  alertText: { fontSize: 10, color: colors.warning, fontWeight: "600" },
  empty: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyText: { ...typography.caption },
  modalSafe: { flex: 1, backgroundColor: colors.bg },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.border },
  fl: { ...typography.label, marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 11, color: colors.textPrimary, fontSize: 14 },
  submitBtn: { backgroundColor: colors.accent, borderRadius: radius.md, padding: 14, alignItems: "center", marginTop: 24 },
  submitBtnText: { color: colors.white, fontWeight: "700", fontSize: 16 },
});
