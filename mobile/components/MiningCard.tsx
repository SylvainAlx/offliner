import { IconSymbol } from "@/components/ui/IconSymbol";
import UseMining from "@/hooks/useMining";
import { globalStyles } from "@/styles/global.styles";
import { ActivityIndicator, Text, View } from "react-native";
import { COLORS } from "shared/theme";
import { Link, router } from "expo-router";
import { Button } from "react-native-paper";
import DigitDisplay from "./DigitDisplay";
import {
  countGemAmountFromSeconds,
  getPercentBeforeNextGem,
} from "shared/utils/formatDuration";
import ModernButton from "./ui/ModernButton";

export default function MiningCard() {
  const {
    miningCapacity,
    dailySyncSeconds,
    lastMineSync,
    miningAvailable,
    session,
    totalGem,
    mineGem,
    isOnline,
  } = UseMining();

  const gemAvailable = countGemAmountFromSeconds(dailySyncSeconds);

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
        label="Gemmes minées"
      />
      {miningCapacity === null ? (
        <ActivityIndicator />
      ) : (
        <DigitDisplay
          color={COLORS.accent}
          digit={miningCapacity.toString()}
          label="Gemmes dans la mine"
        />
      )}
      {dailySyncSeconds === null ? (
        <ActivityIndicator />
      ) : (
        <>
          <DigitDisplay
            color={COLORS.accent}
            digit={
              (getPercentBeforeNextGem(dailySyncSeconds) * 100).toFixed(2) + "%"
            }
            label="Progression avant prochaine gemme"
          />
          <DigitDisplay
            color={
              miningAvailable
                ? gemAvailable > 0
                  ? COLORS.succes
                  : COLORS.accent
                : COLORS.accent
            }
            digit={gemAvailable.toString()}
            label="Gemmes à miner aujourd'hui"
          />
          {dailySyncSeconds === 0 && (
            <Text style={{ color: COLORS.warning }}>
              Aucune durée n&apos;a été synchronisée aujourd&apos;hui
            </Text>
          )}
          <ModernButton
            variant="secondary"
            onPress={async () => await mineGem(gemAvailable)}
            disabled={
              !session || !isOnline || !miningAvailable || gemAvailable === 0
            }
            icon="pickaxe"
          >
            Miner
          </ModernButton>

          {!session && isOnline && (
            <ModernButton
              variant="secondary"
              onPress={() => router.push("/profile")}
            >
              Se connecter
            </ModernButton>
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
