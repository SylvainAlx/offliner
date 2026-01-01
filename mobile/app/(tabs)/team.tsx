import ModernButton from "@/components/ui/ModernButton";
import { useTeam } from "@/hooks/useTeam";
import { globalStyles } from "@/styles/global.styles";
import { useSession } from "@/contexts/SessionContext";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { COLORS } from "shared/theme";
import CreateTeam from "@/components/sections/CreateTeam";
import JoinTeam from "@/components/sections/JoinTeam";
import MyTeam from "@/components/sections/MyTeam";

export default function TeamScreen() {
  const { team, loading, refreshTeam, showTeams } = useTeam();
  const { appUser } = useSession();

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
        <MyTeam team={team} user={appUser} />
      ) : (
        <>
          <JoinTeam />
          <CreateTeam />
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
