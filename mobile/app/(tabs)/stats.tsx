import { globalStyles } from "@/styles/global.styles";
import { ScrollView, View, Text } from "react-native";
import { Button } from "react-native-paper";
import { COLORS, SIZES } from "shared/theme";
import { formatDuration } from "shared/utils/formatDuration";
import { useStats } from "@/hooks/useStats";
import { getPowerSavingEstimate } from "shared/utils/powerSaving";

export default function StatsScreen() {
  const {
    date,
    user,
    username,
    rankingWorld,
    rankingCountry,
    rankingRegion,
    rankingDepartment,
    devices,
    totalSyncSeconds,
    openExternalLink,
  } = useStats();

  return (
    <ScrollView
      contentContainerStyle={globalStyles.container}
      showsVerticalScrollIndicator
    >
      <Text style={globalStyles.title}>Statistiques de {username}</Text>
      <Text
        style={{
          color: COLORS.accent,
          fontSize: SIZES.text_lg,
          fontFamily: "Knewave",
          textAlign: "center",
        }}
      >
        Classement
      </Text>
      <View style={globalStyles.buttonContainer}>
        <Button
          mode="contained"
          buttonColor={COLORS.secondary}
          onPress={openExternalLink}
          style={globalStyles.button}
        >
          Consulter le classement général
        </Button>
      </View>
      {rankingWorld && (
        <View style={globalStyles.card}>
          <Text style={globalStyles.cardTitle}>Monde</Text>
          <Text style={globalStyles.contentText}>
            {rankingWorld.rank + (rankingWorld.rank > 1 ? "ème" : "er")}{" "}
            {`sur ${rankingWorld.total} utilisateur(s)`}
          </Text>
        </View>
      )}
      {rankingCountry && user?.country && (
        <View style={globalStyles.card}>
          <Text style={globalStyles.cardTitle}>{user.country}</Text>
          <Text style={globalStyles.contentText}>
            {rankingCountry.rank + (rankingCountry.rank > 1 ? "ème" : "er")}{" "}
            {`sur ${rankingCountry.total} utilisateur(s)`}
          </Text>
        </View>
      )}
      {rankingRegion && user?.region && (
        <View style={globalStyles.card}>
          <Text style={globalStyles.cardTitle}>{user.region}</Text>
          <Text style={globalStyles.contentText}>
            {rankingRegion.rank + (rankingRegion.rank > 1 ? "ème" : "er")}{" "}
            {`sur ${rankingRegion.total} utilisateur(s)`}
          </Text>
        </View>
      )}
      {rankingDepartment && user?.subregion && (
        <View style={globalStyles.card}>
          <Text style={globalStyles.cardTitle}>{user.subregion}</Text>
          <Text style={globalStyles.contentText}>
            {rankingDepartment.rank +
              (rankingDepartment.rank > 1 ? "ème" : "er")}{" "}
            {`sur ${rankingDepartment.total} utilisateur(s)`}
          </Text>
        </View>
      )}

      <Text
        style={{
          color: COLORS.accent,
          fontSize: SIZES.text_lg,
          fontFamily: "Knewave",
          textAlign: "center",
        }}
      >
        Autres informations
      </Text>
      <View style={globalStyles.card}>
        <Text style={globalStyles.cardTitle}>Temps passé hors-ligne</Text>
        <Text style={globalStyles.contentText}>
          {formatDuration(totalSyncSeconds)}
        </Text>
      </View>
      <View style={globalStyles.card}>
        <Text style={globalStyles.cardTitle}>
          Économie d&apos;énergie estimée
        </Text>
        <Text style={globalStyles.contentText}>
          {getPowerSavingEstimate(totalSyncSeconds)}
        </Text>
      </View>
      {devices && (
        <View style={globalStyles.card}>
          <Text style={globalStyles.cardTitle}>Appareil utilisé</Text>
          <Text style={globalStyles.contentText}>{devices}</Text>
        </View>
      )}
      {date && (
        <View style={globalStyles.card}>
          <Text style={globalStyles.cardTitle}>Date d&apos;inscription</Text>
          <Text style={globalStyles.contentText}>
            {new Date(date).toLocaleDateString()}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
