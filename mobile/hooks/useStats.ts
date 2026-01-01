import {
  getRanking,
  getUser,
  getUsersRanking,
  getWeeklyLeagueRanking,
} from "@/api/users";
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

  const { session, appUser } = useSession();
  const { username, totalSyncSeconds } = appUser;

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
  const [usersRanking, setUsersRanking] = useState<Array<{
    username: string;
    total_duration: number;
    country: string | null;
    region: string | null;
    subregion: string | null;
  }> | null>(null);
  const [weeklyLeagueRanking, setWeeklyLeagueRanking] = useState<Array<{
    username: string;
    total_duration: number;
    country: string | null;
    region: string | null;
    subregion: string | null;
  }> | null>(null);

  useEffect(() => {
    const initialize = async () => {
      if (session && username) {
        const rankingData = await getUsersRanking();
        setUsersRanking(rankingData ?? null);

        const weeklyData = await getWeeklyLeagueRanking();
        setWeeklyLeagueRanking(weeklyData ?? null);

        const world = await getRanking(null, username);
        setRankingWorld(world);

        if (appUser.country) {
          const country = await getRanking(
            { column: "country", value: appUser.country },
            username,
          );
          setRankingCountry(country);
        }

        if (appUser.region) {
          const region = await getRanking(
            { column: "region", value: appUser.region },
            username,
          );
          setRankingRegion(region);
        }

        if (appUser.subregion) {
          const department = await getRanking(
            { column: "subregion", value: appUser.subregion },
            username,
          );
          setRankingDepartment(department);
        }
      }
    };

    initialize();
  }, [session, appUser.country, appUser.region, appUser.subregion]);

  return {
    user: appUser,
    rankingWorld,
    rankingCountry,
    rankingRegion,
    rankingDepartment,
    totalSyncSeconds,
    usersRanking,
    weeklyLeagueRanking,
    openExternalLink,
  };
};
