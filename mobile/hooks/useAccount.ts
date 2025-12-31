import { deleteAccount, logout } from "@/api/auth";
import {
  buildCountryTreeByName,
  Country,
  getCountries,
  getSubdivisions,
  loadCountryTreeFromStorage,
  Subdivision,
} from "@/api/locations";
import { updateUser } from "@/api/users";
import { useSession } from "@/contexts/SessionContext";
import { confirmDialog, showMessage } from "@/utils/formatNotification";
import { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

export const useAccount = (session: Session) => {
  const [loading, setLoading] = useState(false);
  const { appUser, updateAppUser } = useSession();
  const { username, country, region, subregion } = appUser;

  const [countries, setCountries] = useState<Country[]>([]);
  const [regions, setRegions] = useState<Subdivision[]>([]);
  const [subregions, setSubregions] = useState<Subdivision[]>([]);

  useEffect(() => {
    (async () => {
      if (countries.length === 0) {
        const result = await getCountries();
        setCountries(result);
      }
      if (country) {
        let tree = await loadCountryTreeFromStorage(country);
        if (!tree) {
          tree = await buildCountryTreeByName(country);
        }
        setRegions(tree?.children || []);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, country]);

  useEffect(() => {
    if (!region || !country) return;
    (async () => {
      const regionData = regions.find((r) => r.name === region);
      if (!regionData) return;

      const subregionList = await getSubdivisions(regionData.geonameId);
      setSubregions(subregionList);
    })();
  }, [country, region, regions]);

  const handleCountryChange = async (countryName: string) => {
    updateAppUser({
      country: countryName,
      region: "",
      subregion: "",
    });
    setRegions([]);
    setSubregions([]);

    if (!countryName) return;

    const country = countries.find((c) => c.countryName === countryName);
    if (!country) return;

    const subdivisions = await getSubdivisions(country.geonameId);
    setRegions(subdivisions);
    updateAppUser({ region: subdivisions[0]?.name || "" });
  };

  const handleRegionChange = async (regionName: string) => {
    updateAppUser({ region: regionName });
    const region = regions.find((r) => r.name === regionName);
    if (!region) return;

    const subregionList = await getSubdivisions(region.geonameId);
    setSubregions(subregionList);
    updateAppUser({ subregion: subregionList[0]?.name || "" });
  };

  async function updateProfile({ username }: { username: string }) {
    const confirmed = await confirmDialog("Mettre à jour le profil ?");
    if (!confirmed) return;
    try {
      setLoading(true);
      await updateUser({
        session,
        username: username.trim(),
        country,
        region,
        subregion,
      });
      showMessage("Profil mis à jour avec succès.", "success");
    } catch (error: any) {
      showMessage(
        error?.message || "Une erreur est survenue.",
        "error",
        "Erreur",
      );
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = async () => {
    const result = await logout();
    if (result) {
      updateAppUser({
        username: "",
        totalSyncSeconds: 0,
        weeklySyncSeconds: 0,
        dailySyncSeconds: 0,
      });
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = await deleteAccount();
    if (confirmed) updateAppUser({ totalSyncSeconds: 0 });
  };

  return {
    loading,
    username,
    setUsername: (val: string) => updateAppUser({ username: val }),
    country,
    region,
    subregion,
    setSubregion: (val: string) => updateAppUser({ subregion: val }),
    countries,
    regions,
    subregions,
    handleCountryChange,
    handleRegionChange,
    updateProfile,
    handleLogout,
    handleDeleteAccount,
  };
};
