import { globalStyles } from "@/styles/global.styles";
import { View, Text, TextInput, Switch } from "react-native";
import { COLORS } from "shared/theme";
import ModernButton from "../ui/ModernButton";
import { useState } from "react";
import { useTeam } from "@/hooks/useTeam";

export default function CreateTeam() {
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const { createTeam } = useTeam();

  return (
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
  );
}
