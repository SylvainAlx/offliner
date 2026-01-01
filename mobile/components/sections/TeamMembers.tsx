import { Team, TeamMember } from "@/types/team";
import { useTeam } from "@/hooks/useTeam";
import { globalStyles } from "@/styles/global.styles";
import { confirmDialog } from "@/utils/formatNotification";
import { View, Text, TouchableOpacity } from "react-native";
import { COLORS } from "shared/theme";
import { IconSymbol } from "../ui/IconSymbol";
import { OfflinerUser } from "@/types/user";

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
      {members.map((member, i) => (
        <View
          key={i}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingVertical: 8,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.border,
          }}
        >
          <Text style={globalStyles.contentText}>
            {member.username || "Utilisateur sans nom"}
            {member.id === team.owner_id && " (Propriétaire)"}
            {member.id === user?.id && " (Vous)"}
          </Text>

          {team.owner_id === user?.id && member.id !== user?.id && (
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
          )}
        </View>
      ))}
    </View>
  );
}
