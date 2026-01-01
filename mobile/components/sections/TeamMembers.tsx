import { Team, TeamMember } from "@/types/team";
import { useTeam } from "@/hooks/useTeam";
import { globalStyles } from "@/styles/global.styles";
import { confirmDialog } from "@/utils/formatNotification";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS, SIZES } from "shared/theme";
import { IconSymbol } from "../ui/IconSymbol";
import { OfflinerUser } from "@/types/user";
import UserList from "../UserList";

interface TeamMembersProps {
  team: Team;
  members: TeamMember[];
  user: OfflinerUser | null;
}

export default function TeamMembers({ team, members, user }: TeamMembersProps) {
  const { deleteTeamMember, transferOwnership } = useTeam();

  const handleDeleteTeamMember = async (memberId: string) => {
    const confirmed = await confirmDialog(
      "Voulez-vous vraiment supprimer ce membre de l'équipe ? Cette action est irréversible.",
    );
    if (confirmed) {
      await deleteTeamMember(memberId);
    }
  };

  const handleTransfer = async (memberId: string, memberName: string) => {
    const confirmed = await confirmDialog(
      `Voulez-vous vraiment transférer la propriété de l'équipe à ${memberName} ? Cette action est irréversible.`,
    );
    if (confirmed) {
      await transferOwnership(memberId);
    }
  };

  return (
    <View style={{ width: "100%", marginVertical: 10 }}>
      <Text
        style={[globalStyles.cardTitle, { fontSize: 16, marginBottom: 10 }]}
      >
        Membres ({members.length})
      </Text>

      <UserList<TeamMember>
        data={members}
        isCurrentUser={(member: TeamMember) => member.id === user?.id}
        renderUsername={(member: TeamMember) => (
          <Text
            style={[
              styles.usernameText,
              member.id === user?.id && styles.currentUserText,
            ]}
          >
            {member.username || "Utilisateur sans nom"}
            {member.id === team.owner_id && " (Propriétaire)"}
            {member.id === user?.id && " (Vous)"}
          </Text>
        )}
        renderRight={(member: TeamMember) =>
          team.owner_id === user?.id &&
          member.id !== user?.id && (
            <View style={{ flexDirection: "row" }}>
              <TouchableOpacity
                onPress={() =>
                  handleTransfer(
                    member.id,
                    member.username || "cet utilisateur",
                  )
                }
                style={{ padding: 5 }}
              >
                <IconSymbol
                  name="giveOwnership"
                  size={20}
                  color={COLORS.warning}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteTeamMember(member.id)}
                style={{ padding: 5 }}
              >
                <IconSymbol name="delete" size={20} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  usernameText: {
    fontSize: SIZES.text_md,
    color: COLORS.text,
    fontFamily: "Montserrat",
  },
  currentUserText: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
});
