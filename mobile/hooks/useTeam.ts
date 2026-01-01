import {
  createTeam,
  deleteTeam,
  deleteTeamMember,
  getTeamMembers,
  getUserTeam,
  joinTeamByInviteCode,
  leaveTeam,
  transferTeamOwnership,
  updateTeam,
} from "@/api/teams";
import { config } from "@/config/env";
import { useSession } from "@/contexts/SessionContext";
import { Team, TeamMember } from "@/types/team";
import { showMessage } from "@/utils/formatNotification";
import { useEffect, useState } from "react";
import { Linking } from "react-native";

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

  const handleUpdateTeam = async (params: {
    name?: string;
    description?: string;
    isPrivate?: boolean;
  }) => {
    try {
      setLoading(true);
      await updateTeam(params);
      showMessage("Équipe mise à jour avec succès !", "success", "Succès");
      await fetchTeam();
    } catch (e: any) {
      console.error(e);
      showMessage(
        e.message || "Erreur lors de la mise à jour",
        "error",
        "Erreur",
      );
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

  const handleDeleteTeamMember = async (userId: string) => {
    try {
      setLoading(true);
      await deleteTeamMember(userId);
      showMessage("Membre supprimé avec succès !", "success", "Succès");
      await fetchTeamMembers();
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

  const handleShowDetails = (teamId: string) => {
    let link = config.websiteUrl;
    link = link + "/teams/" + teamId;
    Linking.openURL(link);
  };

  const handleShowTeams = () => {
    let link = config.websiteUrl;
    link = link + "/ranking#teams";
    Linking.openURL(link);
  };

  return {
    team,
    setTeam,
    loading,
    createTeam: handleCreateTeam,
    updateTeam: handleUpdateTeam,
    joinTeam: handleJoinTeam,
    leaveTeam: handleLeaveTeam,
    deleteTeam: handleDeleteTeam,
    deleteTeamMember: handleDeleteTeamMember,
    transferOwnership: handleTransferOwnership,
    refreshTeam: fetchTeam,
    members,
    showDetails: handleShowDetails,
    showTeams: handleShowTeams,
  };
};
