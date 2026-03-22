import { COLORS } from "@/constants/colors";
import { StyleSheet, Text, View } from "react-native";

export default function FoodScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🥗</Text>
      <Text style={styles.title}>Jedlo & Kalórie</Text>
      <Text style={styles.sub}>Tu bude kalorický denník</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
  },
  emoji: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: "700", color: COLORS.purple },
  sub: { fontSize: 14, color: COLORS.textLight, marginTop: 6 },
});
