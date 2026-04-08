import { colors } from "@/constants/theme";
import { Switch, Text, TextInput, View } from "react-native";
import { addItemStyles as styles } from "./styles";

type Props = {
  remindMe: boolean;
  onRemindMeChange: (v: boolean) => void;
  remindDays: string;
  onRemindDaysChange: (v: string) => void;
};

export function RemindersSection({ remindMe, onRemindMeChange, remindDays, onRemindDaysChange }: Props) {
  return (
    <>
      <View style={styles.rowBetween}>
        <Text style={styles.label}>Remind me</Text>
        <Switch value={remindMe} onValueChange={onRemindMeChange} />
      </View>
      <Text style={styles.hint}>Days before spoil for “use soon” (0 = use default in Settings)</Text>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        value={remindDays}
        onChangeText={onRemindDaysChange}
        placeholder="0"
        placeholderTextColor={colors.textMuted}
      />
    </>
  );
}
