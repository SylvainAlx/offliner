import { getLatestDeviceNameByUserId } from "@/api/devices";
import { getRanking, getUser } from "@/api/users";
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
  const [devices, setDevices] = useState<string | null>(null);

  useEffect(() => {
    const initialize = async () => {
      if (session && username) {
        const userdata = await getUser(session);
        setUser(userdata);

        if (user) {
          const latestDevice = await getLatestDeviceNameByUserId(
            session.user.id,
          );
          setDevices(latestDevice);

          const world = await getRanking(null, username);
          setRankingWorld(world);

          if (user.country) {
            const country = await getRanking(
              { column: "country", value: user.country },
              username,
            );
            setRankingCountry(country);
          }

          if (user.region) {
            const region = await getRanking(
              { column: "region", value: user.region },
              username,
            );
            setRankingRegion(region);
          }

          if (user.subregion) {
            const department = await getRanking(
              { column: "subregion", value: user.subregion },
              username,
            );
            setRankingDepartment(department);
          }
        }
      }
    };

    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, username]);

  return {
    date: session?.user.created_at,
    user,
    username,
    rankingWorld,
    rankingCountry,
    rankingRegion,
    rankingDepartment,
    devices,
    totalSyncSeconds,
    openExternalLink,
  };
};
