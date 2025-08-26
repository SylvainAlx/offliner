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

  const handleLogout = async () => {
    const result = await logout();
    if (result) {
      setUsername("");
      setTotalSyncSeconds(0);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = await deleteAccount();
    if (confirmed) setTotalSyncSeconds(0);
  };

  return {
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
  };
};
