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
import { dbGet, dbPost, dbDelete } from "../../lib/supabase";
import { colors, spacing, radius, typography } from "../../lib/theme";
import { Plus, MagnifyingGlass, X, User, Phone, Envelope, Trash, Buildings } from "phosphor-react-native";

interface Contato {
  id: string;
  nome: string;
  tipo: string;
  email?: string;
  telefone?: string;
  nif?: string;
  empresa?: string;
  endereco?: string;
}

export default function ClientesScreen() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [tipo, setTipo] = useState<"cliente" | "fornecedor">("cliente");

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [nif, setNif] = useState("");
  const [empresa, setEmpresa] = useState("");

  const contatos = useQuery({
    queryKey: ["contatos"],
    queryFn: () => dbGet<Contato>("contatos", "order=nome"),
  });

  async function onRefresh() {
    setRefreshing(true);
    await contatos.refetch();
    setRefreshing(false);
  }

  const create = useMutation({
    mutationFn: async () => {
      if (!nome.trim()) throw new Error("Nome obrigatório");
      return dbPost<Contato>("contatos", { nome, tipo, email, telefone, nif, empresa });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contatos"] });
      resetForm();
      setShowModal(false);
    },
    onError: (e: any) => Alert.alert("Erro", e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => dbDelete("contatos", `id=eq.${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contatos"] }),
    onError: (e: any) => Alert.alert("Erro", e.message),
  });

  function resetForm() {
    setNome(""); setEmail(""); setTelefone(""); setNif(""); setEmpresa(""); setTipo("cliente");
  }

  const filtered = (contatos.data || []).filter((c) =>
    c.nome?.toLowerCase().includes(search.toLowerCase()) ||
    c.empresa?.toLowerCase().includes(search.toLowerCase())
  );

  const clientes = filtered.filter((c) => c.tipo === "cliente");
  const fornecedores = filtered.filter((c) => c.tipo === "fornecedor");

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={typography.h2}>Contactos</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)} activeOpacity={0.8}>
          <Plus size={20} color={colors.white} weight="bold" />
          <Text style={styles.addBtnText}>Novo</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <MagnifyingGlass size={16} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Pesquisar contactos..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {contatos.isLoading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} />
          }
        >
          {clientes.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Clientes ({clientes.length})</Text>
              {clientes.map((c) => <ContactCard key={c.id} c={c} onDelete={() =>
                Alert.alert("Eliminar?", `Remover ${c.nome}?`, [
                  { text: "Cancelar", style: "cancel" },
                  { text: "Eliminar", style: "destructive", onPress: () => remove.mutate(c.id) },
                ])
              } />)}
            </>
          )}
          {fornecedores.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Fornecedores ({fornecedores.length})</Text>
              {fornecedores.map((c) => <ContactCard key={c.id} c={c} onDelete={() =>
                Alert.alert("Eliminar?", `Remover ${c.nome}?`, [
                  { text: "Cancelar", style: "cancel" },
                  { text: "Eliminar", style: "destructive", onPress: () => remove.mutate(c.id) },
                ])
              } />)}
            </>
          )}
          {filtered.length === 0 && (
            <View style={styles.empty}>
              <User size={40} color={colors.textMuted} />
              <Text style={styles.emptyText}>Sem contactos</Text>
            </View>
          )}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalSafe} edges={["top", "left", "right"]}>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <View style={styles.modalHeader}>
              <Text style={typography.h3}>Novo Contacto</Text>
              <TouchableOpacity onPress={() => { setShowModal(false); resetForm(); }}>
                <X size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: spacing.xl }}>
              <Text style={styles.fl}>Tipo</Text>
              <View style={styles.tipoRow}>
                {(["cliente", "fornecedor"] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.tipoChip, tipo === t && styles.tipoChipActive]}
                    onPress={() => setTipo(t)}
                  >
                    <Text style={[styles.tipoText, tipo === t && styles.tipoTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fl}>Nome *</Text>
              <TextInput style={styles.input} placeholder="Nome completo" placeholderTextColor={colors.textMuted} value={nome} onChangeText={setNome} />

              <Text style={styles.fl}>Email</Text>
              <TextInput style={styles.input} placeholder="email@exemplo.ao" placeholderTextColor={colors.textMuted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

              <Text style={styles.fl}>Telefone</Text>
              <TextInput style={styles.input} placeholder="+244 9XX XXX XXX" placeholderTextColor={colors.textMuted} value={telefone} onChangeText={setTelefone} keyboardType="phone-pad" />

              <Text style={styles.fl}>NIF</Text>
              <TextInput style={styles.input} placeholder="NIF da empresa" placeholderTextColor={colors.textMuted} value={nif} onChangeText={setNif} />

              <Text style={styles.fl}>Empresa</Text>
              <TextInput style={styles.input} placeholder="Nome da empresa" placeholderTextColor={colors.textMuted} value={empresa} onChangeText={setEmpresa} />

              <TouchableOpacity
                style={[styles.submitBtn, create.isPending && { opacity: 0.6 }]}
                onPress={() => create.mutate()}
                disabled={create.isPending}
                activeOpacity={0.8}
              >
                {create.isPending ? <ActivityIndicator color={colors.white} /> : <Text style={styles.submitBtnText}>Adicionar Contacto</Text>}
              </TouchableOpacity>
              <View style={{ height: 40 }} />
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function ContactCard({ c, onDelete }: { c: Contato; onDelete: () => void }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{c.nome?.charAt(0)?.toUpperCase() || "?"}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardName}>{c.nome}</Text>
          {c.empresa ? (
            <View style={styles.cardMeta}>
              <Buildings size={11} color={colors.textMuted} />
              <Text style={styles.cardMetaText}>{c.empresa}</Text>
            </View>
          ) : null}
          {c.telefone ? (
            <View style={styles.cardMeta}>
              <Phone size={11} color={colors.textMuted} />
              <Text style={styles.cardMetaText}>{c.telefone}</Text>
            </View>
          ) : null}
          {c.email ? (
            <View style={styles.cardMeta}>
              <Envelope size={11} color={colors.textMuted} />
              <Text style={styles.cardMetaText}>{c.email}</Text>
            </View>
          ) : null}
        </View>
      </View>
      <TouchableOpacity onPress={onDelete} style={{ padding: 4 }}>
        <Trash size={16} color={colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.xl },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.accent, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText: { color: colors.white, fontWeight: "700", fontSize: 14 },
  searchWrap: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginHorizontal: spacing.xl, marginBottom: spacing.lg,
    backgroundColor: colors.bgCard, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  searchInput: { flex: 1, color: colors.textPrimary, fontSize: 14 },
  sectionTitle: { ...typography.label, marginHorizontal: spacing.xl, marginBottom: spacing.sm, marginTop: spacing.xs },
  card: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    marginHorizontal: spacing.xl, marginBottom: spacing.sm,
    padding: spacing.lg, borderWidth: 1, borderColor: colors.border,
  },
  cardLeft: { flex: 1, flexDirection: "row", gap: 12, alignItems: "flex-start" },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.accentDim, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: colors.accent,
  },
  avatarText: { color: colors.accent, fontWeight: "800", fontSize: 16 },
  cardName: { ...typography.body, fontWeight: "600" },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  cardMetaText: { ...typography.caption, fontSize: 11 },
  empty: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyText: { ...typography.caption },
  modalSafe: { flex: 1, backgroundColor: colors.bg },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.border },
  fl: { ...typography.label, marginBottom: 6, marginTop: 14 },
  tipoRow: { flexDirection: "row", gap: 8, marginBottom: 4 },
  tipoChip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.full, paddingHorizontal: 16, paddingVertical: 6, backgroundColor: colors.bgElevated },
  tipoChipActive: { borderColor: colors.accent, backgroundColor: colors.accentDim },
  tipoText: { fontSize: 12, color: colors.textSecondary, fontWeight: "600" },
  tipoTextActive: { color: colors.accent },
  input: { backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 11, color: colors.textPrimary, fontSize: 14, marginBottom: 0 },
  submitBtn: { backgroundColor: colors.accent, borderRadius: radius.md, padding: 14, alignItems: "center", marginTop: 24 },
  submitBtnText: { color: colors.white, fontWeight: "700", fontSize: 16 },
});
