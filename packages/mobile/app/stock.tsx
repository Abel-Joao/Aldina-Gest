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
import { dbGet, dbPost } from "../lib/supabase";
import { colors, spacing, radius, typography } from "../lib/theme";
import { Plus, ArrowLeft, X, ArrowUp, ArrowDown, Warning } from "phosphor-react-native";

interface Produto {
  id: string;
  nome: string;
  stock?: number;
  stockMinimo?: number;
  unidade?: string;
}

interface Movimento {
  id: string;
  produtoId: string;
  produtoNome: string;
  tipo: string;
  qty: number;
  custoUnit?: number;
  stkAntes?: number;
  stkDepois?: number;
  ref?: string;
  data: string;
}

function kz(val: number) {
  return new Intl.NumberFormat("pt-AO", { style: "currency", currency: "AOA", minimumFractionDigits: 0 }).format(val || 0);
}

export default function StockScreen() {
  const qc = useQueryClient();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"produtos" | "movimentos">("produtos");

  const [produtoId, setProdutoId] = useState("");
  const [tipo, setTipo] = useState<"entrada" | "saida" | "ajuste">("entrada");
  const [qty, setQty] = useState("1");
  const [custo, setCusto] = useState("");
  const [ref, setRef] = useState("");

  const produtos = useQuery({
    queryKey: ["produtos"],
    queryFn: () => dbGet<Produto>("produtos", "order=nome"),
  });

  const movimentos = useQuery({
    queryKey: ["stock_movimentos"],
    queryFn: () => dbGet<Movimento>("stock_movimentos", "order=data.desc&limit=50"),
  });

  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([produtos.refetch(), movimentos.refetch()]);
    setRefreshing(false);
  }

  const addMovimento = useMutation({
    mutationFn: async () => {
      if (!produtoId) throw new Error("Seleccione um produto");
      const qtyNum = parseInt(qty);
      if (!qtyNum || qtyNum <= 0) throw new Error("Quantidade inválida");
      const prod = produtos.data?.find((p) => p.id === produtoId);
      if (!prod) throw new Error("Produto não encontrado");
      const stkAntes = prod.stock || 0;
      let stkDepois = stkAntes;
      if (tipo === "entrada") stkDepois = stkAntes + qtyNum;
      else if (tipo === "saida") stkDepois = Math.max(0, stkAntes - qtyNum);
      else stkDepois = qtyNum;

      await dbPost("stock_movimentos", {
        produtoId,
        produtoNome: prod.nome,
        tipo,
        qty: qtyNum,
        custoUnit: custo ? parseFloat(custo) : null,
        stkAntes,
        stkDepois,
        ref,
        data: new Date().toISOString().slice(0, 10),
      });

      // Actualizar stock do produto via REST directo
      const res = await fetch(
        `https://aldinap-76zid5k-preview-4200.runable.site/api/sb/rest/v1/produtos?id=eq.${produtoId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Prefer: "return=representation" },
          body: JSON.stringify({ stock: stkDepois }),
        }
      );
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["produtos"] });
      qc.invalidateQueries({ queryKey: ["stock_movimentos"] });
      resetForm();
      setShowModal(false);
    },
    onError: (e: any) => Alert.alert("Erro", e.message),
  });

  function resetForm() {
    setProdutoId(""); setTipo("entrada"); setQty("1"); setCusto(""); setRef("");
  }

  const lowStock = (produtos.data || []).filter(
    (p) => p.stockMinimo !== undefined && (p.stock || 0) <= (p.stockMinimo || 0)
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={typography.h2}>Stock</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)} activeOpacity={0.8}>
          <Plus size={20} color={colors.white} weight="bold" />
        </TouchableOpacity>
      </View>

      {lowStock.length > 0 && (
        <View style={styles.alertBanner}>
          <Warning size={16} color={colors.warning} weight="fill" />
          <Text style={styles.alertText}>{lowStock.length} produto(s) com stock abaixo do mínimo</Text>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabs}>
        {(["produtos", "movimentos"] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, activeTab === t && styles.tabActive]}
            onPress={() => setActiveTab(t)}
          >
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
              {t === "produtos" ? "Produtos" : "Movimentos"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === "produtos" ? (
        <ScrollView showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} />}
        >
          {(produtos.data || []).map((p) => {
            const low = p.stockMinimo !== undefined && (p.stock || 0) <= (p.stockMinimo || 0);
            return (
              <View key={p.id} style={[styles.card, low && styles.cardWarn]}>
                <Text style={styles.cardName}>{p.nome}</Text>
                <View style={styles.cardRight}>
                  <Text style={[styles.cardStock, low && { color: colors.warning }]}>
                    {p.stock ?? 0} {p.unidade || "un"}
                  </Text>
                  {p.stockMinimo !== undefined && (
                    <Text style={styles.cardMin}>mín. {p.stockMinimo}</Text>
                  )}
                  {low && <Warning size={14} color={colors.warning} weight="fill" />}
                </View>
              </View>
            );
          })}
          <View style={{ height: 32 }} />
        </ScrollView>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} />}
        >
          {(movimentos.data || []).map((m) => (
            <View key={m.id} style={styles.movCard}>
              <View style={[styles.movIcon, m.tipo === "entrada" ? styles.movIconIn : styles.movIconOut]}>
                {m.tipo === "entrada" ? (
                  <ArrowUp size={14} color={colors.success} weight="bold" />
                ) : (
                  <ArrowDown size={14} color={colors.danger} weight="bold" />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.movNome}>{m.produtoNome}</Text>
                <Text style={styles.movMeta}>{m.data} · {m.ref || m.tipo}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={[styles.movQty, m.tipo === "entrada" ? { color: colors.success } : { color: colors.danger }]}>
                  {m.tipo === "entrada" ? "+" : "-"}{m.qty}
                </Text>
                <Text style={styles.movStk}>{m.stkAntes} → {m.stkDepois}</Text>
              </View>
            </View>
          ))}
          {!movimentos.data?.length && (
            <View style={styles.empty}><Text style={styles.emptyText}>Sem movimentos</Text></View>
          )}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalSafe} edges={["top", "left", "right"]}>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <View style={styles.modalHeader}>
              <Text style={typography.h3}>Movimento de Stock</Text>
              <TouchableOpacity onPress={() => { setShowModal(false); resetForm(); }}>
                <X size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: spacing.xl }}>
              <Text style={styles.fl}>Tipo</Text>
              <View style={styles.tipoRow}>
                {(["entrada", "saida", "ajuste"] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.tipoChip, tipo === t && styles.tipoChipActive]}
                    onPress={() => setTipo(t)}
                  >
                    <Text style={[styles.tipoText, tipo === t && styles.tipoTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fl}>Produto</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
                {(produtos.data || []).map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.prodChip, produtoId === p.id && styles.prodChipActive]}
                    onPress={() => setProdutoId(p.id)}
                  >
                    <Text style={[styles.prodChipText, produtoId === p.id && styles.prodChipTextActive]}>{p.nome}</Text>
                    <Text style={styles.prodChipStock}> ({p.stock ?? 0})</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.fl}>Quantidade</Text>
              <TextInput style={styles.input} placeholder="1" placeholderTextColor={colors.textMuted} value={qty} onChangeText={setQty} keyboardType="numeric" />

              <Text style={styles.fl}>Custo Unitário (Kz)</Text>
              <TextInput style={styles.input} placeholder="0" placeholderTextColor={colors.textMuted} value={custo} onChangeText={setCusto} keyboardType="numeric" />

              <Text style={styles.fl}>Referência</Text>
              <TextInput style={styles.input} placeholder="Nº guia, nota, etc." placeholderTextColor={colors.textMuted} value={ref} onChangeText={setRef} />

              <TouchableOpacity
                style={[styles.submitBtn, addMovimento.isPending && { opacity: 0.6 }]}
                onPress={() => addMovimento.mutate()}
                disabled={addMovimento.isPending}
                activeOpacity={0.8}
              >
                {addMovimento.isPending ? <ActivityIndicator color={colors.white} /> : <Text style={styles.submitBtnText}>Registar Movimento</Text>}
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
  alertBanner: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: spacing.xl, marginBottom: spacing.sm, backgroundColor: colors.warningDim, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.warning },
  alertText: { color: colors.warning, fontSize: 12, fontWeight: "500" },
  tabs: { flexDirection: "row", marginHorizontal: spacing.xl, marginBottom: spacing.lg, backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: 4, borderWidth: 1, borderColor: colors.border },
  tab: { flex: 1, paddingVertical: 8, borderRadius: radius.md, alignItems: "center" },
  tabActive: { backgroundColor: colors.accent },
  tabText: { fontSize: 13, fontWeight: "600", color: colors.textMuted },
  tabTextActive: { color: colors.white },
  card: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: colors.bgCard, borderRadius: radius.md, marginHorizontal: spacing.xl, marginBottom: spacing.sm, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  cardWarn: { borderColor: colors.warning, backgroundColor: colors.warningDim },
  cardName: { ...typography.body, fontWeight: "600", flex: 1 },
  cardRight: { alignItems: "flex-end", gap: 2 },
  cardStock: { fontWeight: "800", fontSize: 16, color: colors.textPrimary },
  cardMin: { ...typography.caption, color: colors.textMuted },
  movCard: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.bgCard, borderRadius: radius.md, marginHorizontal: spacing.xl, marginBottom: spacing.sm, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  movIcon: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  movIconIn: { backgroundColor: colors.successDim, borderWidth: 1, borderColor: colors.success },
  movIconOut: { backgroundColor: colors.dangerDim, borderWidth: 1, borderColor: colors.danger },
  movNome: { ...typography.body, fontWeight: "600" },
  movMeta: { ...typography.caption, marginTop: 2 },
  movQty: { fontWeight: "700", fontSize: 14 },
  movStk: { ...typography.caption, color: colors.textMuted },
  empty: { alignItems: "center", paddingVertical: 40, gap: 12 },
  emptyText: { ...typography.caption },
  modalSafe: { flex: 1, backgroundColor: colors.bg },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.border },
  fl: { ...typography.label, marginBottom: 6, marginTop: 14 },
  tipoRow: { flexDirection: "row", gap: 8, marginBottom: 4 },
  tipoChip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.full, paddingHorizontal: 14, paddingVertical: 5, backgroundColor: colors.bgElevated },
  tipoChipActive: { borderColor: colors.accent, backgroundColor: colors.accentDim },
  tipoText: { fontSize: 12, color: colors.textSecondary, fontWeight: "600" },
  tipoTextActive: { color: colors.accent },
  prodChip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 5, backgroundColor: colors.bgElevated, marginRight: 6 },
  prodChipActive: { borderColor: colors.accent, backgroundColor: colors.accentDim },
  prodChipText: { fontSize: 12, color: colors.textSecondary, fontWeight: "600" },
  prodChipTextActive: { color: colors.accent },
  prodChipStock: { fontSize: 11, color: colors.textMuted },
  input: { backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 11, color: colors.textPrimary, fontSize: 14 },
  submitBtn: { backgroundColor: colors.accent, borderRadius: radius.md, padding: 14, alignItems: "center", marginTop: 24 },
  submitBtnText: { color: colors.white, fontWeight: "700", fontSize: 16 },
});
