import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { useAuth } from "../lib/auth";
import { colors, spacing, radius, typography } from "../lib/theme";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Erro", "Preencha o email e a password.");
      return;
    }
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (e: any) {
      Alert.alert("Erro de autenticação", e.message || "Credenciais inválidas");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo / Branding */}
          <View style={styles.brand}>
            <View style={styles.logoBox}>
              <Text style={styles.logoText}>A</Text>
            </View>
            <Text style={styles.appName}>Aldina Gest</Text>
            <Text style={styles.tagline}>Gestão & Faturação</Text>
          </View>

          {/* Form */}
          <View style={styles.card}>
            <Text style={styles.formTitle}>Entrar na conta</Text>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="email@empresa.ao"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
              />
            </View>

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.btnText}>Entrar</Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>
            © {new Date().getFullYear()} Aldina Gest · Angola
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing.xl,
    paddingBottom: 40,
  },
  brand: { alignItems: "center", marginBottom: 36 },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: colors.accent,
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  logoText: { fontSize: 32, fontWeight: "800", color: colors.white },
  appName: { ...typography.h1, fontSize: 28, marginBottom: 4 },
  tagline: { ...typography.caption, fontSize: 13 },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  formTitle: { ...typography.h3, marginBottom: 20 },
  field: { marginBottom: spacing.lg },
  fieldLabel: { ...typography.label, marginBottom: 6 },
  input: {
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 12,
    color: colors.textPrimary,
    fontSize: 15,
  },
  btn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    padding: 14,
    alignItems: "center",
    marginTop: 8,
    shadowColor: colors.accent,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: colors.white, fontSize: 16, fontWeight: "700" },
  footer: { textAlign: "center", ...typography.caption, marginTop: 8 },
});
