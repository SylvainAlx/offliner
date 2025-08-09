import { COLORS, SIZES } from "shared/theme";
import { globalStyles } from "@/styles/global.styles";
import { Picker } from "@react-native-picker/picker";
import { Button, Input } from "@rneui/themed";
import { Session } from "@supabase/supabase-js";
import { ScrollView, Text, View } from "react-native";
import { useAccount } from "@/hooks/useAccount";
import { accountStyles } from "@/styles/custom.styles";

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

        <View
          style={[
            globalStyles.verticallySpaced,
            { paddingHorizontal: SIZES.padding },
          ]}
        >
          <Text style={accountStyles.label}>Pays</Text>
          <Picker
            style={globalStyles.input}
            selectedValue={country || ""}
            onValueChange={handleCountryChange}
          >
            <Picker.Item label="Sélectionner un pays" value="" />
            {countries.map((country) => (
              <Picker.Item
                key={country.geonameId}
                label={country.countryName}
                value={country.countryName}
              />
            ))}
          </Picker>
        </View>

        <View
          style={[
            globalStyles.verticallySpaced,
            { paddingHorizontal: SIZES.padding },
          ]}
        >
          <Text style={accountStyles.label}>Région</Text>
          <Picker
            style={globalStyles.input}
            selectedValue={region || ""}
            onValueChange={handleRegionChange}
            enabled={regions.length > 0 || country !== null}
          >
            <Picker.Item label="Sélectionner une région" value="" />
            {regions.map((region) => (
              <Picker.Item
                key={region.geonameId}
                label={region.name}
                value={region.name}
              />
            ))}
          </Picker>
        </View>

        <View
          style={[
            globalStyles.verticallySpaced,
            { paddingHorizontal: SIZES.padding },
          ]}
        >
          <Text style={accountStyles.label}>Sous-région</Text>
          <Picker
            style={globalStyles.input}
            selectedValue={subregion || ""}
            onValueChange={setSubregion}
            enabled={subregions.length > 0}
          >
            <Picker.Item label="Sélectionner une sous-région" value="" />
            {subregions.map((sub) => (
              <Picker.Item
                key={sub.geonameId}
                label={sub.name}
                value={sub.name}
              />
            ))}
          </Picker>
        </View>

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
