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
import { useRouter } from "expo-router";
import { useState } from "react";
import { dbGet } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import { colors, spacing, radius, typography } from "../../lib/theme";
import {
  Invoice,
  Users,
  Package,
  TrendUp,
  ArrowRight,
  Warning,
} from "phosphor-react-native";

interface Fatura {
  id: string;
  numero: string;
  cliente: string;
  total: number;
  status: string;
  data: string;
  user_id?: string;
}

interface Contato {
  id: string;
  nome: string;
  tipo: string;
  user_id?: string;
}

interface Produto {
  id: string;
  nome: string;
  stock?: number;
  stockMinimo?: number;
  user_id?: string;
}

function kz(val: number) {
  return new Intl.NumberFormat("pt-AO", {
    style: "currency",
    currency: "AOA",
    minimumFractionDigits: 0,
  }).format(val || 0);
}

function sumTotal(arr: Fatura[]) {
  return arr.reduce((acc, f) => acc + (f.total || 0), 0);
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const faturas = useQuery({
    queryKey: ["faturas"],
    queryFn: () =>
      dbGet<Fatura>("faturas", "order=data.desc&limit=100"),
  });

  const clientes = useQuery({
    queryKey: ["contatos"],
    queryFn: () => dbGet<Contato>("contatos", "tipo=eq.cliente"),
  });

  const produtos = useQuery({
    queryKey: ["produtos"],
    queryFn: () => dbGet<Produto>("produtos", "select=*"),
  });

  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([
      faturas.refetch(),
      clientes.refetch(),
      produtos.refetch(),
    ]);
    setRefreshing(false);
  }

  const fatList = faturas.data || [];
  const hoje = new Date().toISOString().slice(0, 10);
  const mesAtual = new Date().toISOString().slice(0, 7);

  const totalMes = sumTotal(
    fatList.filter((f) => f.data?.startsWith(mesAtual) && f.status !== "anulada")
  );
  const totalHoje = sumTotal(
    fatList.filter((f) => f.data?.startsWith(hoje) && f.status !== "anulada")
  );
  const emAberto = fatList.filter((f) => f.status === "pendente").length;
  const totalClientes = clientes.data?.length || 0;

  const lowStock = (produtos.data || []).filter(
    (p) => p.stockMinimo && (p.stock || 0) <= p.stockMinimo
  );

  const isLoading = faturas.isLoading || clientes.isLoading;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Olá, {user?.nome || user?.email?.split("@")[0]} 👋</Text>
            <Text style={styles.subtitle}>
              {new Date().toLocaleDateString("pt-AO", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </Text>
          </View>
        </View>

        {isLoading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* KPI Cards */}
            <View style={styles.kpiRow}>
              <View style={[styles.kpiCard, styles.kpiAccent]}>
                <Text style={styles.kpiLabel}>ESTE MÊS</Text>
                <Text style={styles.kpiValue}>{kz(totalMes)}</Text>
                <Text style={styles.kpiSub}>faturado</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>HOJE</Text>
                <Text style={styles.kpiValue}>{kz(totalHoje)}</Text>
                <Text style={styles.kpiSub}>faturado</Text>
              </View>
            </View>

            <View style={styles.kpiRow}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>EM ABERTO</Text>
                <Text style={[styles.kpiValue, emAberto > 0 && { color: colors.warning }]}>
                  {emAberto}
                </Text>
                <Text style={styles.kpiSub}>faturas</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>CLIENTES</Text>
                <Text style={styles.kpiValue}>{totalClientes}</Text>
                <Text style={styles.kpiSub}>registados</Text>
              </View>
            </View>

            {/* Alerta stock baixo */}
            {lowStock.length > 0 && (
              <TouchableOpacity
                style={styles.alert}
                onPress={() => router.push("/(tabs)/mais")}
                activeOpacity={0.8}
              >
                <Warning size={18} color={colors.warning} weight="fill" />
                <Text style={styles.alertText}>
                  {lowStock.length} produto{lowStock.length > 1 ? "s" : ""} com stock baixo
                </Text>
                <ArrowRight size={16} color={colors.warning} />
              </TouchableOpacity>
            )}

            {/* Atalhos */}
            <Text style={styles.sectionTitle}>Acesso Rápido</Text>
            <View style={styles.shortcuts}>
              {[
                { label: "Nova Fatura", icon: Invoice, route: "/(tabs)/faturas", color: colors.accent },
                { label: "Venda POS", icon: ShoppingCart, route: "/(tabs)/pos", color: colors.success },
                { label: "Clientes", icon: Users, route: "/(tabs)/clientes", color: "#f59e0b" },
                { label: "Produtos", icon: Package, route: "/(tabs)/mais", color: "#ec4899" },
              ].map((item) => (
                <TouchableOpacity
                  key={item.label}
                  style={styles.shortcut}
                  onPress={() => router.push(item.route as any)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.shortcutIcon, { backgroundColor: item.color + "22" }]}>
                    <item.icon size={22} color={item.color} weight="fill" />
                  </View>
                  <Text style={styles.shortcutLabel}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Últimas faturas */}
            <Text style={styles.sectionTitle}>Últimas Faturas</Text>
            {fatList.slice(0, 5).map((f) => (
              <View key={f.id} style={styles.faturaRow}>
                <View style={styles.faturaInfo}>
                  <Text style={styles.faturaNum}>{f.numero || "—"}</Text>
                  <Text style={styles.faturaCliente}>{f.cliente || "—"}</Text>
                </View>
                <View style={styles.faturaRight}>
                  <Text style={styles.faturaTotal}>{kz(f.total)}</Text>
                  <View style={[styles.badge, statusColor(f.status)]}>
                    <Text style={styles.badgeText}>{f.status}</Text>
                  </View>
                </View>
              </View>
            ))}

            {fatList.length === 0 && (
              <View style={styles.empty}>
                <Invoice size={40} color={colors.textMuted} />
                <Text style={styles.emptyText}>Sem faturas ainda</Text>
              </View>
            )}

            <View style={{ height: 32 }} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function statusColor(status: string) {
  switch (status) {
    case "paga":
      return { backgroundColor: colors.successDim, borderColor: colors.success };
    case "pendente":
      return { backgroundColor: colors.warningDim, borderColor: colors.warning };
    case "anulada":
      return { backgroundColor: colors.dangerDim, borderColor: colors.danger };
    default:
      return { backgroundColor: colors.accentDim, borderColor: colors.accent };
  }
}

// quick import alias
import { ShoppingCartSimple as ShoppingCart } from "phosphor-react-native";

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.xl,
    paddingBottom: spacing.lg,
  },
  greeting: { ...typography.h2, marginBottom: 2 },
  subtitle: { ...typography.caption, fontSize: 13 },
  kpiRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  kpiAccent: {
    borderColor: colors.accent,
    backgroundColor: colors.accentDim,
  },
  kpiLabel: { ...typography.label, marginBottom: 4 },
  kpiValue: { ...typography.h2, fontSize: 22, marginBottom: 2 },
  kpiSub: { ...typography.caption },
  alert: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    backgroundColor: colors.warningDim,
    borderWidth: 1,
    borderColor: colors.warning,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  alertText: { flex: 1, color: colors.warning, fontSize: 13, fontWeight: "500" },
  sectionTitle: {
    ...typography.label,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  shortcuts: {
    flexDirection: "row",
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  shortcut: { flex: 1, alignItems: "center", gap: 8 },
  shortcutIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  shortcutLabel: { ...typography.caption, fontSize: 11, textAlign: "center" },
  faturaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  faturaInfo: { flex: 1 },
  faturaNum: { ...typography.body, fontWeight: "600" },
  faturaCliente: { ...typography.caption, marginTop: 2 },
  faturaRight: { alignItems: "flex-end", gap: 4 },
  faturaTotal: { ...typography.body, fontWeight: "700" },
  badge: {
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 10, fontWeight: "600", color: colors.textSecondary },
  empty: { alignItems: "center", paddingVertical: 40, gap: 12 },
  emptyText: { ...typography.caption },
});
