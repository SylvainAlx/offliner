import { getUser } from "@/api/users";
import { getAndUpdateLocalDevice } from "@/services/devices";
import { getTeamMembers, getUserTeam } from "@/api/teams";
import { showMessage } from "@/utils/formatNotification";
import { supabase } from "@/utils/supabase";
import { Session } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";
import { OfflinerUser } from "@/types/user";

type SessionContextType = {
  session: Session | null;
  appUser: OfflinerUser;
  updateAppUser: (updates: Partial<OfflinerUser>) => void;
};

const defaultUser = new OfflinerUser();

const SessionContext = createContext<SessionContextType>({
  session: null,
  appUser: defaultUser,
  updateAppUser: () => {},
});

export const SessionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [appUser, setAppUser] = useState<OfflinerUser>(defaultUser);

  const updateAppUser = (updates: Partial<OfflinerUser>) => {
    setAppUser((prev) => prev.update(updates));
  };

  async function getProfile() {
    try {
      if (!session) {
        setAppUser(new OfflinerUser());
        return;
      }
      const data = await getUser(session);
      if (data) {
        let team = null;
        if (data.team_id) {
          team = await getUserTeam(session.user.id);
          if (team) {
            const members = await getTeamMembers(team.id);
            team.members = members as any;
          }
        }

        updateAppUser({
          id: session.user.id,
          username: data.username,
          country: data.country,
          region: data.region,
          subregion: data.subregion,
          gemBalance: data.gem_balance,
          dailyGoalSeconds: data.daily_goal_seconds,
          team_id: data.team_id,
          team: team,
        });
      }
      const device = await getAndUpdateLocalDevice(session);
      updateAppUser({ deviceName: device });
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

  return (
    <SessionContext.Provider
      value={{
        session,
        appUser,
        updateAppUser,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => useContext(SessionContext);
