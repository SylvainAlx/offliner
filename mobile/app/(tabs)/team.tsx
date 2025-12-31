import DigitDisplay from "@/components/DigitDisplay";
import ModernButton from "@/components/ui/ModernButton";
import { useTeam } from "@/hooks/useTeam";
import { globalStyles } from "@/styles/global.styles";
import { confirmDialog } from "@/utils/formatNotification";
import { useSession } from "@/contexts/SessionContext";
import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
  TouchableOpacity,
} from "react-native";
import { COLORS, SIZES } from "shared/theme";
import { IconSymbol } from "@/components/ui/IconSymbol";

export default function TeamScreen() {
  const {
    team,
    members,
    loading,
    createTeam,
    joinTeam,
    leaveTeam,
    deleteTeam,
    deleteTeamMember,
    transferOwnership,
    updateTeam,
    refreshTeam,
    showDetails,
    showTeams,
  } = useTeam();
  const { user } = useSession();

  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const handleTransfer = async (memberId: string, memberName: string) => {
    const confirmed = await confirmDialog(
      `Voulez-vous vraiment transférer la propriété de l'équipe à ${memberName} ? Cette action est irréversible.`,
    );
    if (confirmed) {
      await transferOwnership(memberId);
    }
  };

  const handeLeave = async () => {
    if (team?.owner_id === user?.id) {
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

  const handleDeleteTeamMember = async (memberId: string) => {
    const confirmed = await confirmDialog(
      "Voulez-vous vraiment supprimer ce membre de l'équipe ? Cette action est irréversible.",
    );
    if (confirmed) {
      await deleteTeamMember(memberId);
    }
  };

  const handleStartEditing = () => {
    if (team) {
      setTeamName(team.name);
      setTeamDescription(team.description || "");
      setIsPrivate(team.is_private);
      setIsEditing(true);
    }
  };

  const handleSaveUpdate = async () => {
    const confirmed = await confirmDialog(
      "Voulez-vous vraiment modifier l'équipe ?",
    );
    if (!confirmed) return;
    await updateTeam({
      name: teamName,
      description: teamDescription,
      isPrivate: isPrivate,
    });
    setIsEditing(false);
  };

  if (loading) {
    return (
      <View style={[globalStyles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={globalStyles.container}>
      <Text style={globalStyles.title}>Équipe</Text>
      <ModernButton variant="secondary" onPress={refreshTeam} icon="refresh">
        Actualiser
      </ModernButton>
      {team ? (
        <View style={globalStyles.card}>
          {isEditing ? (
            <View style={{ gap: 10, width: "100%" }}>
              <Text style={globalStyles.cardTitle}>Modifier l'équipe</Text>
              <TextInput
                style={[globalStyles.input, { width: "100%" }]}
                placeholder="Nom de l'équipe"
                placeholderTextColor={COLORS.text}
                value={teamName}
                onChangeText={setTeamName}
              />
              <TextInput
                style={[
                  globalStyles.input,
                  {
                    width: "100%",
                    height: 120,
                    textAlignVertical: "top",
                    paddingTop: 10,
                  },
                ]}
                placeholder="Description"
                placeholderTextColor={COLORS.text}
                value={teamDescription}
                onChangeText={setTeamDescription}
                multiline
                numberOfLines={4}
              />
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  marginVertical: 5,
                }}
              >
                <Text style={globalStyles.contentText}>Équipe privée</Text>
                <Switch
                  value={isPrivate}
                  onValueChange={setIsPrivate}
                  trackColor={{ false: COLORS.border, true: COLORS.primary }}
                  thumbColor={"#fff"}
                />
              </View>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <ModernButton
                    variant="secondary"
                    onPress={() => setIsEditing(false)}
                  >
                    Annuler
                  </ModernButton>
                </View>
                <View style={{ flex: 1 }}>
                  <ModernButton
                    variant="primary"
                    onPress={handleSaveUpdate}
                    disabled={!teamName.trim()}
                  >
                    Enregistrer
                  </ModernButton>
                </View>
              </View>
            </View>
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
                {team.owner_id === user?.id && (
                  <TouchableOpacity onPress={handleStartEditing}>
                    <IconSymbol name="edit" size={24} color={COLORS.primary} />
                  </TouchableOpacity>
                )}
              </View>
              {team.description && (
                <Text style={globalStyles.contentText}>{team.description}</Text>
              )}
            </>
          )}
          {(!team.is_private || team.owner_id === user?.id) && (
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
          <View style={{ width: "100%", marginVertical: 10 }}>
            <Text
              style={[
                globalStyles.cardTitle,
                { fontSize: 16, marginBottom: 10 },
              ]}
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
                      <IconSymbol
                        name="delete"
                        size={20}
                        color={COLORS.danger}
                      />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>
          {user?.id !== team.owner_id ? (
            <ModernButton variant="danger" onPress={handeLeave} icon="logout">
              Quitter l&apos;équipe
            </ModernButton>
          ) : (
            <ModernButton
              variant="danger"
              onPress={handleDeleteTeam}
              icon="delete"
            >
              Supprimer l&apos;équipe
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
      ) : (
        <>
          {/* Join Team Section */}
          <View style={globalStyles.card}>
            <Text style={globalStyles.cardTitle}>Rejoindre une équipe</Text>
            <Text style={globalStyles.contentText}>
              Entrez le code d&apos;invitation :
            </Text>
            <TextInput
              style={[globalStyles.input, { width: "100%" }]}
              placeholder="Code d'invitation"
              placeholderTextColor={COLORS.text}
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="none"
            />
            <ModernButton
              variant="secondary"
              onPress={async () => await joinTeam(inviteCode)}
              disabled={!inviteCode.trim()}
              icon="login"
            >
              Rejoindre
            </ModernButton>
          </View>

          {/* Create Team Section */}
          <View style={globalStyles.card}>
            <Text style={globalStyles.cardTitle}>Créer une équipe</Text>

            <TextInput
              style={[globalStyles.input, { width: "100%" }]}
              placeholder="Nom de l'équipe"
              placeholderTextColor={COLORS.text}
              value={teamName}
              onChangeText={setTeamName}
            />

            <TextInput
              style={[
                globalStyles.input,
                {
                  width: "100%",
                  height: 100,
                  textAlignVertical: "top",
                  paddingTop: 10,
                },
              ]}
              placeholder="Description (optionnel)"
              placeholderTextColor={COLORS.text}
              value={teamDescription}
              onChangeText={setTeamDescription}
              multiline
              numberOfLines={3}
            />

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                marginBottom: 10,
              }}
            >
              <Text style={globalStyles.contentText}>Équipe privée</Text>
              <Switch
                value={isPrivate}
                onValueChange={setIsPrivate}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={"#fff"}
              />
            </View>

            <ModernButton
              variant="secondary"
              onPress={async () =>
                await createTeam(teamName, teamDescription, isPrivate)
              }
              disabled={!teamName.trim()}
              icon="plus"
            >
              Créer
            </ModernButton>
          </View>
        </>
      )}
      <ModernButton
        variant="secondary"
        onPress={() => showTeams()}
        icon="open-in-new"
      >
        Voir les équipes
      </ModernButton>
    </ScrollView>
  );
}
