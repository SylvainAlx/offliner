// contexts/SessionContext.tsx
import { getUser } from "@/api/users";
import { getAndUpdateLocalDevice } from "@/services/devices";
import { showMessage } from "@/utils/formatNotification";
import { supabase } from "@/utils/supabase";
import { Session, User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";

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

  async function getProfile() {
    try {
      if (!session) return;
      const data = await getUser(session);
      if (data) {
        setUsername(data.username);
        setCountry(data.country);
        setRegion(data.region);
        setSubregion(data.subregion);
      }
      const device = await getAndUpdateLocalDevice(session);
      setDeviceName(device);
    } catch (error) {
      if (error instanceof Error) {
        showMessage(error.message);
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
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => useContext(SessionContext);
