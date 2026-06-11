import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { dbGet, dbPost, dbPatch } from "../../lib/supabase";
import { colors, spacing, radius, typography } from "../../lib/theme";
import { Plus, MagnifyingGlass, X, Invoice, Check, XCircle } from "phosphor-react-native";

interface Fatura {
  id: string;
  numero: string;
  cliente: string;
  clienteId?: string;
  total: number;
  subtotal?: number;
  iva?: number;
  status: string;
  data: string;
  itens?: any[];
  notas?: string;
}

interface Contato {
  id: string;
  nome: string;
  tipo: string;
  nif?: string;
}

function kz(val: number) {
  return new Intl.NumberFormat("pt-AO", { style: "currency", currency: "AOA", minimumFractionDigits: 0 }).format(val || 0);
}

function nextNum(faturas: Fatura[]): string {
  const nums = faturas
    .map((f) => parseInt(f.numero?.replace(/\D/g, "") || "0"))
    .filter((n) => !isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return `FT-${String(max + 1).padStart(4, "0")}`;
}

const STATUS_OPTS = ["rascunho", "pendente", "paga", "anulada"];

export default function FaturasScreen() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // New fatura form
  const [cliente, setCliente] = useState("");
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState("pendente");
  const [notas, setNotas] = useState("");
  const [linhas, setLinhas] = useState([{ desc: "", qty: "1", preco: "0" }]);

  const faturas = useQuery({
    queryKey: ["faturas"],
    queryFn: () => dbGet<Fatura>("faturas", "order=data.desc"),
  });

  const clientes = useQuery({
    queryKey: ["contatos"],
    queryFn: () => dbGet<Contato>("contatos", "tipo=eq.cliente"),
  });

  async function onRefresh() {
    setRefreshing(true);
    await faturas.refetch();
    setRefreshing(false);
  }

  const createFatura = useMutation({
    mutationFn: async () => {
      const itens = linhas.map((l) => ({
        descricao: l.desc,
        quantidade: parseFloat(l.qty) || 1,
        precoUnit: parseFloat(l.preco) || 0,
        total: (parseFloat(l.qty) || 1) * (parseFloat(l.preco) || 0),
      }));
      const subtotal = itens.reduce((a, i) => a + i.total, 0);
      const iva = subtotal * 0.14;
      const total = subtotal + iva;
      const payload = {
        numero: nextNum(faturas.data || []),
        cliente,
        total,
        subtotal,
        iva,
        status,
        data,
        notas,
        itens,
      };
      return dbPost<Fatura>("faturas", payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["faturas"] });
      resetForm();
      setShowModal(false);
    },
    onError: (e: any) => Alert.alert("Erro", e.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: string }) =>
      dbPatch<Fatura>("faturas", `id=eq.${id}`, { status: newStatus }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["faturas"] }),
    onError: (e: any) => Alert.alert("Erro", e.message),
  });

  function resetForm() {
    setCliente("");
    setData(new Date().toISOString().slice(0, 10));
    setStatus("pendente");
    setNotas("");
    setLinhas([{ desc: "", qty: "1", preco: "0" }]);
  }

  function calcTotal() {
    const sub = linhas.reduce(
      (a, l) => a + (parseFloat(l.qty) || 0) * (parseFloat(l.preco) || 0),
      0
    );
    return sub + sub * 0.14;
  }

  const filtered = (faturas.data || []).filter(
    (f) =>
      f.numero?.toLowerCase().includes(search.toLowerCase()) ||
      f.cliente?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={typography.h2}>Faturas</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowModal(true)}
          activeOpacity={0.8}
        >
          <Plus size={20} color={colors.white} weight="bold" />
          <Text style={styles.addBtnText}>Nova</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <MagnifyingGlass size={16} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Pesquisar faturas..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* List */}
      {faturas.isLoading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} />
          }
        >
          {filtered.length === 0 && (
            <View style={styles.empty}>
              <Invoice size={40} color={colors.textMuted} />
              <Text style={styles.emptyText}>Sem faturas</Text>
            </View>
          )}
          {filtered.map((f) => (
            <View key={f.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View>
                  <Text style={styles.cardNum}>{f.numero}</Text>
                  <Text style={styles.cardCliente}>{f.cliente}</Text>
                  <Text style={styles.cardData}>{f.data}</Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 6 }}>
                  <Text style={styles.cardTotal}>{kz(f.total)}</Text>
                  <View style={[styles.badge, statusStyle(f.status)]}>
                    <Text style={styles.badgeText}>{f.status}</Text>
                  </View>
                </View>
              </View>
              {f.status === "pendente" && (
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => updateStatus.mutate({ id: f.id, newStatus: "paga" })}
                    activeOpacity={0.8}
                  >
                    <Check size={14} color={colors.success} weight="bold" />
                    <Text style={[styles.actionText, { color: colors.success }]}>Marcar paga</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() =>
                      Alert.alert("Anular fatura?", "Esta acção não pode ser desfeita.", [
                        { text: "Cancelar", style: "cancel" },
                        { text: "Anular", style: "destructive", onPress: () => updateStatus.mutate({ id: f.id, newStatus: "anulada" }) },
                      ])
                    }
                    activeOpacity={0.8}
                  >
                    <XCircle size={14} color={colors.danger} weight="bold" />
                    <Text style={[styles.actionText, { color: colors.danger }]}>Anular</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}

      {/* Modal Nova Fatura */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalSafe} edges={["top", "left", "right"]}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <View style={styles.modalHeader}>
              <Text style={typography.h3}>Nova Fatura</Text>
              <TouchableOpacity onPress={() => { setShowModal(false); resetForm(); }}>
                <X size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: spacing.xl }}>
              <FieldLabel label="Cliente" />
              <TextInput style={styles.input} placeholder="Nome do cliente" placeholderTextColor={colors.textMuted} value={cliente} onChangeText={setCliente} />

              <FieldLabel label="Data" />
              <TextInput style={styles.input} placeholder="AAAA-MM-DD" placeholderTextColor={colors.textMuted} value={data} onChangeText={setData} />

              <FieldLabel label="Estado" />
              <View style={styles.statusRow}>
                {STATUS_OPTS.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.statusChip, status === s && styles.statusChipActive]}
                    onPress={() => setStatus(s)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.statusChipText, status === s && styles.statusChipTextActive]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <FieldLabel label="Linhas" />
              {linhas.map((l, i) => (
                <View key={i} style={styles.linhaRow}>
                  <TextInput
                    style={[styles.input, { flex: 2 }]}
                    placeholder="Descrição"
                    placeholderTextColor={colors.textMuted}
                    value={l.desc}
                    onChangeText={(v) => {
                      const cp = [...linhas];
                      cp[i].desc = v;
                      setLinhas(cp);
                    }}
                  />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Qty"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    value={l.qty}
                    onChangeText={(v) => {
                      const cp = [...linhas];
                      cp[i].qty = v;
                      setLinhas(cp);
                    }}
                  />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Preço"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    value={l.preco}
                    onChangeText={(v) => {
                      const cp = [...linhas];
                      cp[i].preco = v;
                      setLinhas(cp);
                    }}
                  />
                  {linhas.length > 1 && (
                    <TouchableOpacity onPress={() => setLinhas(linhas.filter((_, idx) => idx !== i))}>
                      <X size={18} color={colors.danger} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <TouchableOpacity
                style={styles.addLinhaBtn}
                onPress={() => setLinhas([...linhas, { desc: "", qty: "1", preco: "0" }])}
              >
                <Plus size={14} color={colors.accent} />
                <Text style={styles.addLinhaBtnText}>Adicionar linha</Text>
              </TouchableOpacity>

              <FieldLabel label="Notas" />
              <TextInput
                style={[styles.input, { height: 64, textAlignVertical: "top" }]}
                placeholder="Observações..."
                placeholderTextColor={colors.textMuted}
                multiline
                value={notas}
                onChangeText={setNotas}
              />

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total (c/ IVA 14%)</Text>
                <Text style={styles.totalValue}>{kz(calcTotal())}</Text>
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, createFatura.isPending && { opacity: 0.6 }]}
                onPress={() => createFatura.mutate()}
                disabled={createFatura.isPending}
                activeOpacity={0.8}
              >
                {createFatura.isPending ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.submitBtnText}>Criar Fatura</Text>
                )}
              </TouchableOpacity>
              <View style={{ height: 40 }} />
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function FieldLabel({ label }: { label: string }) {
  return <Text style={[typography.label, { marginBottom: 6, marginTop: 14 }]}>{label}</Text>;
}

function statusStyle(s: string) {
  switch (s) {
    case "paga": return { backgroundColor: colors.successDim, borderColor: colors.success };
    case "pendente": return { backgroundColor: colors.warningDim, borderColor: colors.warning };
    case "anulada": return { backgroundColor: colors.dangerDim, borderColor: colors.danger };
    default: return { backgroundColor: colors.accentDim, borderColor: colors.accent };
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.xl,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addBtnText: { color: colors.white, fontWeight: "700", fontSize: 14 },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, color: colors.textPrimary, fontSize: 14 },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between" },
  cardNum: { ...typography.body, fontWeight: "700" },
  cardCliente: { ...typography.caption, marginTop: 2 },
  cardData: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  cardTotal: { ...typography.body, fontWeight: "700", color: colors.textPrimary },
  badge: { borderWidth: 1, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontWeight: "600", color: colors.textSecondary },
  cardActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  actionText: { fontSize: 12, fontWeight: "600" },
  empty: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyText: { ...typography.caption },
  modalSafe: { flex: 1, backgroundColor: colors.bg },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  input: {
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 11,
    color: colors.textPrimary,
    fontSize: 14,
    marginBottom: 0,
  },
  statusRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  statusChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: colors.bgElevated,
  },
  statusChipActive: { borderColor: colors.accent, backgroundColor: colors.accentDim },
  statusChipText: { fontSize: 12, color: colors.textSecondary, fontWeight: "600" },
  statusChipTextActive: { color: colors.accent },
  linhaRow: { flexDirection: "row", gap: 6, marginBottom: 6, alignItems: "center" },
  addLinhaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    marginBottom: 8,
  },
  addLinhaBtnText: { color: colors.accent, fontSize: 13, fontWeight: "600" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: colors.accentDim,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.accent,
    marginTop: 16,
    marginBottom: 16,
  },
  totalLabel: { color: colors.textPrimary, fontWeight: "600", fontSize: 14 },
  totalValue: { color: colors.accent, fontWeight: "800", fontSize: 18 },
  submitBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    padding: 14,
    alignItems: "center",
    shadowColor: colors.accent,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  submitBtnText: { color: colors.white, fontWeight: "700", fontSize: 16 },
});
