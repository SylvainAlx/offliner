import { COLORS } from "shared/theme";
import { globalStyles } from "@/styles/global.styles";
import { Picker } from "@react-native-picker/picker";
import { ScrollView, Text, View } from "react-native";
import { TextInput } from "react-native-paper";
import { Session } from "@supabase/supabase-js";
import { useAccount } from "@/hooks/useAccount";
import PickerInput from "./PickerInput";
import ModernButton from "./ui/ModernButton";

export default function Account({ session }: { session: Session }) {
  const {
    loading,
    username,
    deviceName,
    setUsername,
    country,
    region,
    subregion,
    setSubregion,
    countries,
    regions,
    subregions,
    handleCountryChange,
    handleRegionChange,
    updateProfile,
    handleLogout,
    handleDeleteAccount,
  } = useAccount(session);

  return (
    <ScrollView contentContainerStyle={globalStyles.container}>
      <Text style={globalStyles.title}>Mon compte</Text>
      <View style={globalStyles.card}>
        <View
          style={[
            globalStyles.verticallySpaced,
            { display: "flex", flexDirection: "column", gap: "4" },
          ]}
        >
          <TextInput
            label="E-mail"
            value={session?.user?.email}
            disabled
            style={globalStyles.input}
            textColor={COLORS.card}
          />
          <TextInput
            label="Nom d'utilisateur"
            value={username || ""}
            onChangeText={setUsername}
            style={globalStyles.input}
            textColor={COLORS.text}
          />
          <TextInput
            label="Appareil"
            value={deviceName || ""}
            style={globalStyles.input}
            textColor={COLORS.card}
            disabled
          />

          <PickerInput
            enabled={true}
            value={country}
            handleChange={handleCountryChange}
            label="Pays"
            selectLabel="Sélectionner un pays"
            itemList={countries.map((country) => (
              <Picker.Item
                key={country.geonameId}
                label={country.countryName}
                value={country.countryName}
              />
            ))}
          />
          <PickerInput
            enabled={regions.length > 0 || country !== null}
            value={region}
            handleChange={handleRegionChange}
            label="Région"
            selectLabel="Sélectionner une région"
            itemList={regions.map((region) => (
              <Picker.Item
                key={region.geonameId}
                label={region.name}
                value={region.name}
              />
            ))}
          />
          <PickerInput
            enabled={subregions.length > 0}
            value={subregion}
            handleChange={setSubregion}
            label="Département"
            selectLabel="Sélectionner un département"
            itemList={subregions.map((sub) => (
              <Picker.Item
                key={sub.geonameId}
                label={sub.name}
                value={sub.name}
              />
            ))}
          />
        </View>

        <View>
          <ModernButton
            variant="secondary"
            onPress={() => updateProfile({ username: username ?? "" })}
            disabled={loading}
            loading={loading}
            icon="update"
          >
            Mettre à jour
          </ModernButton>

          <ModernButton variant="warning" onPress={handleLogout} icon="logout">
            Se déconnecter
          </ModernButton>

          <ModernButton
            variant="danger"
            onPress={handleDeleteAccount}
            icon="delete"
          >
            Supprimer le compte
          </ModernButton>
        </View>
      </View>
    </ScrollView>
  );
}
