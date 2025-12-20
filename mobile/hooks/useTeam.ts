import {
  createTeam,
  deleteTeam,
  getTeamMembers,
  getUserTeam,
  joinTeamByInviteCode,
  leaveTeam,
  Team,
  transferTeamOwnership,
} from "@/api/teams";
import { useSession } from "@/contexts/SessionContext";
import { showMessage } from "@/utils/formatNotification";
import { useEffect, useState } from "react";

export type TeamMember = {
  id: string;
  username: string | null;
  country: string | null;
};

export const useTeam = () => {
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { session } = useSession();
  useEffect(() => {
    fetchTeam();
  }, []);

  useEffect(() => {
    fetchTeamMembers();
  }, [team]);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      if (!session) {
        setTeam(null);
        return;
      }
      const myTeam = await getUserTeam(session.user.id);
      setTeam(myTeam);
    } catch (error) {
      console.error(error);
      showMessage("Erreur lors du chargement de l'équipe", "error", "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      if (!team) {
        setMembers([]);
        return;
      }
      const teamMembers = await getTeamMembers(team.id);
      setMembers(teamMembers as TeamMember[]);
    } catch (error) {
      console.error(error);
      showMessage("Erreur lors du chargement des membres", "error", "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (
    name: string,
    description: string,
    isPrivate: boolean,
  ) => {
    try {
      setLoading(true);
      await createTeam(name, description, isPrivate);
      showMessage("Équipe créée avec succès !", "success", "Succès");
      await fetchTeam();
    } catch (e: any) {
      showMessage(e.message || "Erreur lors de la création", "error", "Erreur");
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTeam = async (code: string) => {
    try {
      setLoading(true);
      await joinTeamByInviteCode(code);
      showMessage("Équipe rejointe avec succès !", "success", "Succès");
      await fetchTeam();
    } catch (e: any) {
      showMessage(e.message || "Erreur lors de l'adhésion", "error", "Erreur");
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveTeam = async () => {
    try {
      setLoading(true);
      await leaveTeam();
      showMessage("Vous avez quitté l'équipe.", "success", "Succès");
      setTeam(null);
    } catch (e: any) {
      showMessage(e.message || "Erreur", "error", "Erreur");
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const handleTransferOwnership = async (newOwnerId: string) => {
    try {
      setLoading(true);
      await transferTeamOwnership(newOwnerId);
      showMessage("Propriété de l'équipe transférée !", "success", "Succès");
      await fetchTeam();
    } catch (e: any) {
      showMessage(e.message || "Erreur lors du transfert", "error", "Erreur");
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeam = async () => {
    try {
      setLoading(true);
      await deleteTeam();
      showMessage("Équipe supprimée avec succès !", "success", "Succès");
      setTeam(null);
    } catch (e: any) {
      showMessage(
        e.message || "Erreur lors de la suppression",
        "error",
        "Erreur",
      );
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return {
    team,
    setTeam,
    loading,
    createTeam: handleCreateTeam,
    joinTeam: handleJoinTeam,
    leaveTeam: handleLeaveTeam,
    deleteTeam: handleDeleteTeam,
    transferOwnership: handleTransferOwnership,
    refreshTeam: fetchTeam,
    members,
  };
};
