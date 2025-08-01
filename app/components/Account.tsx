import { deleteAccount, logout } from "@/api/auth";
import { updateUser } from "@/api/users";
import { COLORS, SIZES } from "@/constants/Theme";
import { useSession } from "@/contexts/SessionContext";
import { globalStyles } from "@/styles/global.styles";
import { confirmDialog, showMessage } from "@/utils/formatNotification";
import { Picker } from "@react-native-picker/picker";
import { Button, Input } from "@rneui/themed";
import { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  buildCountryTreeByName,
  Country,
  getCountries,
  getSubdivisions,
  loadCountryTreeFromStorage,
  Subdivision,
} from "@/api/locations";

export default function Account({ session }: { session: Session }) {
  const [loading, setLoading] = useState(false);
  const {
    setTotalSyncSeconds,
    username,
    setUsername,
    country,
    setCountry,
    region,
    setRegion,
    subregion,
    setSubregion,
    deviceName,
  } = useSession();

  const [countries, setCountries] = useState<Country[]>([]);
  const [regions, setRegions] = useState<Subdivision[]>([]);
  const [subregions, setSubregions] = useState<Subdivision[]>([]);

  useEffect(() => {
    (async () => {
      if (!country) {
        const result = await getCountries();
        setCountries(result);
      } else {
        let tree = await loadCountryTreeFromStorage(country);
        if (!tree) {
          tree = await buildCountryTreeByName(country);
          console.log(`✅ Arbre pour "${country}" construit.`);
        } else {
          console.log(`✅ Arbre pour "${country}" chargé depuis AsyncStorage.`);
        }
        setRegions(tree?.children || []);
      }
    })();
  }, [session, country]);

  useEffect(() => {
    if (!region || !country) return;
    (async () => {
      const tree = await loadCountryTreeFromStorage(country);
      const subregionList =
        tree?.children?.find((r) => r.name === region)?.children || [];
      setSubregions(subregionList);
    })();
  }, [country, region]);

  const handleCountryChange = async (countryName: string) => {
    setCountry(countryName);
    setRegion("");
    setSubregion("");
    setRegions([]);
    setSubregions([]);

    if (!countryName) return;

    const country = countries.find((c) => c.countryName === countryName);
    if (!country) return;

    const subdivisions = await getSubdivisions(country.geonameId);
    setRegions(subdivisions);
    setRegion(subdivisions[0]?.name || "");
  };

  const handleRegionChange = async (regionName: string) => {
    setRegion(regionName);
    const region = regions.find((r) => r.name === regionName);
    if (!region) return;

    const subregionList = await getSubdivisions(region.geonameId);
    setSubregions(subregionList);
    setSubregion(subregionList[0]?.name || "");
  };

  async function updateProfile({ username }: { username: string }) {
    const confirmed = await confirmDialog("Mettre à jour le profil ?");
    if (!confirmed) return;
    try {
      setLoading(true);
      await updateUser({
        session,
        username,
        country,
        region,
        subregion,
      });
      showMessage("Profil mis à jour avec succès.");
    } catch (error) {
      if (error instanceof Error) {
        showMessage(error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={globalStyles.container}>
      <View style={globalStyles.card}>
        <Text style={globalStyles.title}>{deviceName}</Text>

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

        <View style={globalStyles.verticallySpaced}>
          <Text style={styles.label}>Pays</Text>
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

        <View style={globalStyles.verticallySpaced}>
          <Text style={styles.label}>Région</Text>
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

        <View style={globalStyles.verticallySpaced}>
          <Text style={styles.label}>Sous-région</Text>
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
            color={COLORS.primary}
            radius={100}
            style={globalStyles.button}
          />
          <Button
            title="Se déconnecter"
            color={COLORS.warning}
            onPress={() => {
              logout();
              setTotalSyncSeconds(0);
            }}
            radius={100}
            style={globalStyles.button}
          />
          <Button
            title="Supprimer le compte"
            color={COLORS.danger}
            onPress={() => {
              deleteAccount();
              setTotalSyncSeconds(0);
            }}
            radius={100}
            style={globalStyles.button}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: COLORS.text,
    fontSize: SIZES.text_lg,
    fontWeight: "bold",
    marginLeft: SIZES.margin,
    marginBottom: SIZES.margin,
  },
});
