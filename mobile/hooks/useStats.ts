import { getGemRanking, getRanking, getUser } from "@/api/users";
import { config } from "@/config/env";
import { useSession } from "@/contexts/SessionContext";
import { useEffect, useState } from "react";
import { Linking } from "react-native";

export const useStats = () => {
  const openExternalLink = () => {
    let link = config.websiteUrl;
    link = link + "/ranking";
    Linking.openURL(link);
  };

  const { username, session, totalSyncSeconds } = useSession();

  const [user, setUser] = useState<{
    country: string | null;
    region: string | null;
    subregion: string | null;
  } | null>(null);
  const [rankingWorld, setRankingWorld] = useState<{
    rank: number;
    total: number;
  } | null>(null);
  const [rankingCountry, setRankingCountry] = useState<{
    rank: number;
    total: number;
  } | null>(null);
  const [rankingRegion, setRankingRegion] = useState<{
    rank: number;
    total: number;
  } | null>(null);
  const [rankingDepartment, setRankingDepartment] = useState<{
    rank: number;
    total: number;
  } | null>(null);
  const [gemRanking, setGemRanking] = useState<{
    rank: number;
    total: number;
  } | null>(null);

  useEffect(() => {
    const initialize = async () => {
      if (session && username) {
        const userdata = await getUser(session);
        setUser(userdata);

        const gemData = await getGemRanking(null, username);
        setGemRanking(gemData);

        const world = await getRanking(null, username);
        setRankingWorld(world);

        if (userdata?.country) {
          const country = await getRanking(
            { column: "country", value: userdata.country },
            username,
          );
          setRankingCountry(country);
        }

        if (userdata?.region) {
          const region = await getRanking(
            { column: "region", value: userdata.region },
            username,
          );
          setRankingRegion(region);
        }

        if (userdata?.subregion) {
          const department = await getRanking(
            { column: "subregion", value: userdata.subregion },
            username,
          );
          setRankingDepartment(department);
        }
      }
    };

    initialize();
  }, [session, username]);

  return {
    user,
    username,
    gemRanking,
    rankingWorld,
    rankingCountry,
    rankingRegion,
    rankingDepartment,
    totalSyncSeconds,
    openExternalLink,
  };
};
