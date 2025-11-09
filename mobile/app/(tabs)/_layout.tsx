import { AppHeaderTitle } from "@/components/AppHeaderTitle";
import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { COLORS } from "shared/theme";
import { router, Tabs, usePathname } from "expo-router";
import React from "react";
import { Platform, Pressable, View } from "react-native";
import { useOfflineProgress } from "@/contexts/OfflineProgressContext";
import { useSession } from "@/contexts/SessionContext";

export default function TabLayout() {
  const pathname = usePathname();
  const { username } = useSession();
  const { isOnline } = useOfflineProgress();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitle: () => <AppHeaderTitle />,
        headerTitleAlign: "left",
        tabBarButton: HapticTab,
        tabBarActiveTintColor: COLORS.secondary, // Couleur des icônes actives
        tabBarInactiveTintColor: COLORS.accent, // Couleur des icônes inactives
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: "absolute",
          },
          default: {
            backgroundColor: COLORS.tabs,
            borderTopWidth: 0, // enlève la bordure en haut du footer
            elevation: 0, // enlève l’ombre sur Android
          },
        }),
        sceneStyle: { backgroundColor: COLORS.background },
        headerStyle: {
          backgroundColor: COLORS.tabs,
        },
        headerShadowVisible: false, // enlève la bordure du header sur iOS
        headerTitleStyle: {
          fontWeight: "bold",
          fontSize: 18,
        },
        headerRight: () => {
          const isProfile = pathname === "/profile";
          const isAbout = pathname === "/about";

          return (
            <View style={{ flexDirection: "row", gap: 12, marginRight: 16 }}>
              <Pressable
                onPress={() => router.push("/stats")}
                hitSlop={8}
                disabled={!isOnline || !username}
                accessibilityLabel="Le classement"
              >
                {({ pressed }) => (
                  <IconSymbol
                    name="trophy"
                    size={20}
                    color={
                      pressed
                        ? COLORS.secondary
                        : !isOnline || !username
                        ? COLORS.card
                        : COLORS.accent
                    }
                  />
                )}
              </Pressable>
              <Pressable
                onPress={() => router.push("/about")}
                hitSlop={8}
                accessibilityLabel="A propos"
              >
                {({ pressed }) => (
                  <IconSymbol
                    name="questionmark.circle"
                    size={24}
                    color={
                      pressed || isAbout ? COLORS.secondary : COLORS.accent
                    }
                  />
                )}
              </Pressable>
              {/* Bouton profil */}
              <Pressable
                onPress={() => router.push("/profile")}
                hitSlop={8}
                disabled={!isOnline}
                accessibilityLabel="Aller au profil"
              >
                {({ pressed }) => (
                  <IconSymbol
                    name="person.crop.circle"
                    size={24}
                    color={
                      pressed || isProfile
                        ? COLORS.secondary
                        : !isOnline
                        ? COLORS.card
                        : COLORS.accent
                    }
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
            <IconSymbol name="checklist.checked" color={color} size={28} />
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
        name="about"
        options={{
          href: null,
          title: "About",
        }}
      />
      <Tabs.Screen
        name="legals"
        options={{
          href: null,
          title: "Legals",
        }}
      />
      <Tabs.Screen
        name="help"
        options={{
          href: null,
          title: "help",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
          title: "Profil",
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          href: null,
          title: "Stats",
        }}
      />
    </Tabs>
  );
}
