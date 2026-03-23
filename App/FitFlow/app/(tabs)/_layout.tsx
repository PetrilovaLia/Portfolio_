import { COLORS } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";

const { width } = Dimensions.get("window");
const BAR_WIDTH = width - 20;
const TAB_BAR_HEIGHT = 70;
const NOTCH_R = 10;
const TAB_WIDTH = BAR_WIDTH / 4;

const TABS = [
  { name: "cycle", title: "Cycle", icon: "heart" },
  { name: "workout", title: "Workout", icon: "flame" },
  { name: "food", title: "Food", icon: "restaurant" },
  { name: "dashboard", title: "Overview", icon: "bar-chart" },
];

function buildPath(activeIndex: number): string {
  const cx = TAB_WIDTH * activeIndex + TAB_WIDTH / 2;
  const r = NOTCH_R;
  const h = TAB_BAR_HEIGHT;
  const cr = 28;
  const sw = 24;

  const left = Math.max(cr, cx - sw - r);
  const right = Math.min(BAR_WIDTH - cr, cx + sw + r);

  return `
    M ${cr} 0
    L ${left} 0
    Q ${cx - sw} 0 ${cx - r} ${r}
    Q ${cx} ${r * 1.3} ${cx + r} ${r}
    Q ${cx + sw} 0 ${right} 0
    L ${BAR_WIDTH - cr} 0
    Q ${BAR_WIDTH} 0 ${BAR_WIDTH} ${cr}
    L ${BAR_WIDTH} ${h - cr}
    Q ${BAR_WIDTH} ${h} ${BAR_WIDTH - cr} ${h}
    L ${cr} ${h}
    Q 0 ${h} 0 ${h - cr}
    L 0 ${cr}
    Q 0 0 ${cr} 0
    Z
  `;
}

function FloatingTabBar({ state, navigation }: any) {
  const activeIndex = state.index;
  const svgH = TAB_BAR_HEIGHT + NOTCH_R;

  return (
    <View style={styles.wrapper}>
      <View style={{ width: BAR_WIDTH, height: svgH }}>
        <Svg
          width={BAR_WIDTH}
          height={svgH}
          style={StyleSheet.absoluteFillObject}
        >
          <Path
            d={buildPath(activeIndex)}
            fill={COLORS.bgCard}
            translateY={NOTCH_R}
          />
        </Svg>

        <View style={styles.tabsRow}>
          {state.routes.map((route: any, index: number) => {
            const isFocused = state.index === index;
            const tab = TABS[index];

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                style={styles.tab}
                activeOpacity={0.8}
              >
                <View
                  style={[styles.iconWrap, isFocused && styles.iconWrapActive]}
                >
                  <Ionicons
                    name={tab.icon as any}
                    size={22}
                    color={isFocused ? COLORS.white : COLORS.textMuted}
                  />
                </View>
                <Text style={[styles.label, isFocused && styles.labelActive]}>
                  {tab.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <FloatingTabBar {...props} />}
    >
      <Tabs.Screen name="cycle" />
      <Tabs.Screen name="workout" />
      <Tabs.Screen name="food" />
      <Tabs.Screen name="dashboard" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 24,
    left: 20,
    right: 20,
    alignItems: "center",
  },
  tabsRow: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: TAB_BAR_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    height: "100%",
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapActive: {
    backgroundColor: COLORS.bgElevated,
    transform: [{ translateY: -NOTCH_R - 8 }],
    shadowColor: COLORS.textMuted,
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  label: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  labelActive: {
    color: COLORS.text,
    fontFamily: "Inter_600SemiBold",
    transform: [{ translateY: -4 }],
  },
});
