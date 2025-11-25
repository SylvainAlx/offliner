import React, { useRef } from "react";
import {
  Pressable,
  Text,
  ActivityIndicator,
  Animated,
  ViewStyle,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS, SIZES } from "shared/theme";

interface ModernButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  variant?:
    | "primary"
    | "secondary"
    | "accent"
    | "danger"
    | "warning"
    | "text"
    | "outline";
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  fullWidth?: boolean;
  style?: ViewStyle;
}

const BUTTON_VARIANTS = {
  primary: {
    colors: ["#ff89ff", "#ff5fff"] as const,
    textColor: "#ffffff",
    shadowColor: "#ff89ff",
  },
  secondary: {
    colors: ["#00abff", "#0088ff"] as const,
    textColor: "#ffffff",
    shadowColor: "#00abff",
  },
  accent: {
    colors: ["#ffffa8", "#ffff70"] as const,
    textColor: "#222222",
    shadowColor: "#ffffa8",
  },
  danger: {
    colors: ["#D72638", "#EF476F"] as const,
    textColor: "#ffffff",
    shadowColor: "#D72638",
  },
  warning: {
    colors: ["#FFA600", "#FF8800"] as const,
    textColor: "#ffffff",
    shadowColor: "#FFA600",
  },
  text: {
    colors: ["transparent", "transparent"] as const,
    textColor: COLORS.primary,
    shadowColor: "transparent",
  },
  outline: {
    colors: ["transparent", "transparent"] as const,
    textColor: COLORS.primary,
    shadowColor: "transparent",
  },
};

export default function ModernButton({
  onPress,
  children,
  variant = "primary",
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
  style,
}: ModernButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const variantStyle = BUTTON_VARIANTS[variant];

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const isDisabled = disabled || loading;

  return (
    <Animated.View
      style={[
        styles.container,
        fullWidth && styles.fullWidth,
        { transform: [{ scale: scaleAnim }] },
        style,
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        style={({ pressed }) => [
          styles.pressable,
          isDisabled && styles.disabled,
          pressed && styles.pressed,
        ]}
      >
        <LinearGradient
          colors={variantStyle.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.gradient,
            variant === "outline" && styles.outlineGradient,
            variant === "text" && styles.textGradient,
          ]}
        >
          {variant === "outline" && (
            <LinearGradient
              colors={BUTTON_VARIANTS.primary.colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.outlineBorder}
            />
          )}

          {loading ? (
            <ActivityIndicator color={variantStyle.textColor} size="small" />
          ) : (
            <>
              {icon && (
                <MaterialCommunityIcons
                  name={icon}
                  size={20}
                  color={variantStyle.textColor}
                  style={styles.icon}
                />
              )}
              <Text
                style={[
                  styles.text,
                  { color: variantStyle.textColor },
                  isDisabled && styles.disabledText,
                ]}
              >
                {children}
              </Text>
            </>
          )}
        </LinearGradient>
      </Pressable>

      {/* {variant !== "text" && variant !== "outline" && !isDisabled && (
        <LinearGradient
          colors={[variantStyle.shadowColor + "40", "transparent"]}
          style={styles.shadow}
        />
      )} */}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    alignSelf: "center",
    paddingVertical: SIZES.padding,
  },
  fullWidth: {
    alignSelf: "stretch",
  },
  pressable: {
    borderRadius: 100,
    overflow: "hidden",
  },
  gradient: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 48,
  },
  outlineGradient: {
    backgroundColor: "transparent",
    position: "relative",
  },
  textGradient: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  outlineBorder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 100,
    padding: 2,
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Montserrat",
  },
  icon: {
    marginRight: 4,
  },
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.7,
  },
  pressed: {
    opacity: 0.9,
  },
  shadow: {
    position: "absolute",
    bottom: -8,
    left: 8,
    right: 8,
    height: 12,
    borderRadius: 100,
    zIndex: -1,
  },
});
