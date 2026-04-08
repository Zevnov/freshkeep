import { colors, radius } from "@/constants/theme";
import type { ItemScope } from "@/types";
import { StyleSheet, Text, View } from "react-native";

export function ScopePill({ scope }: { scope: ItemScope }) {
  const ours = scope === "ours";
  return (
    <View style={[styles.wrap, { backgroundColor: ours ? colors.oursBg : colors.mineBg }]}>
      <Text style={[styles.text, { color: ours ? colors.ours : colors.mine }]}>{ours ? "Ours" : "My"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 11,
    fontWeight: "600",
  },
});
