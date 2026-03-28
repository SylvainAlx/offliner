import { useState } from "react";
import { Text, TextInput,View } from "react-native";
import { COLORS } from "shared/theme";

import { useTeam } from "@/hooks/useTeam";
import { globalStyles } from "@/styles/global.styles";

import ModernButton from "../ui/ModernButton";

export default function JoinTeam() {
  const [inviteCode, setInviteCode] = useState("");
  const { joinTeam } = useTeam();

  return (
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
  );
}
