import { AppHeaderTitle } from "@/components/AppHeaderTitle";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { COLORS, SIZES } from "shared/theme";
import { Drawer } from "expo-router/drawer";
import { DrawerToggleButton } from "@react-navigation/drawer";

import { View, Text } from "react-native";
import { useSession } from "@/contexts/SessionContext";
import { useOfflineProgress } from "@/contexts/OfflineProgressContext";

export default function TabLayout() {
  const { totalGem, session } = useSession();
  const { isOnline } = useOfflineProgress();

  return (
    <Drawer
      screenOptions={{
        headerShown: true,
        headerTitle: () => <AppHeaderTitle />,
        headerTitleAlign: "left",
        drawerPosition: "right",
        drawerActiveTintColor: COLORS.secondary,
        drawerInactiveTintColor: COLORS.accent,
        drawerStyle: {
          backgroundColor: COLORS.tabs,
        },
        sceneStyle: {
          backgroundColor: COLORS.background,
          paddingBottom: SIZES.padding * 5,
        },
        headerStyle: {
          backgroundColor: COLORS.background,
        },
        headerShadowVisible: false,
        headerTitleStyle: {
          fontWeight: "bold",
          fontSize: 18,
        },
        headerLeft: () => null,
        headerRight: () => {
          return (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 2,
                marginRight: 16,
              }}
            >
              <Text
                style={{
                  color: COLORS.primary,
                  fontSize: SIZES.text_xl,
                  fontFamily: "Doto",
                }}
              >
                {totalGem.toString()}
                <IconSymbol
                  name="diamond"
                  size={SIZES.text_lg}
                  color={COLORS.primary}
                />
              </Text>
              <View style={{ transform: [{ scale: 1.6 }] }}>
                <DrawerToggleButton tintColor={COLORS.accent} />
              </View>
            </View>
          );
        },
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          title: "Accueil",
          drawerIcon: ({ color }) => (
            <IconSymbol size={24} name="house.fill" color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="goals"
        options={{
          title: "Objectifs",
          drawerIcon: ({ color }) => (
            <IconSymbol name="checklist.checked" color={color} size={24} />
          ),
        }}
      />
      <Drawer.Screen
        name="history"
        options={{
          title: "Historique",
          drawerIcon: ({ color }) => (
            <IconSymbol name="clock" color={color} size={24} />
          ),
        }}
      />
      <Drawer.Screen
        name="stats"
        listeners={{
          drawerItemPress: (e) => {
            if (!isOnline || !session) e.preventDefault();
          },
        }}
        options={{
          title: "Classement",
          drawerItemStyle: !isOnline || !session ? { opacity: 0.5 } : undefined,
          drawerIcon: ({ color }) => (
            <IconSymbol
              name="trophy"
              color={!isOnline || !session ? COLORS.card : color}
              size={22}
            />
          ),
        }}
      />
      <Drawer.Screen
        name="about"
        options={{
          title: "A propos",
          drawerIcon: ({ color }) => (
            <IconSymbol name="questionmark.circle" color={color} size={22} />
          ),
        }}
      />
      <Drawer.Screen
        name="profile"
        options={{
          title: "Profil",
          drawerIcon: ({ color }) => (
            <IconSymbol name="person.crop.circle" color={color} size={22} />
          ),
        }}
      />
      <Drawer.Screen
        name="legals"
        options={{ drawerItemStyle: { display: "none" }, title: "Legals" }}
      />
      <Drawer.Screen
        name="help"
        options={{ drawerItemStyle: { display: "none" }, title: "help" }}
      />
    </Drawer>
  );
}
