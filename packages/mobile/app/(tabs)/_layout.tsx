import { Tabs } from "expo-router";
import { colors } from "../../lib/theme";
import {
  HouseSimple,
  Invoice,
  ShoppingCartSimple,
  Users,
  DotsThree,
} from "phosphor-react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bgCard,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Início",
          tabBarIcon: ({ color, size }) => (
            <HouseSimple size={size} color={color} weight="fill" />
          ),
        }}
      />
      <Tabs.Screen
        name="faturas"
        options={{
          title: "Faturas",
          tabBarIcon: ({ color, size }) => (
            <Invoice size={size} color={color} weight="fill" />
          ),
        }}
      />
      <Tabs.Screen
        name="pos"
        options={{
          title: "Venda",
          tabBarIcon: ({ color, size }) => (
            <ShoppingCartSimple size={size} color={color} weight="fill" />
          ),
        }}
      />
      <Tabs.Screen
        name="clientes"
        options={{
          title: "Clientes",
          tabBarIcon: ({ color, size }) => (
            <Users size={size} color={color} weight="fill" />
          ),
        }}
      />
      <Tabs.Screen
        name="mais"
        options={{
          title: "Mais",
          tabBarIcon: ({ color, size }) => (
            <DotsThree size={size} color={color} weight="bold" />
          ),
        }}
      />
    </Tabs>
  );
}
