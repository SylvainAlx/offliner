import { AppHeaderTitle } from "@/components/AppHeaderTitle";
import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { COLORS } from "shared/theme";
import { router, Tabs, usePathname } from "expo-router";
import React from "react";
import { Linking, Platform, Pressable, View } from "react-native";
import { config } from "@/config/env";
import { useSession } from "@/contexts/SessionContext";
import { useOfflineProgress } from "@/contexts/OfflineProgressContext";

export default function TabLayout() {
  const pathname = usePathname();
  const { username } = useSession();
  const { isOnline } = useOfflineProgress();
  const openExternalLink = () => {
    let link = config.websiteUrl;
    if (username) {
      link = link + "/" + username;
    }
    Linking.openURL(link);
  };
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitle: () => <AppHeaderTitle />,
        headerTitleAlign: "center",
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
        headerLeft: () => {
          return (
            <View style={{ flexDirection: "row", gap: 12, marginLeft: 16 }}>
              {/* Bouton vers page web externe */}
              <Pressable
                onPress={openExternalLink}
                hitSlop={8}
                disabled={!isOnline}
                accessibilityLabel="Ouvrir la page externe"
              >
                {({ pressed }) => (
                  <IconSymbol
                    name="medal.fill"
                    size={24}
                    color={
                      pressed
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
        headerRight: () => {
          const isProfile = pathname === "/profile";
          const isAbout = pathname === "/about";

          return (
            <View style={{ flexDirection: "row", gap: 12, marginRight: 16 }}>
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
        name="profile"
        options={{
          href: null,
          title: "Profil",
        }}
      />
    </Tabs>
  );
}
