import { StyleProp, TextStyle, OpaqueColorValue } from "react-native";
import { SymbolWeight } from "expo-symbols";

// --- Import des packs d'icônes disponibles ---
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Ionicons from "@expo/vector-icons/Ionicons";
import Feather from "@expo/vector-icons/Feather";

type IconLibrary = "MaterialIcons" | "FontAwesome5" | "Ionicons" | "Feather";

// Mapping partiel pour n’ajouter que les symboles utiles
type IconMapping = Record<
  string, // ✅ autorise n’importe quelle clé
  { name: string; lib: IconLibrary }
>;

const MAPPING: IconMapping = {
  "house.fill": { name: "home", lib: "MaterialIcons" },
  "paperplane.fill": { name: "send", lib: "MaterialIcons" },
  "chevron.left.forwardslash.chevron.right": {
    name: "code",
    lib: "MaterialIcons",
  },
  "chevron.right": { name: "chevron-right", lib: "MaterialIcons" },
  "person.crop.circle": { name: "person", lib: "MaterialIcons" },
  clock: { name: "history", lib: "MaterialIcons" },
  "medal.fill": { name: "leaderboard", lib: "MaterialIcons" },
  "questionmark.circle": { name: "help", lib: "MaterialIcons" },
  "checklist.checked": { name: "checklist", lib: "MaterialIcons" },
  diamond: { name: "diamond", lib: "MaterialIcons" },
};

type IconSymbolName = keyof typeof MAPPING;

// Sélecteur de bibliothèque
function getIconComponent(lib: IconLibrary) {
  switch (lib) {
    case "MaterialIcons":
      return MaterialIcons;
    case "FontAwesome5":
      return FontAwesome5;
    case "Ionicons":
      return Ionicons;
    case "Feather":
      return Feather;
    default:
      return MaterialIcons;
  }
}

// --- Composant principal ---
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  const mapping = MAPPING[name];
  const IconComponent = mapping ? getIconComponent(mapping.lib) : MaterialIcons;
  const iconName = mapping?.name || "help-outline";

  return (
    <IconComponent
      name={iconName as any}
      size={size}
      color={color}
      style={style}
    />
  );
}
