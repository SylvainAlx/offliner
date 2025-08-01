// geonames.ts
import { STORAGE_KEYS } from "@/constants/Labels";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { z } from "zod";

const CountrySchema = z.object({
  geonameId: z.number(),
  countryName: z.string(),
});

const SubdivisionSchema = z.object({
  geonameId: z.number(),
  name: z.string(),
});

const username = process.env.EXPO_PUBLIC_GEONAMES_USERNAME || "demo";

export type Country = z.infer<typeof CountrySchema>;
export type Subdivision = z.infer<typeof SubdivisionSchema>;

export async function getCountries(): Promise<Country[]> {
  try {
    const response = await fetch(
      `https://secure.geonames.org/countryInfoJSON?username=${username}`
    );

    const json = await response.json();

    if (!response.ok || !json.geonames) {
      throw new Error(json.status?.message || "Failed to fetch countries");
    }

    return z.array(CountrySchema).parse(json.geonames);
  } catch (error) {
    console.error("❌ getCountries error:", error);
    return [];
  }
}

export const getRegions = async (countryName: string) => {
  const countries = await getCountries();
  const country = countries.find((c) => c.countryName === countryName);
  if (!country) return [];
  const regionList = await getSubdivisions(country.geonameId);
  if (!regionList) return [];
  await AsyncStorage.setItem(STORAGE_KEYS.REGIONS, JSON.stringify(regionList));
  return regionList;
};

export async function getSubdivisions(
  geonameId: number
): Promise<Subdivision[]> {
  try {
    const response = await fetch(
      `https://secure.geonames.org/childrenJSON?geonameId=${geonameId}&username=${username}`
    );

    const json = await response.json();

    if (!response.ok || !json.geonames) {
      throw new Error(json.status?.message || "Failed to fetch subdivisions");
    }

    return z.array(SubdivisionSchema).parse(json.geonames);
  } catch (error) {
    console.error(
      `❌ getSubdivisions error for geonameId ${geonameId}:`,
      error
    );
    return [];
  }
}

export type TreeNode = {
  name: string;
  geonameId: number;
  children?: TreeNode[];
};

export const buildCountryTreeByName = async (
  countryName: string
): Promise<TreeNode | null> => {
  try {
    const countries = await getCountries();
    const country = countries.find((c) => c.countryName === countryName);
    if (!country) {
      console.warn(`❌ Pays "${countryName}" introuvable.`);
      return null;
    }

    const countryNode: TreeNode = {
      name: country.countryName,
      geonameId: country.geonameId,
      children: [],
    };

    const regions = await getSubdivisions(country.geonameId);
    for (const region of regions) {
      const regionNode: TreeNode = {
        name: region.name,
        geonameId: region.geonameId,
        children: [],
      };

      const subregions = await getSubdivisions(region.geonameId);
      regionNode.children = subregions.map((sub) => ({
        name: sub.name,
        geonameId: sub.geonameId,
      }));

      countryNode.children?.push(regionNode);
    }

    // ✅ Enregistrement dans AsyncStorage
    const key = `country_tree:${countryName}`;
    await AsyncStorage.setItem(key, JSON.stringify(countryNode));
    console.log(`✅ Tree pour "${countryName}" sauvegardé dans AsyncStorage.`);

    return countryNode;
  } catch (error) {
    console.error(
      `❌ Erreur lors de la génération du tree pour ${countryName}:`,
      error
    );
    return null;
  }
};

export const loadCountryTreeFromStorage = async (
  countryName: string
): Promise<TreeNode | null> => {
  try {
    const key = `country_tree:${countryName}`;
    const stored = await AsyncStorage.getItem(key);
    if (!stored) return null;

    const tree: TreeNode = JSON.parse(stored);
    return tree;
  } catch (error) {
    console.error(
      `❌ Erreur lors du chargement du tree depuis le storage (${countryName}) :`,
      error
    );
    return null;
  }
};
