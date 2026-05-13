import { radius, spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Redirect, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type FruitKind = "strawberry" | "lemon" | "banana" | "orange" | "grapes" | "blueberry" | "apricot";

function showAuthError(message: string) {
  if (Platform.OS === "web") window.alert(message);
  else Alert.alert("Google sign-in failed", message);
}

function Fruit({ kind, style }: { kind: FruitKind; style?: ViewStyle }) {
  if (kind === "strawberry") {
    return (
      <View style={[styles.fruit, style]}>
        <View style={styles.strawberryLeaf} />
        <View style={styles.strawberry}>
          <View style={[styles.seed, { top: 8, left: 10 }]} />
          <View style={[styles.seed, { top: 14, right: 9 }]} />
          <View style={[styles.seed, { top: 24, left: 17 }]} />
        </View>
      </View>
    );
  }

  if (kind === "banana") {
    return (
      <View style={[styles.fruit, style]}>
        <View style={styles.bananaShadow} />
        <View style={styles.banana} />
        <View style={styles.bananaStem} />
      </View>
    );
  }

  if (kind === "orange") {
    return (
      <View style={[styles.fruit, style]}>
        <View style={styles.orangeLeaf} />
        <View style={styles.orange} />
      </View>
    );
  }

  if (kind === "grapes" || kind === "blueberry") {
    const grapeColor = kind === "grapes" ? "#8255C7" : "#465BB5";
    const grapeDark = kind === "grapes" ? "#6942AA" : "#334A9D";
    return (
      <View style={[styles.fruit, style]}>
        <View style={[styles.grape, { backgroundColor: grapeColor, top: 0, left: 14 }]} />
        <View style={[styles.grape, { backgroundColor: grapeDark, top: 10, left: 0 }]} />
        <View style={[styles.grape, { backgroundColor: grapeColor, top: 12, left: 26 }]} />
        <View style={[styles.grape, { backgroundColor: grapeColor, top: 24, left: 10 }]} />
        <View style={[styles.grape, { backgroundColor: grapeDark, top: 27, left: 23 }]} />
        <View style={[styles.grapeStem, { borderLeftColor: kind === "grapes" ? "#5F9B45" : "#31508E" }]} />
      </View>
    );
  }

  if (kind === "apricot") {
    return (
      <View style={[styles.fruit, style]}>
        <View style={styles.apricotLeaf} />
        <View style={styles.apricot}>
          <View style={styles.apricotLine} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.fruit, style]}>
      <View style={styles.lemonLeaf} />
      <View style={styles.lemon} />
    </View>
  );
}

function Sparkle({ style, color = "#F8D350" }: { style?: ViewStyle; color?: string }) {
  return (
    <View style={[styles.sparkle, style]}>
      <Text style={[styles.sparkleText, { color }]}>✦</Text>
    </View>
  );
}

export default function StartScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { configured, user, loading, signInWithGoogle } = useAuth();
  const [googleBusy, setGoogleBusy] = useState(false);
  const serifFamily = Platform.OS === "ios" ? "Georgia" : "serif";
  const themedStyles = useMemo(
    () =>
      StyleSheet.create({
        root: { backgroundColor: colors.bg },
        title: { color: colors.text },
        subtitle: { color: colors.textMuted },
      }),
    [colors]
  );

  if (!configured) return <Redirect href="/setup" />;
  if (user) return <Redirect href="/(tabs)" />;

  if (loading) {
    return (
      <View style={[styles.center, themedStyles.root]}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  async function onGooglePress() {
    setGoogleBusy(true);
    const { error } = await signInWithGoogle();
    setGoogleBusy(false);
    if (error) showAuthError(error.message);
  }

  return (
    <View style={[styles.root, themedStyles.root, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 18 }]}>
      <View pointerEvents="none" style={styles.decorLayer}>
        <View style={[styles.blob, styles.peachBlob]} />
        <View style={[styles.blob, styles.lavenderBlob]} />
        <View style={[styles.blob, styles.pinkBlob]} />
        <View style={[styles.blob, styles.greenBlob]} />
        <View style={[styles.sunBadge, { backgroundColor: colors.yellow }]} />
        <Fruit kind="strawberry" style={styles.strawberryPos} />
        <Fruit kind="banana" style={styles.bananaPos} />
        <Fruit kind="lemon" style={styles.lemonLeftPos} />
        <Fruit kind="grapes" style={styles.grapesPos} />
        <Fruit kind="blueberry" style={styles.blueberryPos} />
        <Fruit kind="apricot" style={styles.apricotPos} />
        <Fruit kind="orange" style={styles.orangePos} />
        <Fruit kind="lemon" style={styles.lemonRightPos} />
        <Sparkle style={styles.sparkleTop} />
        <Sparkle style={styles.sparkleSun} color="#9886E4" />
        <Sparkle style={styles.sparkleMid} color="#E99095" />
        <Sparkle style={styles.sparkleLeft} color="#A6DCA7" />
        <Sparkle style={styles.sparkleBottom} color="#83C293" />
        <View style={styles.squiggle}>
          <Text style={styles.squiggleText}>⌁⌁</Text>
        </View>
      </View>

      <View style={styles.hero}>
        <View style={[styles.pill, { backgroundColor: colors.bandBg.fresh }]}>
          <Text style={[styles.pillText, { color: colors.bandText.fresh }]}>Eat me first</Text>
        </View>
        <Text style={[styles.brandTitle, themedStyles.title]}>
          FreshKeep{"\n"}
          <Text style={[styles.brandItalic, { fontFamily: serifFamily }]}>kitchen.</Text>
        </Text>
        <Text style={[styles.subtitle, themedStyles.subtitle]}>
          Track what spoils first. Share with{"\n"}family. Waste less.
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign in"
          style={({ pressed }) => [styles.primaryButton, { backgroundColor: colors.brandBtn }, pressed && styles.pressed]}
          onPress={() => router.push("/(auth)/login")}
        >
          <Text style={styles.primaryButtonText}>Sign in</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Create account"
          style={({ pressed }) => [
            styles.secondaryButton,
            { borderColor: colors.text, backgroundColor: colors.surface },
            pressed && styles.pressed,
          ]}
          onPress={() => router.push("/(auth)/signup")}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Create account</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Continue with Google"
          style={({ pressed }) => [
            styles.googleButton,
            { borderColor: colors.border, backgroundColor: colors.surface },
            pressed && styles.pressed,
            googleBusy && styles.disabled,
          ]}
          disabled={googleBusy}
          onPress={() => void onGooglePress()}
        >
          {googleBusy ? (
            <ActivityIndicator color={colors.brand} />
          ) : (
            <>
              <Text style={styles.googleMark}>G</Text>
              <Text style={[styles.googleButtonText, { color: colors.text }]}>Continue with Google</Text>
            </>
          )}
        </Pressable>

        <Text style={[styles.footer, themedStyles.subtitle]}>By continuing you agree to our Terms & Privacy.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: "hidden",
    paddingHorizontal: spacing.lg,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  decorLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  blob: {
    position: "absolute",
    opacity: 0.82,
  },
  peachBlob: {
    top: -50,
    left: -34,
    width: 164,
    height: 164,
    borderRadius: 82,
    backgroundColor: "#FFD8BE",
  },
  lavenderBlob: {
    top: 90,
    right: -66,
    width: 162,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#DDD0FF",
  },
  pinkBlob: {
    top: 238,
    left: -84,
    width: 164,
    height: 126,
    borderRadius: 72,
    backgroundColor: "#F9D1D8",
  },
  greenBlob: {
    right: -36,
    bottom: 354,
    width: 142,
    height: 142,
    borderRadius: 71,
    backgroundColor: "#D8EFD2",
  },
  sunBadge: {
    position: "absolute",
    top: 48,
    right: 60,
    width: 62,
    height: 62,
    borderRadius: 31,
    opacity: 0.82,
  },
  hero: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 112,
  },
  pill: {
    borderRadius: radius.pill,
    paddingHorizontal: 13,
    paddingVertical: 6,
    marginBottom: 18,
    transform: [{ rotate: "-4deg" }],
  },
  pillText: {
    fontSize: 12,
    fontWeight: "700",
  },
  brandTitle: {
    fontSize: 44,
    lineHeight: 47,
    fontWeight: "800",
    letterSpacing: -1.8,
    textAlign: "center",
  },
  brandItalic: {
    fontSize: 39,
    fontStyle: "italic",
    fontWeight: "400",
    letterSpacing: -1.2,
  },
  subtitle: {
    marginTop: 20,
    fontSize: 16,
    lineHeight: 23,
    textAlign: "center",
  },
  actions: {
    gap: 11,
    paddingBottom: 2,
  },
  primaryButton: {
    minHeight: 51,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    minHeight: 51,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
  googleButton: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 12,
  },
  googleMark: {
    color: "#4285F4",
    fontSize: 20,
    fontWeight: "800",
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
  footer: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 12,
  },
  pressed: {
    opacity: 0.82,
  },
  disabled: {
    opacity: 0.65,
  },
  fruit: {
    position: "absolute",
    width: 54,
    height: 54,
  },
  strawberryPos: { top: 78, left: 42, transform: [{ rotate: "-10deg" }] },
  bananaPos: { top: 142, right: 48, transform: [{ rotate: "-8deg" }] },
  lemonLeftPos: { top: 238, left: 40, transform: [{ rotate: "-18deg" }] },
  grapesPos: { top: 354, left: 46 },
  blueberryPos: { top: 356, right: 42, transform: [{ rotate: "8deg" }] },
  apricotPos: { bottom: 292, left: 42, transform: [{ rotate: "12deg" }] },
  orangePos: { top: 226, right: 48 },
  lemonRightPos: { bottom: 286, right: 42, transform: [{ rotate: "-6deg" }] },
  strawberry: {
    position: "absolute",
    left: 9,
    top: 9,
    width: 34,
    height: 42,
    borderRadius: 18,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    backgroundColor: "#F45345",
    transform: [{ scaleX: 0.86 }],
  },
  strawberryLeaf: {
    position: "absolute",
    left: 12,
    top: 2,
    width: 26,
    height: 11,
    borderRadius: 12,
    backgroundColor: "#5FAA43",
    transform: [{ rotate: "-12deg" }],
  },
  seed: {
    position: "absolute",
    width: 4,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFD8B4",
  },
  bananaShadow: {
    position: "absolute",
    left: 4,
    top: 17,
    width: 46,
    height: 23,
    borderRadius: 24,
    backgroundColor: "#D4A50A",
    transform: [{ rotate: "-13deg" }],
  },
  banana: {
    position: "absolute",
    left: 6,
    top: 14,
    width: 48,
    height: 24,
    borderRadius: 24,
    backgroundColor: "#FFE124",
    transform: [{ rotate: "-13deg" }],
  },
  bananaStem: {
    position: "absolute",
    left: 2,
    top: 31,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#6D5032",
  },
  orange: {
    position: "absolute",
    left: 7,
    top: 9,
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: "#FF8421",
  },
  orangeLeaf: {
    position: "absolute",
    left: 24,
    top: 3,
    width: 14,
    height: 8,
    borderRadius: 10,
    backgroundColor: "#57A940",
    transform: [{ rotate: "38deg" }],
  },
  lemon: {
    position: "absolute",
    left: 8,
    top: 12,
    width: 40,
    height: 40,
    borderRadius: 22,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 12,
    backgroundColor: "#FFC928",
    transform: [{ rotate: "-14deg" }],
  },
  lemonLeaf: {
    position: "absolute",
    left: 26,
    top: 8,
    width: 20,
    height: 8,
    borderRadius: 10,
    backgroundColor: "#89C83F",
    transform: [{ rotate: "42deg" }],
  },
  grape: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  grapeStem: {
    position: "absolute",
    left: 23,
    top: -2,
    width: 10,
    height: 13,
    borderLeftWidth: 3,
    borderRadius: 4,
    transform: [{ rotate: "26deg" }],
  },
  apricot: {
    position: "absolute",
    left: 8,
    top: 8,
    width: 40,
    height: 47,
    borderRadius: 22,
    backgroundColor: "#FF966C",
    transform: [{ rotate: "10deg" }],
  },
  apricotLeaf: {
    position: "absolute",
    left: 24,
    top: 3,
    width: 15,
    height: 9,
    borderRadius: 9,
    backgroundColor: "#67AE52",
    transform: [{ rotate: "38deg" }],
  },
  apricotLine: {
    position: "absolute",
    left: 19,
    top: 7,
    width: 2,
    height: 34,
    borderRadius: 2,
    backgroundColor: "rgba(216,97,61,0.36)",
    transform: [{ rotate: "8deg" }],
  },
  sparkle: {
    position: "absolute",
  },
  sparkleText: {
    fontSize: 22,
    fontWeight: "700",
  },
  sparkleTop: { top: 112, left: 139 },
  sparkleSun: { top: 69, right: 96 },
  sparkleMid: { top: 294, left: 160 },
  sparkleLeft: { top: 406, left: 102 },
  sparkleBottom: { bottom: 332, left: 142 },
  squiggle: {
    position: "absolute",
    bottom: 218,
    alignSelf: "center",
  },
  squiggleText: {
    color: "#69A85B",
    fontSize: 31,
    letterSpacing: -6,
    fontWeight: "700",
  },
});
