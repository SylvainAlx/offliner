import NetInfo from "@react-native-community/netinfo";
import React, { useEffect, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

export function ConnectionStatusIndicator() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected && state.isInternetReachable;
      setIsConnected(connected ?? false);

      // Fade in/out animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const backgroundColor =
    isConnected === null ? "gray" : isConnected ? "#007aff" : "#4CAF50";

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={[styles.dot, { backgroundColor }]} />
      {isConnected === false ? (
        <Text style={styles.message}>Déconnecté</Text>
      ) : (
        <Text style={styles.message}>Connecté</Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 60,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 1000,
    backgroundColor: "#ffffffdd",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    maxWidth: "80%",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  message: {
    fontSize: 13,
    color: "#000",
    fontWeight: "500",
  },
});
