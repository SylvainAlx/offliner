import { AppHeaderTitle } from "@/components/AppHeaderTitle";
import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { COLORS } from "@/constants/Theme";
import { router, Tabs, usePathname } from "expo-router";
import React from "react";
import { Platform, Pressable } from "react-native";

export default function TabLayout() {
  const pathname = usePathname();
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitle: () => <AppHeaderTitle />,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: COLORS.accent, // Couleur des icônes actives
        tabBarInactiveTintColor: COLORS.border, // Couleur des icônes inactives
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: "absolute",
          },
          default: {
            backgroundColor: COLORS.tabs,
          },
        }),
        headerStyle: {
          backgroundColor: COLORS.tabs,
        },
        headerTitleStyle: {
          fontWeight: "bold",
          fontSize: 18,
        },
        headerRight: () => {
          const isActive = pathname === "/profile"; // ou "/(tabs)/profile" selon ton structure

          return (
            <Pressable
              onPress={() => router.push("/profile")}
              style={{ marginRight: 16 }}
              hitSlop={8}
              accessibilityLabel="Aller au profil"
            >
              {({ pressed }) => (
                <IconSymbol
                  name="person.crop.circle"
                  size={24}
                  color={pressed || isActive ? COLORS.accent : COLORS.border}
                />
              )}
            </Pressable>
          );
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Accueil",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: "Objectifs",
          tabBarIcon: ({ color }) => (
            <IconSymbol name="trophy.fill" color={color} size={28} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "Historique",
          tabBarIcon: ({ color }) => (
            <IconSymbol name="clock" color={color} size={28} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
          title: "Profil",
          tabBarIcon: ({ color }) => (
            <IconSymbol name="person.crop.circle" color={color} size={28} />
          ),
        }}
      />
    </Tabs>
  );
}
