import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useRouter } from "expo-router";
import { dbGet, dbPost, dbPatch } from "../lib/supabase";
import { colors, spacing, radius, typography } from "../lib/theme";
import { ArrowLeft, LockKey, LockKeyOpen, Plus } from "phosphor-react-native";

interface Caixa {
  id: string;
  data: string;
  abertura: number;
  fechamento?: number;
  status: "aberta" | "fechada";
  totalVendas?: number;
  notas?: string;
}

function kz(val: number) {
  return new Intl.NumberFormat("pt-AO", { style: "currency", currency: "AOA", minimumFractionDigits: 0 }).format(val || 0);
}

export default function CaixaScreen() {
  const qc = useQueryClient();
  const router = useRouter();
  const [aberturaVal, setAberturaVal] = useState("0");
  const [fechamentoVal, setFechamentoVal] = useState("0");
  const [notas, setNotas] = useState("");

  const caixas = useQuery({
    queryKey: ["caixa"],
    queryFn: async () => {
      try {
        return await dbGet<Caixa>("caixa", "order=data.desc&limit=30");
      } catch {
        return [] as Caixa[];
      }
    },
  });

  const caixaAberta = caixas.data?.find((c) => c.status === "aberta");

  const abrirCaixa = useMutation({
    mutationFn: async () => {
      const val = parseFloat(aberturaVal) || 0;
      return dbPost<Caixa>("caixa", {
        data: new Date().toISOString().slice(0, 10),
        abertura: val,
        status: "aberta",
        notas,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["caixa"] });
      setAberturaVal("0");
      setNotas("");
    },
    onError: (e: any) => Alert.alert("Erro", e.message),
  });

  const fecharCaixa = useMutation({
    mutationFn: async (id: string) => {
      const val = parseFloat(fechamentoVal) || 0;
      return dbPatch<Caixa>("caixa", `id=eq.${id}`, {
        fechamento: val,
        status: "fechada",
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["caixa"] });
      setFechamentoVal("0");
    },
    onError: (e: any) => Alert.alert("Erro", e.message),
  });

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={typography.h2}>Caixa</Text>
      </View>

      {caixas.isLoading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Estado actual */}
          <View style={[styles.statusCard, caixaAberta ? styles.statusAberta : styles.statusFechada]}>
            {caixaAberta ? (
              <LockKeyOpen size={28} color={colors.success} weight="fill" />
            ) : (
              <LockKey size={28} color={colors.textMuted} weight="fill" />
            )}
            <View>
              <Text style={styles.statusLabel}>
                {caixaAberta ? "Caixa Aberta" : "Caixa Fechada"}
              </Text>
              {caixaAberta && (
                <Text style={styles.statusSub}>
                  Abertura: {kz(caixaAberta.abertura)} · {caixaAberta.data}
                </Text>
              )}
            </View>
          </View>

          {/* Acção */}
          {!caixaAberta ? (
            <View style={styles.actionCard}>
              <Text style={[typography.h3, { marginBottom: 16 }]}>Abrir Caixa</Text>
              <Text style={styles.fl}>Valor de Abertura (Kz)</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                value={aberturaVal}
                onChangeText={setAberturaVal}
                keyboardType="numeric"
              />
              <Text style={styles.fl}>Notas</Text>
              <TextInput
                style={[styles.input, { height: 64, textAlignVertical: "top" }]}
                placeholder="Observações..."
                placeholderTextColor={colors.textMuted}
                multiline
                value={notas}
                onChangeText={setNotas}
              />
              <TouchableOpacity
                style={[styles.btn, styles.btnSuccess, abrirCaixa.isPending && { opacity: 0.6 }]}
                onPress={() => abrirCaixa.mutate()}
                disabled={abrirCaixa.isPending}
                activeOpacity={0.8}
              >
                {abrirCaixa.isPending ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <>
                    <LockKeyOpen size={18} color={colors.white} weight="bold" />
                    <Text style={styles.btnText}>Abrir Caixa</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.actionCard}>
              <Text style={[typography.h3, { marginBottom: 16 }]}>Fechar Caixa</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Abertura</Text>
                <Text style={styles.infoVal}>{kz(caixaAberta.abertura)}</Text>
              </View>
              <Text style={styles.fl}>Valor em Caixa (Kz)</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                value={fechamentoVal}
                onChangeText={setFechamentoVal}
                keyboardType="numeric"
              />
              <TouchableOpacity
                style={[styles.btn, styles.btnDanger, fecharCaixa.isPending && { opacity: 0.6 }]}
                onPress={() =>
                  Alert.alert("Fechar caixa?", "Confirma o fecho da sessão de caixa?", [
                    { text: "Cancelar", style: "cancel" },
                    { text: "Fechar", style: "destructive", onPress: () => fecharCaixa.mutate(caixaAberta.id) },
                  ])
                }
                disabled={fecharCaixa.isPending}
                activeOpacity={0.8}
              >
                {fecharCaixa.isPending ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <>
                    <LockKey size={18} color={colors.white} weight="bold" />
                    <Text style={styles.btnText}>Fechar Caixa</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Histórico */}
          <Text style={styles.sectionTitle}>Histórico</Text>
          {(caixas.data || []).map((c) => (
            <View key={c.id} style={styles.histCard}>
              <View>
                <Text style={styles.histData}>{c.data}</Text>
                <Text style={styles.histAbertura}>Abertura: {kz(c.abertura)}</Text>
                {c.fechamento !== undefined && (
                  <Text style={styles.histFecho}>Fecho: {kz(c.fechamento)}</Text>
                )}
              </View>
              <View style={[styles.badge, c.status === "aberta" ? styles.badgeAberta : styles.badgeFechada]}>
                <Text style={styles.badgeText}>{c.status}</Text>
              </View>
            </View>
          ))}
          {!caixas.data?.length && (
            <View style={styles.empty}><Text style={styles.emptyText}>Sem registos de caixa</Text></View>
          )}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: "row", alignItems: "center", padding: spacing.xl, gap: 12 },
  backBtn: { padding: 4 },
  statusCard: { flexDirection: "row", alignItems: "center", gap: 14, marginHorizontal: spacing.xl, marginBottom: spacing.lg, borderRadius: radius.lg, padding: spacing.xl, borderWidth: 1 },
  statusAberta: { backgroundColor: colors.successDim, borderColor: colors.success },
  statusFechada: { backgroundColor: colors.bgCard, borderColor: colors.border },
  statusLabel: { ...typography.h3 },
  statusSub: { ...typography.caption, marginTop: 2 },
  actionCard: { backgroundColor: colors.bgCard, borderRadius: radius.xl, marginHorizontal: spacing.xl, marginBottom: spacing.xl, padding: spacing.xl, borderWidth: 1, borderColor: colors.border },
  fl: { ...typography.label, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 11, color: colors.textPrimary, fontSize: 14 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  infoLabel: { ...typography.caption },
  infoVal: { color: colors.textPrimary, fontWeight: "700", fontSize: 14 },
  btn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: radius.md, padding: 14, marginTop: 16 },
  btnSuccess: { backgroundColor: colors.success },
  btnDanger: { backgroundColor: colors.danger },
  btnText: { color: colors.white, fontWeight: "700", fontSize: 15 },
  sectionTitle: { ...typography.label, marginHorizontal: spacing.xl, marginBottom: spacing.sm },
  histCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: colors.bgCard, borderRadius: radius.md, marginHorizontal: spacing.xl, marginBottom: spacing.sm, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  histData: { ...typography.body, fontWeight: "600" },
  histAbertura: { ...typography.caption, marginTop: 2 },
  histFecho: { ...typography.caption, marginTop: 2 },
  badge: { borderWidth: 1, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 3 },
  badgeAberta: { backgroundColor: colors.successDim, borderColor: colors.success },
  badgeFechada: { backgroundColor: colors.bgElevated, borderColor: colors.border },
  badgeText: { fontSize: 10, fontWeight: "600", color: colors.textSecondary },
  empty: { alignItems: "center", paddingVertical: 40, gap: 12 },
  emptyText: { ...typography.caption },
});
