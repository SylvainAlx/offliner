import { IconSymbol } from "@/components/ui/IconSymbol";
import UseMining from "@/hooks/useMining";
import { globalStyles } from "@/styles/global.styles";
import { ActivityIndicator, Text, View } from "react-native";
import { COLORS } from "shared/theme";
import { Link, router } from "expo-router";
import { Button } from "react-native-paper";
import DigitDisplay from "./DigitDisplay";
import { countHoursFromSeconds } from "shared/utils/formatDuration";

interface MiningCardProps {
  isOnline: boolean;
}

export default function MiningCard({ isOnline }: MiningCardProps) {
  const {
    miningCapacity,
    dailySyncSeconds,
    totalGem,
    lastMineSync,
    miningAvailable,
    session,
    mineGem,
  } = UseMining();
  return (
    <View style={globalStyles.card}>
      <Text style={globalStyles.cardTitle}>
        Minage de gemmes de temps{" "}
        <Link href={"../help"} style={globalStyles.link}>
          <IconSymbol
            name="questionmark.circle"
            size={15}
            color={COLORS.accent}
          />
        </Link>
      </Text>
      <DigitDisplay
        color={COLORS.primary}
        digit={totalGem.toString()}
        label="gemmes minées"
      />
      {miningCapacity === null ? (
        <ActivityIndicator />
      ) : (
        <DigitDisplay
          color={COLORS.primary}
          digit={miningCapacity.toString()}
          label="gemmes dans la mine"
        />
      )}
      {dailySyncSeconds === null ? (
        <ActivityIndicator />
      ) : (
        <>
          <DigitDisplay
            color={COLORS.primary}
            digit={countHoursFromSeconds(dailySyncSeconds).toString()}
            label="Gemmes à miner aujourd'hui"
          />
          <Button
            mode="contained"
            onPress={async () =>
              await mineGem(countHoursFromSeconds(dailySyncSeconds))
            }
            disabled={!session || !isOnline || !miningAvailable}
            buttonColor={isOnline ? COLORS.secondary : COLORS.dark}
            style={globalStyles.button}
          >
            Miner
          </Button>
          {!session && isOnline && (
            <Button
              mode="contained"
              buttonColor={COLORS.secondary}
              style={globalStyles.button}
              onPress={() => router.push("/profile")}
            >
              Se connecter
            </Button>
          )}
          {lastMineSync && (
            <Text style={globalStyles.contentText}>
              Dernier minage :{" "}
              {lastMineSync instanceof Date
                ? lastMineSync.toLocaleString()
                : String(lastMineSync)}
            </Text>
          )}
        </>
      )}
    </View>
  );
}
