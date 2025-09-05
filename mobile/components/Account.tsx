import { COLORS } from "shared/theme";
import { globalStyles } from "@/styles/global.styles";
import { Picker } from "@react-native-picker/picker";
import { ScrollView, Text, View } from "react-native";
import { TextInput, Button } from "react-native-paper";
import { Session } from "@supabase/supabase-js";
import { useAccount } from "@/hooks/useAccount";
import PickerInput from "./PickerInput";

export default function Account({ session }: { session: Session }) {
  const {
    loading,
    username,
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
            { display: "flex", flexDirection: "column", gap: "10" },
          ]}
        >
          <TextInput
            label="E-mail"
            value={session?.user?.email}
            disabled
            style={globalStyles.input}
            textColor={COLORS.secondary}
          />
          <TextInput
            label="Nom d'utilisateur"
            value={username || ""}
            onChangeText={setUsername}
            style={globalStyles.input}
            textColor={COLORS.text}
          />
        </View>

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

        <View style={globalStyles.buttonContainer}>
          <Button
            mode="contained"
            onPress={() => updateProfile({ username: username ?? "" })}
            disabled={loading}
            buttonColor={COLORS.secondary}
            style={globalStyles.button}
          >
            {loading ? "Chargement ..." : "Mettre à jour"}
          </Button>

          <Button
            mode="contained"
            onPress={handleLogout}
            buttonColor={COLORS.warning}
            style={globalStyles.button}
          >
            Se déconnecter
          </Button>

          <Button
            mode="contained"
            onPress={handleDeleteAccount}
            buttonColor={COLORS.danger}
            style={globalStyles.button}
          >
            Supprimer le compte
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}
