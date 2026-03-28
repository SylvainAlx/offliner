import { MaterialIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { Animated, Text, TouchableOpacity,View } from "react-native";
import { COLORS, SIZES } from "shared/theme";

import { showMessage } from "@/utils/formatNotification";

interface DigitDisplayProps {
  digit: string;
  color: Animated.AnimatedInterpolation<string | number> | string;
  label: string;
  copyable?: boolean;
}

export default function DigitDisplay({
  digit,
  color,
  label,
  copyable = false,
}: DigitDisplayProps) {
  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(digit);
    showMessage("Valeur copiée", "success");
  };

  return (
    <View
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "row-reverse",
        backgroundColor: COLORS.background,
        padding: SIZES.padding,
      }}
    >
      <Text
        style={{
          position: "absolute",
          paddingLeft: 5,
          paddingTop: 0.3,
          left: 0,
          fontSize: SIZES.text_md,
          color: COLORS.secondary,
        }}
      >
        {label}
      </Text>
      {copyable && (
        <TouchableOpacity
          onPress={copyToClipboard}
          style={{
            paddingTop: 12,
            paddingLeft: 10,
          }}
        >
          <MaterialIcons
            name="content-copy"
            size={16}
            color={COLORS.secondary}
          />
        </TouchableOpacity>
      )}
      <Animated.Text
        style={{
          paddingTop: 5,
          fontSize: SIZES.text_xl * 1.1,
          fontFamily: "SairaStencilOne",
          color: color,
        }}
      >
        {digit}
      </Animated.Text>
    </View>
  );
}
