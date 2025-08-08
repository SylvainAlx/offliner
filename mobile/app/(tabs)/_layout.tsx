import { AppHeaderTitle } from "@/components/AppHeaderTitle";
import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { COLORS } from "shared/theme";
import { router, Tabs, usePathname } from "expo-router";
import React from "react";
import { Linking, Platform, Pressable, View } from "react-native";

export default function TabLayout() {
  const pathname = usePathname();
  const openExternalLink = () => {
    Linking.openURL("https://example.com"); // Remplace par ton URL
  };
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
          const isProfile = pathname === "/profile";

          return (
            <View style={{ flexDirection: "row", gap: 12, marginRight: 16 }}>
              {/* Bouton vers page web externe */}
              <Pressable
                onPress={openExternalLink}
                hitSlop={8}
                accessibilityLabel="Ouvrir la page externe"
              >
                {({ pressed }) => (
                  <IconSymbol
                    name="medal.fill"
                    size={24}
                    color={pressed ? COLORS.accent : COLORS.border}
                  />
                )}
              </Pressable>

              {/* Bouton profil */}
              <Pressable
                onPress={() => router.push("/profile")}
                hitSlop={8}
                accessibilityLabel="Aller au profil"
              >
                {({ pressed }) => (
                  <IconSymbol
                    name="person.crop.circle"
                    size={24}
                    color={pressed || isProfile ? COLORS.accent : COLORS.border}
                  />
                )}
              </Pressable>
            </View>
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
