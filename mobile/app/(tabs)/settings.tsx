import { ScrollView, View, Text } from "react-native";
import { Switch } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { globalStyles } from "@/styles/global.styles";
import { COLORS, SIZES } from "shared/theme";
import { STORAGE_KEYS } from "@/constants/Labels";
import { useEffect, useState } from "react";
import { PayPalButton } from "@/components/PayPalButton";
import ModernButton from "@/components/ui/ModernButton";
import { resetOfflinePeriods } from "@/services/offlineStorage";

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const loadPrefs = async () => {
    const n = await AsyncStorage.getItem(STORAGE_KEYS.PREF_NOTIFICATIONS);
    setNotificationsEnabled(n ? JSON.parse(n) : false);
  };

  const savePref = async (key: string, value: boolean) => {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  };

  useEffect(() => {
    loadPrefs();
  }, []);

  return (
    <ScrollView
      contentContainerStyle={globalStyles.container}
      showsVerticalScrollIndicator
    >
      <Text style={globalStyles.title}>Paramètres de l&apos;application</Text>

      <View style={globalStyles.card}>
        <Text style={globalStyles.cardTitle}>Paramètres locaux</Text>
        <View style={{ width: "100%", paddingHorizontal: SIZES.padding }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginVertical: SIZES.margin / 2,
            }}
          >
            <Text style={globalStyles.contentText}>Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={async (v) => {
                setNotificationsEnabled(v);
                await savePref(STORAGE_KEYS.PREF_NOTIFICATIONS, v);
              }}
              color={COLORS.secondary}
            />
          </View>
        </View>
        <ModernButton
          variant="danger"
          onPress={async () => await resetOfflinePeriods()}
          icon="delete-forever"
        >
          Supprimer les périodes locales
        </ModernButton>
      </View>

      <View style={globalStyles.card}>
        <Text style={globalStyles.cardTitle}>Soutenir le projet</Text>
        <PayPalButton />
      </View>
    </ScrollView>
  );
}
