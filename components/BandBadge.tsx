import { colors, radius } from "@/constants/theme";
import type { FreshnessBand } from "@/types";
import { bandLabel } from "@/lib/spoil";
import { StyleSheet, Text, View } from "react-native";

const bandColors: Record<FreshnessBand, string> = {
  fresh: colors.fresh,
  soon: colors.soon,
  today: colors.today,
  overdue: colors.overdue,
};

export function BandBadge({ band }: { band: FreshnessBand }) {
  return (
    <View style={[styles.wrap, { borderColor: bandColors[band] }]}>
      <Text style={[styles.text, { color: bandColors[band] }]}>{bandLabel(band)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
  },
});
