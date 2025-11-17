// contexts/SessionContext.tsx
import { getUser } from "@/api/users";
import { getAndUpdateLocalDevice } from "@/services/devices";
import { showMessage } from "@/utils/formatNotification";
import { supabase } from "@/utils/supabase";
import { Session, User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";
import * as Linking from "expo-linking";
import { router } from "expo-router";

type SessionContextType = {
  session: Session | null;
  user: User | null;
  username: string | null;
  setUsername: (value: string) => void;
  country: string | null;
  region: string | null;
  subregion: string | null;
  setCountry: (value: string) => void;
  setRegion: (value: string) => void;
  setSubregion: (value: string) => void;
  deviceName: string | null;
  totalSyncSeconds: number;
  setTotalSyncSeconds: (value: number) => void;
  weeklySyncSeconds: number;
  setWeeklySyncSeconds: (value: number) => void;
  dailySyncSeconds: number;
  setDailySyncSeconds: (value: number) => void;
  totalGem: number;
  setTotalGem: (value: number) => void;
};

const SessionContext = createContext<SessionContextType>({
  session: null,
  user: null,
  username: null,
  setUsername: () => {},
  country: null,
  region: null,
  subregion: null,
  setCountry: () => {},
  setRegion: () => {},
  setSubregion: () => {},
  deviceName: null,
  totalSyncSeconds: 0,
  setTotalSyncSeconds: () => {},
  weeklySyncSeconds: 0,
  setWeeklySyncSeconds: () => {},
  dailySyncSeconds: 0,
  setDailySyncSeconds: () => {},
  totalGem: 0,
  setTotalGem: () => {},
});

export const SessionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [session, setSession] = useState<Session | null>(null);

  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [region, setRegion] = useState<string | null>(null);
  const [subregion, setSubregion] = useState<string | null>(null);

  const [totalSyncSeconds, setTotalSyncSeconds] = useState<number>(0);
  const [weeklySyncSeconds, setWeeklySyncSeconds] = useState<number>(0);
  const [dailySyncSeconds, setDailySyncSeconds] = useState<number>(0);

  const [totalGem, setTotalGem] = useState<number>(0);

  async function getProfile() {
    try {
      if (!session) return;
      const data = await getUser(session);
      if (data) {
        setUsername(data.username);
        setCountry(data.country);
        setRegion(data.region);
        setSubregion(data.subregion);
        setTotalGem(data.gem_balance);
      }
      const device = await getAndUpdateLocalDevice(session);
      setDeviceName(device);
    } catch (error) {
      if (error instanceof Error) {
        showMessage(error.message, "error", "Erreur");
      }
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      },
    );

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    getProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  useEffect(() => {
    const processResetPasswordUrl = async (url: string) => {
      const { path, queryParams } = Linking.parse(url);

      let accessToken = queryParams?.access_token as string | undefined;
      let refreshToken = queryParams?.refresh_token as string | undefined;

      if (!accessToken || !refreshToken) {
        try {
          const u = new URL(url);
          const hash = u.hash.startsWith("#") ? u.hash.slice(1) : u.hash;
          const params = new URLSearchParams(hash);
          accessToken = params.get("access_token") ?? undefined;
          refreshToken = params.get("refresh_token") ?? undefined;
        } catch {}
      }

      if (path === "reset-password" && accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          console.error("Erreur lors de l'activation de la session", error);
          showMessage(
            "Erreur lors de l'activation de la session",
            "error",
            "Erreur",
          );
          return;
        }

        router.push("/reset-password");
      }
    };

    Linking.getInitialURL().then((url) => {
      if (url) processResetPasswordUrl(url);
    });

    const subscription = Linking.addEventListener("url", ({ url }) =>
      processResetPasswordUrl(url),
    );
    return () => subscription.remove();
  }, []);

  return (
    <SessionContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        username,
        setUsername,
        country,
        setCountry,
        region,
        setRegion,
        subregion,
        setSubregion,
        deviceName,
        totalSyncSeconds,
        setTotalSyncSeconds,
        weeklySyncSeconds,
        setWeeklySyncSeconds,
        dailySyncSeconds,
        setDailySyncSeconds,
        totalGem,
        setTotalGem,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => useContext(SessionContext);
