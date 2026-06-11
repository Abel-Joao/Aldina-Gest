import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "../lib/auth";
import { colors, spacing, radius, typography } from "../lib/theme";
import { ArrowLeft, FloppyDisk } from "phosphor-react-native";

export default function ConfigScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  const [empresa, setEmpresa] = useState(user?.empresa || "");
  const [nif, setNif] = useState("");
  const [endereco, setEndereco] = useState("");
  const [telefone, setTelefone] = useState(user?.telefone || "");
  const [email] = useState(user?.email || "");
  const [ivaRate, setIvaRate] = useState("14");

  async function save() {
    setSaving(true);
    // Simular gravação (futuramente ligar à tabela profiles)
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    Alert.alert("Guardado", "Configurações actualizadas.");
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={typography.h2}>Configurações</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Secção: Empresa */}
          <Text style={styles.sectionTitle}>Dados da Empresa</Text>
          <View style={styles.card}>
            {[
              { label: "Nome da empresa", val: empresa, set: setEmpresa, ph: "Aldina Comércio Lda" },
              { label: "NIF", val: nif, set: setNif, ph: "123456789" },
              { label: "Endereço", val: endereco, set: setEndereco, ph: "Luanda, Angola" },
              { label: "Telefone", val: telefone, set: setTelefone, ph: "+244 9XX XXX XXX" },
            ].map(({ label, val, set, ph }) => (
              <View key={label} style={styles.fieldWrap}>
                <Text style={styles.fl}>{label}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={ph}
                  placeholderTextColor={colors.textMuted}
                  value={val}
                  onChangeText={set}
                />
              </View>
            ))}
          </View>

          {/* Secção: Conta */}
          <Text style={styles.sectionTitle}>Conta</Text>
          <View style={styles.card}>
            <View style={styles.fieldWrap}>
              <Text style={styles.fl}>Email</Text>
              <View style={styles.inputDisabled}>
                <Text style={{ color: colors.textMuted, fontSize: 14 }}>{email}</Text>
              </View>
            </View>
          </View>

          {/* Secção: Faturação */}
          <Text style={styles.sectionTitle}>Faturação</Text>
          <View style={styles.card}>
            <View style={styles.fieldWrap}>
              <Text style={styles.fl}>Taxa IVA (%)</Text>
              <TextInput
                style={styles.input}
                placeholder="14"
                placeholderTextColor={colors.textMuted}
                value={ivaRate}
                onChangeText={setIvaRate}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Info app */}
          <Text style={styles.sectionTitle}>Informação</Text>
          <View style={styles.card}>
            {[
              ["Aplicação", "Aldina Gest"],
              ["Versão", "1.0.0"],
              ["País", "Angola"],
              ["Moeda", "Kwanza (AOA)"],
            ].map(([k, v]) => (
              <View key={k} style={styles.infoRow}>
                <Text style={styles.infoKey}>{k}</Text>
                <Text style={styles.infoVal}>{v}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={save}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <FloppyDisk size={18} color={colors.white} weight="bold" />
                <Text style={styles.saveBtnText}>Guardar Alterações</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: "row", alignItems: "center", padding: spacing.xl, gap: 12 },
  backBtn: { padding: 4 },
  sectionTitle: { ...typography.label, marginHorizontal: spacing.xl, marginBottom: spacing.sm, marginTop: spacing.xl },
  card: { backgroundColor: colors.bgCard, borderRadius: radius.lg, marginHorizontal: spacing.xl, padding: spacing.xl, borderWidth: 1, borderColor: colors.border },
  fieldWrap: { marginBottom: spacing.md },
  fl: { ...typography.label, marginBottom: 6 },
  input: { backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 11, color: colors.textPrimary, fontSize: 14 },
  inputDisabled: { backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 11 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border },
  infoKey: { ...typography.caption },
  infoVal: { color: colors.textPrimary, fontSize: 13, fontWeight: "600" },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    padding: 14,
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
    shadowColor: colors.accent,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  saveBtnText: { color: colors.white, fontWeight: "700", fontSize: 15 },
});
