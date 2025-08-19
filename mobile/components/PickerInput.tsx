import { accountStyles } from "@/styles/custom.styles";
import { globalStyles } from "@/styles/global.styles";
import { Picker } from "@react-native-picker/picker";
import { ReactNode } from "react";
import { View, Text } from "react-native";
import { SIZES } from "shared/theme";

interface PickerInputProps {
  value: string | null;
  handleChange: ((value: string) => Promise<void>) | ((value: string) => void);
  label: string;
  selectLabel: string;
  itemList: ReactNode;
  enabled: boolean;
}

export default function PickerInput({
  value,
  handleChange,
  label,
  selectLabel,
  itemList,
  enabled,
}: PickerInputProps) {
  return (
    <View
      style={[
        globalStyles.verticallySpaced,
        { paddingHorizontal: SIZES.padding },
      ]}
    >
      <Text style={accountStyles.label}>{label}</Text>
      <Picker
        style={globalStyles.input}
        selectedValue={value || ""}
        onValueChange={handleChange}
        enabled={enabled}
      >
        <Picker.Item label={selectLabel} value="" />
        {itemList}
      </Picker>
    </View>
  );
}
