import { ScrollView, View, Text } from "react-native";
import { Button, Switch } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { globalStyles } from "@/styles/global.styles";
import { COLORS, SIZES } from "shared/theme";
import { STORAGE_KEYS } from "@/constants/Labels";
import { useEffect, useState } from "react";
import { confirmDialog } from "@/utils/formatNotification";
import { PayPalButton } from "@/components/PayPalButton";

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const loadPrefs = async () => {
    const n = await AsyncStorage.getItem(STORAGE_KEYS.PREF_NOTIFICATIONS);
    setNotificationsEnabled(n ? JSON.parse(n) : false);
  };

  const savePref = async (key: string, value: boolean) => {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  };

  const resetOfflinePeriods = async () => {
    const confirm = await confirmDialog(
      "Êtes-vous sûr de vouloir supprimer les périodes hors ligne locales ?",
    );
    if (!confirm) return;
    await AsyncStorage.removeItem(STORAGE_KEYS.OFFLINE_PERIODS);
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
        <Text style={globalStyles.cardTitle}>Expérience utilisateur</Text>
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
      </View>

      <View style={globalStyles.card}>
        <Text style={globalStyles.cardTitle}>Soutenir le projet</Text>
        <PayPalButton />
      </View>

      <Button
        mode="contained"
        onPress={async () => await resetOfflinePeriods()}
        buttonColor={COLORS.danger}
        style={globalStyles.button}
      >
        Supprimer les périodes hors ligne locales
      </Button>
    </ScrollView>
  );
}
