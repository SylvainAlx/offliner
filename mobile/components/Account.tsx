import { COLORS } from "shared/theme";
import { globalStyles } from "@/styles/global.styles";
import { Picker } from "@react-native-picker/picker";
import { Button, Input } from "@rneui/themed";
import { Session } from "@supabase/supabase-js";
import { ScrollView, Text, View } from "react-native";
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
    deviceName,
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
        <Text style={globalStyles.cardTitle}>{deviceName}</Text>

        <View style={globalStyles.verticallySpaced}>
          <Input
            style={globalStyles.input}
            label="E-mail"
            labelStyle={{ color: COLORS.text }}
            value={session?.user?.email}
            disabled
          />
        </View>

        <View style={globalStyles.verticallySpaced}>
          <Input
            style={globalStyles.input}
            label="Nom d'utilisateur"
            labelStyle={{ color: COLORS.text }}
            value={username || ""}
            onChangeText={setUsername}
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
            title={loading ? "Chargement ..." : "Mettre à jour"}
            onPress={() => updateProfile({ username: username ?? "" })}
            disabled={loading}
            color={COLORS.secondary}
            radius={100}
            style={globalStyles.button}
            titleStyle={{ color: COLORS.dark }} // couleur du texte
          />
          <Button
            title="Se déconnecter"
            color={COLORS.warning}
            onPress={handleLogout}
            radius={100}
            style={globalStyles.button}
          />
          <Button
            title="Supprimer le compte"
            color={COLORS.danger}
            onPress={handleDeleteAccount}
            radius={100}
            style={globalStyles.button}
          />
        </View>
      </View>
    </ScrollView>
  );
}
