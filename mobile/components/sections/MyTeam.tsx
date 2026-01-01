import { globalStyles } from "@/styles/global.styles";
import { View, Text, TouchableOpacity } from "react-native";
import EditTeam from "./EditTeam";
import TeamMembers from "./TeamMembers";
import DigitDisplay from "../ui/DigitDisplay";
import { COLORS, SIZES } from "shared/theme";
import ModernButton from "../ui/ModernButton";
import { Team } from "@/types/team";
import { useState } from "react";
import { IconSymbol } from "../ui/IconSymbol";
import { useTeam } from "@/hooks/useTeam";
import { confirmDialog } from "@/utils/formatNotification";
import { OfflinerUser } from "@/types/user";

interface MyTeamProps {
  team: Team;
  user: OfflinerUser | null;
}

export default function MyTeam({ team, user }: MyTeamProps) {
  const { members, showDetails, leaveTeam, deleteTeam } = useTeam();
  const [isEditing, setIsEditing] = useState(false);

  const handeLeave = async () => {
    if (user?.isTeamOwner) {
      if (members.length > 1) {
        await confirmDialog(
          "Vous ne pouvez pas quitter l'équipe car vous en êtes le propriétaire. Veuillez transférer la propriété avant de quitter.",
        );
        return;
      }
    }
    const confirmed = await confirmDialog(
      "Voulez-vous vraiment quitter l'équipe ? Cette action est irréversible.",
    );
    if (confirmed) {
      await leaveTeam();
    }
  };

  const handleDeleteTeam = async () => {
    const confirmed = await confirmDialog(
      "Voulez-vous vraiment supprimer l'équipe ? Cette action est irréversible.",
    );
    if (confirmed) {
      await deleteTeam();
    }
  };

  return (
    <View style={globalStyles.card}>
      {isEditing ? (
        <EditTeam team={team} setIsEditing={setIsEditing} />
      ) : (
        <>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
            }}
          >
            <Text
              style={{
                fontSize: SIZES.text_xl,
                fontWeight: "bold",
                color: COLORS.primary,
                flex: 1,
              }}
            >
              {team.name}
            </Text>
            {user?.isTeamOwner && (
              <TouchableOpacity onPress={() => setIsEditing(true)}>
                <IconSymbol name="edit" size={24} color={COLORS.primary} />
              </TouchableOpacity>
            )}
          </View>
          {team.description && (
            <Text style={globalStyles.contentText}>{team.description}</Text>
          )}
        </>
      )}
      {(!team.is_private || user?.isTeamOwner) && (
        <View
          style={{
            paddingVertical: 10,
            alignItems: "center",
            width: "100%",
            gap: 10,
          }}
        >
          <DigitDisplay
            color={COLORS.accent}
            digit={team.invite_code || "N/A"}
            label="Code d'invitation"
            copyable
          />
        </View>
      )}
      <TeamMembers team={team} members={members} user={user} />
      {user?.isTeamOwner ? (
        <ModernButton variant="danger" onPress={handleDeleteTeam} icon="delete">
          Supprimer l&apos;équipe
        </ModernButton>
      ) : (
        <ModernButton variant="danger" onPress={handeLeave} icon="logout">
          Quitter l&apos;équipe
        </ModernButton>
      )}
      <ModernButton
        variant="secondary"
        onPress={() => showDetails(team.id)}
        icon="open-in-new"
      >
        Voir les détails de l&apos;équipe
      </ModernButton>
    </View>
  );
}
