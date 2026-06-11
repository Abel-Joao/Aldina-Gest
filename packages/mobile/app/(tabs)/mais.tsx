import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../../lib/auth";
import { colors, spacing, radius, typography } from "../../lib/theme";
import {
  Package,
  ChartBar,
  CurrencyCircleDollar,
  Gear,
  SignOut,
  CaretRight,
  UserCircle,
} from "phosphor-react-native";

const MENU_ITEMS = [
  {
    label: "Produtos & Catálogo",
    icon: Package,
    route: "/produtos",
    color: "#ec4899",
  },
  {
    label: "Stock & Inventário",
    icon: Package,
    route: "/stock",
    color: "#f59e0b",
  },
  {
    label: "Caixa",
    icon: CurrencyCircleDollar,
    route: "/caixa",
    color: colors.success,
  },
  {
    label: "P&L / Relatórios",
    icon: ChartBar,
    route: "/relatorios",
    color: colors.accent,
  },
  {
    label: "Configurações",
    icon: Gear,
    route: "/config",
    color: colors.textSecondary,
  },
];

export default function MaisScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[typography.h2, { padding: spacing.xl, paddingBottom: spacing.md }]}>Mais</Text>

        {/* User card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <UserCircle size={28} color={colors.accent} weight="fill" />
          </View>
          <View>
            <Text style={styles.userName}>{user?.nome || user?.email?.split("@")[0]}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
        </View>

        {/* Menu */}
        <Text style={styles.sectionLabel}>Módulos</Text>
        <View style={styles.menuGroup}>
          {MENU_ITEMS.map((item, i) => (
            <TouchableOpacity
              key={item.route}
              style={[styles.menuItem, i < MENU_ITEMS.length - 1 && styles.menuItemBorder]}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIcon, { backgroundColor: item.color + "22" }]}>
                <item.icon size={20} color={item.color} weight="fill" />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <CaretRight size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={signOut}
          activeOpacity={0.8}
        >
          <SignOut size={18} color={colors.danger} weight="bold" />
          <Text style={styles.logoutText}>Terminar Sessão</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Aldina Gest v1.0 · Angola</Text>
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accentDim,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.accent,
  },
  userName: { ...typography.body, fontWeight: "700" },
  userEmail: { ...typography.caption, marginTop: 2 },
  sectionLabel: { ...typography.label, marginHorizontal: spacing.xl, marginBottom: spacing.sm },
  menuGroup: {
    marginHorizontal: spacing.xl,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    marginBottom: spacing.xl,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: spacing.lg,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: { ...typography.body, flex: 1 },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.dangerDim,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.danger,
    marginBottom: spacing.xl,
  },
  logoutText: { color: colors.danger, fontWeight: "700", fontSize: 15 },
  version: { textAlign: "center", ...typography.caption, color: colors.textMuted },
});
