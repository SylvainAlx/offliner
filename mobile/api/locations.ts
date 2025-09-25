// geonames.ts
import { config } from "@/config/env";
import { STORAGE_KEYS } from "@/constants/Labels";
import { showMessage } from "@/utils/formatNotification";
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

const username = config.geonamesUsername;

export type Country = z.infer<typeof CountrySchema>;
export type Subdivision = z.infer<typeof SubdivisionSchema>;

const verifyGeonamesUsername = () => {
  if (!username) {
    throw new Error(
      "Le nom d'utilisateur Geonames n'est pas configuré dans les variables d'environnement (EXPO_PUBLIC_GEONAMES_USERNAME).",
    );
  }
};

const verifyGeonamesResponse = async (response: Response) => {
  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    const textResponse = await response.text();
    console.error("Geonames API did not return JSON:", textResponse);
    throw new Error(
      "L'API Geonames n'a pas retourné une réponse JSON. Le compte est peut-être surchargé.",
    );
  }
};

export async function getCountries(): Promise<Country[]> {
  try {
    verifyGeonamesUsername();
    const countriesFromStorage = await AsyncStorage.getItem(
      STORAGE_KEYS.COUNTRIES,
    );
    if (countriesFromStorage) {
      return z.array(CountrySchema).parse(JSON.parse(countriesFromStorage));
    }
    const response = await fetch(
      `https://secure.geonames.org/countryInfoJSON?username=${username}`,
    );
    verifyGeonamesResponse(response);

    const json = await response.json();

    if (!response.ok || !json.geonames) {
      throw new Error(
        json.status?.message || "Impossible de récupérer les pays.",
      );
    }
    // ✅ Enregistrement dans AsyncStorage
    await AsyncStorage.setItem(
      STORAGE_KEYS.COUNTRIES,
      JSON.stringify(json.geonames),
    );
    return z.array(CountrySchema).parse(json.geonames);
  } catch (error) {
    if (error instanceof Error) {
      showMessage(error.message, "error", "Erreur");
    }
    return [];
  }
}

export async function getSubdivisions(
  geonameId: number,
): Promise<Subdivision[]> {
  try {
    verifyGeonamesUsername();
    const response = await fetch(
      `https://secure.geonames.org/childrenJSON?geonameId=${geonameId}&username=${username}`,
    );
    verifyGeonamesResponse(response);

    const json = await response.json();

    if (!response.ok || !json.geonames) {
      throw new Error(
        json.status?.message || "Impossible de récupérer les régions",
      );
    }

    return z.array(SubdivisionSchema).parse(json.geonames);
  } catch (error) {
    if (error instanceof Error) {
      showMessage(error.message, "error", "Erreur");
    }
    return [];
  }
}

type TreeNode = {
  name: string;
  geonameId: number;
  children?: TreeNode[];
};

export const buildCountryTreeByName = async (
  countryName: string,
): Promise<TreeNode | null> => {
  try {
    const countries = await getCountries();
    const country = countries.find((c) => c.countryName === countryName);
    if (!country) {
      showMessage(`❌ Pays "${countryName}" introuvable.`, "error", "Erreur");
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

    return countryNode;
  } catch (error) {
    console.error(
      `❌ Erreur lors de la génération du tree pour ${countryName}:`,
      error,
    );
    if (error instanceof Error) {
      showMessage(error.message, "error", "Erreur");
    }
    return null;
  }
};

export const loadCountryTreeFromStorage = async (
  countryName: string,
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
      error,
    );
    if (error instanceof Error) {
      showMessage(error.message, "error", "Erreur");
    }
    return null;
  }
};
