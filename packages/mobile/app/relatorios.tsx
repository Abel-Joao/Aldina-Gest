import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useRouter } from "expo-router";
import { dbGet } from "../lib/supabase";
import { colors, spacing, radius, typography } from "../lib/theme";
import { ArrowLeft, TrendUp, TrendDown, ChartPie } from "phosphor-react-native";

interface Fatura {
  id: string;
  total: number;
  subtotal?: number;
  iva?: number;
  status: string;
  data: string;
  itens?: any[];
}

function kz(val: number) {
  return new Intl.NumberFormat("pt-AO", { style: "currency", currency: "AOA", minimumFractionDigits: 0 }).format(val || 0);
}

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export default function RelatoriosScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [periodo, setPeriodo] = useState<"mes" | "trimestre" | "ano">("mes");

  const faturas = useQuery({
    queryKey: ["faturas"],
    queryFn: () => dbGet<Fatura>("faturas", "order=data.desc"),
  });

  async function onRefresh() {
    setRefreshing(true);
    await faturas.refetch();
    setRefreshing(false);
  }

  const agora = new Date();
  const anoAtual = agora.getFullYear();
  const mesAtual = agora.getMonth() + 1;

  const fatAll = (faturas.data || []).filter((f) => f.status !== "anulada");

  function getFiltradas() {
    switch (periodo) {
      case "mes": {
        const m = String(mesAtual).padStart(2, "0");
        return fatAll.filter((f) => f.data?.startsWith(`${anoAtual}-${m}`));
      }
      case "trimestre": {
        const trimMeses: string[] = [];
        for (let i = 2; i >= 0; i--) {
          const d = new Date(anoAtual, mesAtual - 1 - i, 1);
          trimMeses.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
        }
        return fatAll.filter((f) => trimMeses.some((m) => f.data?.startsWith(m)));
      }
      case "ano":
      default:
        return fatAll.filter((f) => f.data?.startsWith(String(anoAtual)));
    }
  }

  const filtradas = getFiltradas();
  const totalFaturado = filtradas.reduce((a, f) => a + (f.total || 0), 0);
  const totalIVA = filtradas.reduce((a, f) => a + (f.iva || 0), 0);
  const totalLiquido = totalFaturado - totalIVA;
  const numFaturas = filtradas.length;
  const ticketMedio = numFaturas ? totalFaturado / numFaturas : 0;

  // Por mês (ano actual)
  const porMes = Array.from({ length: 12 }, (_, i) => {
    const m = String(i + 1).padStart(2, "0");
    const total = fatAll
      .filter((f) => f.data?.startsWith(`${anoAtual}-${m}`))
      .reduce((a, f) => a + (f.total || 0), 0);
    return { label: MESES[i], total };
  });
  const maxTotal = Math.max(...porMes.map((m) => m.total), 1);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={typography.h2}>P&L / Relatórios</Text>
      </View>

      {faturas.isLoading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} />}
        >
          {/* Período */}
          <View style={styles.periodoRow}>
            {(["mes", "trimestre", "ano"] as const).map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.periodoChip, periodo === p && styles.periodoChipActive]}
                onPress={() => setPeriodo(p)}
              >
                <Text style={[styles.periodoText, periodo === p && styles.periodoTextActive]}>
                  {p === "mes" ? "Este Mês" : p === "trimestre" ? "Trimestre" : "Este Ano"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* KPIs */}
          <View style={styles.kpiGrid}>
            <View style={[styles.kpiCard, styles.kpiMain]}>
              <TrendUp size={20} color={colors.accent} weight="fill" />
              <Text style={styles.kpiLabel}>Total Faturado</Text>
              <Text style={styles.kpiValue}>{kz(totalFaturado)}</Text>
            </View>
            <View style={styles.kpiCard}>
              <TrendDown size={20} color={colors.danger} weight="fill" />
              <Text style={styles.kpiLabel}>IVA (14%)</Text>
              <Text style={styles.kpiValue}>{kz(totalIVA)}</Text>
            </View>
            <View style={styles.kpiCard}>
              <ChartPie size={20} color={colors.success} weight="fill" />
              <Text style={styles.kpiLabel}>Líquido</Text>
              <Text style={[styles.kpiValue, { color: colors.success }]}>{kz(totalLiquido)}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Nº Faturas</Text>
              <Text style={styles.kpiValue}>{numFaturas}</Text>
              <Text style={styles.kpiSub}>Ticket médio: {kz(ticketMedio)}</Text>
            </View>
          </View>

          {/* Gráfico de barras simples */}
          <Text style={styles.sectionTitle}>Faturação Mensal ({anoAtual})</Text>
          <View style={styles.chartCard}>
            {porMes.map((m) => (
              <View key={m.label} style={styles.barCol}>
                <Text style={styles.barVal}>
                  {m.total > 0 ? (m.total >= 1_000_000 ? `${(m.total / 1_000_000).toFixed(1)}M` : `${Math.round(m.total / 1000)}k`) : ""}
                </Text>
                <View style={styles.barBg}>
                  <View
                    style={[
                      styles.barFill,
                      { height: `${Math.round((m.total / maxTotal) * 100)}%` },
                      m.label === MESES[mesAtual - 1] && styles.barFillActive,
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{m.label}</Text>
              </View>
            ))}
          </View>

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
  periodoRow: { flexDirection: "row", gap: 8, marginHorizontal: spacing.xl, marginBottom: spacing.xl },
  periodoChip: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: 8, alignItems: "center", backgroundColor: colors.bgCard },
  periodoChipActive: { borderColor: colors.accent, backgroundColor: colors.accentDim },
  periodoText: { fontSize: 12, fontWeight: "600", color: colors.textMuted },
  periodoTextActive: { color: colors.accent },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: spacing.xl, gap: spacing.md, marginBottom: spacing.xl },
  kpiCard: { width: "47%", backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: 4 },
  kpiMain: { borderColor: colors.accent, backgroundColor: colors.accentDim },
  kpiLabel: { ...typography.caption },
  kpiValue: { ...typography.h3, fontSize: 18 },
  kpiSub: { ...typography.caption, color: colors.textMuted, fontSize: 10 },
  sectionTitle: { ...typography.label, marginHorizontal: spacing.xl, marginBottom: spacing.md },
  chartCard: { flexDirection: "row", alignItems: "flex-end", backgroundColor: colors.bgCard, borderRadius: radius.xl, marginHorizontal: spacing.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, height: 160, gap: 4 },
  barCol: { flex: 1, alignItems: "center", height: "100%", justifyContent: "flex-end" },
  barVal: { fontSize: 7, color: colors.textMuted, marginBottom: 2 },
  barBg: { flex: 1, width: "80%", backgroundColor: colors.bgElevated, borderRadius: 3, overflow: "hidden", justifyContent: "flex-end" },
  barFill: { width: "100%", backgroundColor: colors.accent + "77", borderRadius: 3, minHeight: 2 },
  barFillActive: { backgroundColor: colors.accent },
  barLabel: { fontSize: 7, color: colors.textMuted, marginTop: 3 },
});
