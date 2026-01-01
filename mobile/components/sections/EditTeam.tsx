import { useTeam } from "@/hooks/useTeam";
import { globalStyles } from "@/styles/global.styles";
import { confirmDialog } from "@/utils/formatNotification";
import { View, Switch, Text, TextInput } from "react-native";
import { COLORS } from "shared/theme";
import ModernButton from "../ui/ModernButton";
import { useState } from "react";
import { Team } from "@/types/team";

interface EditTeamProps {
  team: Team;
  setIsEditing: (isEditing: boolean) => void;
}

export default function EditTeam({ team, setIsEditing }: EditTeamProps) {
  const { updateTeam } = useTeam();

  const [teamName, setTeamName] = useState(team.name);
  const [teamDescription, setTeamDescription] = useState(
    team.description || "",
  );
  const [isPrivate, setIsPrivate] = useState(team.is_private);

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

  const isModified =
    teamName !== team.name ||
    teamDescription !== team.description ||
    isPrivate !== team.is_private;

  return (
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
          <ModernButton variant="secondary" onPress={() => setIsEditing(false)}>
            Annuler
          </ModernButton>
        </View>
        <View style={{ flex: 1 }}>
          <ModernButton
            variant="primary"
            onPress={handleSaveUpdate}
            disabled={!isModified}
          >
            Enregistrer
          </ModernButton>
        </View>
      </View>
    </View>
  );
}
