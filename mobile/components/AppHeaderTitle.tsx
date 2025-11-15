import { headerStyles } from "@/styles/custom.styles";
import { Text, View, Image } from "react-native";
import { PROJECT } from "shared/config";

export function AppHeaderTitle() {
  return (
    <View
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
      }}
    >
      <Image
        source={require("../assets/images/icon.png")}
        style={{ width: 40, height: 40 }} // expo-image a besoin d'un size
      />
      <Text style={headerStyles.headerTitle}>
        {PROJECT.TITLE.toUpperCase()}
      </Text>
    </View>
  );
}
