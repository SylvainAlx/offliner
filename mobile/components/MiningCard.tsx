import { IconSymbol } from "@/components/ui/IconSymbol";
import UseMining from "@/hooks/useMining";
import { globalStyles } from "@/styles/global.styles";
import { ActivityIndicator, Text, View } from "react-native";
import { COLORS } from "shared/theme";
import { Link, router } from "expo-router";
import { Button } from "react-native-paper";
import DigitDisplay from "./DigitDisplay";
import { countMinutesFromSeconds } from "shared/utils/formatDuration";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { STORAGE_KEYS } from "@/constants/Labels";

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

  const gemAvailable = countMinutesFromSeconds(dailySyncSeconds);

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
        color={COLORS.accent}
        digit={totalGem.toString()}
        label="gemmes minées"
      />
      {miningCapacity === null ? (
        <ActivityIndicator />
      ) : (
        <DigitDisplay
          color={COLORS.accent}
          digit={miningCapacity.toString()}
          label="gemmes dans la mine"
        />
      )}
      {dailySyncSeconds === null ? (
        <ActivityIndicator />
      ) : (
        <>
          <DigitDisplay
            color={
              miningAvailable
                ? gemAvailable > 0
                  ? COLORS.succes
                  : COLORS.accent
                : COLORS.dark
            }
            digit={gemAvailable.toString()}
            label="Gemmes à miner aujourd'hui"
          />
          {dailySyncSeconds === 0 && (
            <Text style={{ color: COLORS.warning }}>
              Aucune durée n&apos;a été synchronisée aujourd&apos;hui
            </Text>
          )}
          <Button
            mode="contained"
            onPress={async () => await mineGem(gemAvailable)}
            disabled={
              !session || !isOnline || !miningAvailable || gemAvailable === 0
            }
            buttonColor={isOnline ? COLORS.secondary : COLORS.dark}
            style={globalStyles.button}
          >
            Miner
          </Button>
          {/* <Button
            mode="contained"
            onPress={async () =>
              await AsyncStorage.removeItem(STORAGE_KEYS.LAST_GEM_MINE_SYNC)
            }
            buttonColor={COLORS.danger}
            style={globalStyles.button}
          >
            Vider
          </Button> */}
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
          {lastMineSync && lastMineSync.getDate() === new Date().getDate() && (
            <>
              <Text style={globalStyles.contentText}>
                C&apos;est tout pour aujourd&apos;hui !
              </Text>
            </>
          )}
        </>
      )}
    </View>
  );
}
