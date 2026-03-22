import { COLORS } from "@/constants/colors";
import {
  deleteCycleDay,
  loadAllCycleDays,
  loadCycleStartDates,
  saveCycleDay,
} from "@/db/database";
import {
  BonaNova_400Regular,
  BonaNova_700Bold,
} from "@expo-google-fonts/bona-nova";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { useEffect, useState } from "react";
import {
  Dimensions,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import Svg, { Circle as SvgCircle } from "react-native-svg";

const { width } = Dimensions.get("window");
const CIRCLE_SIZE = width * 0.68;

const FLOW = [
  { key: "low", label: "LOW", icon: "water-outline" },
  { key: "medium", label: "MEDIUM", icon: "water-outline" },
  { key: "heavy", label: "HEAVY", icon: "water" },
  { key: "spotting", label: "SPOTTING", icon: "ellipse-outline" },
];

const EMOTIONS = [
  { key: "happy", label: "HAPPY", icon: "happy-outline" },
  { key: "sad", label: "SADD", icon: "sad-outline" },
  { key: "irritated", label: "IRRITATED", icon: "alert-circle-outline" },
  { key: "anxious", label: "ANXIOUS", icon: "thunderstorm-outline" },
  { key: "energetic", label: "ENERGETIC", icon: "flash-outline" },
  { key: "calm", label: "CALM", icon: "leaf-outline" },
  { key: "focused", label: "FOCUSED", icon: "radio-button-on-outline" },
  { key: "tired", label: "TIRED", icon: "moon-outline" },
  { key: "stressed", label: "STRESSED", icon: "pulse-outline" },
  { key: "overloaded", label: "OVERLOADED", icon: "grid-outline" },
];

const INTIMACY = [
  { key: "protected", label: "PROTECTED SEX", icon: "shield-outline" },
  { key: "unprotected", label: "UNPROTECTED SEX", icon: "shield-off-outline" },
  { key: "desire", label: "STRONG DESIRE", icon: "trending-up-outline" },
  { key: "orgasm", label: "ORGASM", icon: "heart-outline" },
];

const SYMPTOMS = [
  { key: "cramps", label: "cramps" },
  { key: "acne", label: "acne" },
  { key: "bloating", label: "bloating" },
  { key: "tender_breasts", label: "sensitive breasts" },
  { key: "headache", label: "headache" },
  { key: "fatigue", label: "fatigue" },
  { key: "nausea", label: "nausea" },
];

type DayData = {
  intensity?: string;
  symptoms: string[];
  moods: string[];
  intimacy: string[];
  note?: string;
};

type ModalMode = "symptom" | "period" | null;

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function diffDays(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

function computePredictions(startDates: string[]) {
  if (startDates.length < 2) return null;
  const lengths: number[] = [];
  for (let i = 1; i < startDates.length; i++) {
    lengths.push(diffDays(startDates[i - 1], startDates[i]));
  }
  const avg = Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);
  const lastStart = startDates[startDates.length - 1];
  const today = new Date().toISOString().split("T")[0];
  const futurePeriods: string[] = [];
  const futureOvulations: string[] = [];
  for (let i = 1; i <= 8; i++) {
    futurePeriods.push(addDays(lastStart, avg * i));
    futureOvulations.push(addDays(addDays(lastStart, avg * i), -14));
  }
  return {
    nextPeriod: futurePeriods[0],
    futurePeriods,
    futureOvulations,
    avgCycleLength: avg,
    daysUntilPeriod: diffDays(today, futurePeriods[0]),
    daysUntilOvulation: diffDays(today, futureOvulations[0]),
    ovulation: futureOvulations[0],
  };
}

function getCurrentPhase(startDates: string[], avgCycleLength: number) {
  if (!startDates.length) return null;
  const lastStart = startDates[startDates.length - 1];
  const today = new Date().toISOString().split("T")[0];
  const dayOfCycle = diffDays(lastStart, today) + 1;
  const ovDay = avgCycleLength - 14;
  if (dayOfCycle <= 5)
    return {
      phase: "01",
      name: "MENSTRUAL PHASE",
      dayOfCycle,
      nutrition: "Iron levels drop. Prioritize spinach, lentils or red meat.",
      training: "Skip HIIT. VO2 max is lower now – opt for walking or yoga.",
    };
  if (dayOfCycle <= ovDay - 2)
    return {
      phase: "02",
      name: "FOLLICULAR PHASE",
      dayOfCycle,
      nutrition: "Estrogen rises. Focus on lean protein and complex carbs.",
      training:
        "Muscles recover faster. Best time for strength training and new PRs.",
    };
  if (dayOfCycle <= ovDay + 2)
    return {
      phase: "03",
      name: "OVULATION PHASE",
      dayOfCycle,
      nutrition: "Testosterone surge. Add zinc: pumpkin seeds, eggs, legumes.",
      training: "Power output is at peak. Go for heavy lifts and cardio.",
    };
  return {
    phase: "04",
    name: "LUTEAL PHASE",
    dayOfCycle,
    nutrition:
      "Progesterone raises metabolism ~300 kcal. Magnesium helps: dark chocolate, nuts.",
    training:
      "Strength decreases slightly. Focus on moderate intensity and recovery.",
  };
}

function buildMarkedDates(
  dayData: Record<string, DayData>,
  predictions: ReturnType<typeof computePredictions>,
  selectedDay: string | null,
) {
  const marked: Record<string, any> = {};

  if (predictions?.futurePeriods) {
    for (const p of predictions.futurePeriods) {
      for (let i = 0; i < 5; i++) {
        const d = addDays(p, i);
        marked[d] = {
          selected: true,
          selectedColor: COLORS.periodLight,
          selectedTextColor: COLORS.period,
        };
      }
    }
  }

  if (predictions?.futureOvulations) {
    for (const ov of predictions.futureOvulations) {
      marked[ov] = {
        selected: true,
        selectedColor: COLORS.ovulationLight,
        selectedTextColor: COLORS.ovulation,
      };
    }
  }

  for (const date of Object.keys(dayData)) {
    const d = dayData[date];
    const dots = [];
    if (d.symptoms.length > 0 || d.moods.length > 0)
      dots.push({ key: "sym", color: COLORS.symptom });
    if (d.intimacy.length > 0)
      dots.push({ key: "int", color: COLORS.intimacy });
    marked[date] = {
      selected: !!d.intensity,
      selectedColor: COLORS.period,
      selectedTextColor: COLORS.white,
      dots,
    };
  }

  if (selectedDay && !dayData[selectedDay]?.intensity) {
    marked[selectedDay] = {
      ...marked[selectedDay],
      selected: true,
      selectedColor: COLORS.bgElevated,
      selectedTextColor: COLORS.text,
    };
  }

  return marked;
}

function getWeekDays(today: string) {
  const labels = ["S", "M", "T", "W", "T", "F", "S"];
  const days = [];
  for (let i = -3; i <= 3; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    days.push({ dateStr, day: d.getDate(), label: labels[d.getDay()] });
  }
  return days;
}

function formatHeaderDate(today: string) {
  const d = new Date(today);
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const n = d.getDate();
  const suffix =
    n > 3 && n < 21 ? "th" : ["th", "st", "nd", "rd"][n % 10] || "th";
  return `${days[d.getDay()]}, ${n}${suffix} ${months[d.getMonth()]}`;
}

export default function CycleScreen() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    BonaNova_400Regular,
    BonaNova_700Bold,
  });

  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [dayData, setDayData] = useState<Record<string, DayData>>({});
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [tempData, setTempData] = useState<DayData>({
    symptoms: [],
    moods: [],
    intimacy: [],
  });
  const [predictions, setPredictions] =
    useState<ReturnType<typeof computePredictions>>(null);
  const [startDates, setStartDates] = useState<string[]>([]);
  const [periodSelectDays, setPeriodSelectDays] = useState<string[]>([]);
  const [showCalendar, setShowCalendar] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const weekDays = getWeekDays(today);

  useEffect(() => {
    const loaded = loadAllCycleDays();
    setDayData(loaded);
    const starts = loadCycleStartDates();
    setStartDates(starts);
    setPredictions(computePredictions(starts));
  }, []);

  const refreshPredictions = () => {
    const starts = loadCycleStartDates();
    setStartDates(starts);
    setPredictions(computePredictions(starts));
  };

  const phase = predictions
    ? getCurrentPhase(startDates, predictions.avgCycleLength)
    : null;

  const dotAngle = phase
    ? ((phase.dayOfCycle - 1) / (predictions?.avgCycleLength ?? 28)) * 360 - 90
    : -90;
  const dotRad = (dotAngle * Math.PI) / 180;
  const circleR = CIRCLE_SIZE / 2;
  const dotSize = 22;
  const borderWidth = 3;
  const radius = circleR - borderWidth / 2;
  const dotX = circleR + radius * Math.cos(dotRad) - dotSize / 2;
  const dotY = circleR + radius * Math.sin(dotRad) - dotSize / 2;

  const savePeriodDays = () => {
    for (const date of periodSelectDays) {
      const existing = dayData[date] ?? {
        symptoms: [],
        moods: [],
        intimacy: [],
      };
      saveCycleDay(
        date,
        "medium",
        existing.symptoms,
        existing.moods,
        existing.intimacy,
      );
      setDayData((prev) => ({
        ...prev,
        [date]: { ...existing, intensity: "medium" },
      }));
    }
    setPeriodSelectDays([]);
    refreshPredictions();
    setModalMode(null);
  };

  const saveSymptoms = () => {
    if (!selectedDay) return;
    const isEmpty =
      !tempData.intensity &&
      tempData.symptoms.length === 0 &&
      tempData.moods.length === 0 &&
      tempData.intimacy.length === 0 &&
      !tempData.note;
    if (isEmpty) {
      deleteCycleDay(selectedDay);
      setDayData((prev) => {
        const u = { ...prev };
        delete u[selectedDay];
        return u;
      });
    } else {
      saveCycleDay(
        selectedDay,
        tempData.intensity,
        tempData.symptoms,
        tempData.moods,
        tempData.intimacy,
      );
      setDayData((prev) => ({ ...prev, [selectedDay]: tempData }));
    }
    refreshPredictions();
    setModalMode(null);
  };

  const togglePeriodDay = (dateStr: string) => {
    if (dateStr > today) return;
    setPeriodSelectDays((prev) =>
      prev.includes(dateStr)
        ? prev.filter((d) => d !== dateStr)
        : [...prev, dateStr],
    );
  };

  const toggleEmotion = (key: string) =>
    setTempData((prev) => ({
      ...prev,
      moods: prev.moods.includes(key)
        ? prev.moods.filter((m) => m !== key)
        : [...prev.moods, key],
    }));

  const toggleIntimacy = (key: string) =>
    setTempData((prev) => ({
      ...prev,
      intimacy: prev.intimacy.includes(key)
        ? prev.intimacy.filter((i) => i !== key)
        : [...prev.intimacy, key],
    }));

  const toggleSymptom = (key: string) =>
    setTempData((prev) => ({
      ...prev,
      symptoms: prev.symptoms.includes(key)
        ? prev.symptoms.filter((s) => s !== key)
        : [...prev.symptoms, key],
    }));

  const periodMarkedDates = {
    ...Object.fromEntries(
      Object.keys(dayData)
        .filter((d) => dayData[d].intensity)
        .map((d) => [
          d,
          {
            selected: true,
            selectedColor: COLORS.period,
            selectedTextColor: COLORS.white,
          },
        ]),
    ),
    ...Object.fromEntries(
      periodSelectDays.map((d) => [
        d,
        {
          selected: true,
          selectedColor: COLORS.periodLight,
          selectedTextColor: COLORS.period,
        },
      ]),
    ),
  };

  const selectedData = selectedDay ? dayData[selectedDay] : null;

  if (!fontsLoaded) return null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>lia</Text>
          </View>
        </View>

        {/* KRUH */}
        <View style={styles.circleContainer}>
          <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
            {/* Pozadie kruhu */}
            <SvgCircle
              cx={CIRCLE_SIZE / 2}
              cy={CIRCLE_SIZE / 2}
              r={CIRCLE_SIZE / 2 - 12}
              stroke={COLORS.bgElevated}
              strokeWidth={3}
              fill="none"
            />
            {/* Progress oblúk */}
            {phase &&
              (() => {
                const r = CIRCLE_SIZE / 2 - 12;
                const circumference = 2 * Math.PI * r;
                const progress =
                  (phase.dayOfCycle - 1) / (predictions?.avgCycleLength ?? 28);
                const strokeDashoffset = circumference * (1 - progress);
                return (
                  <SvgCircle
                    cx={CIRCLE_SIZE / 2}
                    cy={CIRCLE_SIZE / 2}
                    r={r}
                    stroke={COLORS.text}
                    strokeWidth={3}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    rotation="-90"
                    origin={`${CIRCLE_SIZE / 2}, ${CIRCLE_SIZE / 2}`}
                  />
                );
              })()}
          </Svg>

          {/* Text v strede */}
          <View style={styles.circleInner}>
            {phase ? (
              <>
                <Text style={styles.circlePhaseNum}>
                  Day {String(phase.dayOfCycle).padStart(2, "0")}
                </Text>
                {/* <Text style={styles.circlePhaseNum}>PHASE {phase.phase}</Text> */}
                <Text style={styles.circlePhaseName}>{phase.name}</Text>

                {predictions?.daysUntilOvulation != null &&
                predictions.daysUntilOvulation > 0 ? (
                  <View style={styles.circleOvBadge}>
                    <Text style={styles.circleOvText}>
                      {predictions.daysUntilOvulation} DAYS TO OVULATION
                    </Text>
                  </View>
                ) : predictions?.daysUntilPeriod != null &&
                  predictions.daysUntilPeriod > 0 ? (
                  <View style={styles.circleOvBadge}>
                    <Text style={styles.circleOvText}>
                      {predictions.daysUntilPeriod} DAYS TO PERIOD
                    </Text>
                  </View>
                ) : null}
              </>
            ) : (
              <Text style={styles.circlePhaseName}>
                Start tracking{"\n"}your cycle
              </Text>
            )}
          </View>
        </View>

        {/* TIP */}
        {phase && (
          <View style={styles.tipsRow}>
            <View style={styles.tipCard}>
              <Text style={styles.tipLabel}>NUTRITION</Text>
              <Text style={styles.tipText}>{phase.nutrition}</Text>
            </View>
            <View style={styles.tipCard}>
              <Text style={styles.tipLabel}>TRAINING</Text>
              <Text style={styles.tipText}>{phase.training}</Text>
            </View>
          </View>
        )}

        {/* KALENDÁR TOGGLE */}
        <TouchableOpacity
          style={styles.calendarToggle}
          onPress={() => setShowCalendar((prev) => !prev)}
        >
          <Text style={styles.calendarToggleText}>
            {showCalendar ? "Hide calendar" : "Show calendar"}
          </Text>
          <Ionicons
            name={showCalendar ? "chevron-up" : "chevron-down"}
            size={16}
            color={COLORS.textMuted}
          />
        </TouchableOpacity>

        {showCalendar && (
          <View style={styles.calCard}>
            <Calendar
              firstDay={1}
              markingType="multi-dot"
              onDayPress={(day: any) => {
                setSelectedDay(day.dateString);
                if (day.dateString <= today) {
                  setTempData(
                    dayData[day.dateString] ?? {
                      symptoms: [],
                      moods: [],
                      intimacy: [],
                    },
                  );
                }
              }}
              markedDates={buildMarkedDates(dayData, predictions, selectedDay)}
              dayComponent={({ date, state, marking }: any) => {
                const isSelected = marking?.selected;
                const isToday = date?.dateString === today;
                const dots = marking?.dots ?? [];
                return (
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedDay(date.dateString);
                      if (date.dateString <= today) {
                        setTempData(
                          dayData[date.dateString] ?? {
                            symptoms: [],
                            moods: [],
                            intimacy: [],
                          },
                        );
                      }
                    }}
                    style={[
                      styles.calDay,
                      isSelected && {
                        backgroundColor:
                          marking?.selectedColor ?? COLORS.period,
                      },
                      isToday &&
                        !isSelected && {
                          borderWidth: 1,
                          borderColor: COLORS.text,
                        },
                    ]}
                  >
                    <Text
                      style={[
                        styles.calDayText,
                        state === "disabled" && { color: COLORS.textMuted },
                        isSelected && {
                          color: marking?.selectedTextColor ?? COLORS.white,
                        },
                        isToday && !isSelected && { color: COLORS.text },
                      ]}
                    >
                      {date?.day}
                    </Text>
                    <View style={styles.calDotRow}>
                      {dots.map((dot: any) => (
                        <View
                          key={dot.key}
                          style={[
                            styles.calDot,
                            { backgroundColor: dot.color },
                          ]}
                        />
                      ))}
                    </View>
                  </TouchableOpacity>
                );
              }}
              theme={{
                calendarBackground: "transparent",
                backgroundColor: "transparent",
                arrowColor: COLORS.text,
                monthTextColor: COLORS.text,
                textMonthFontWeight: "700",
                textMonthFontSize: 16,
                textDayHeaderFontFamily: "Inter_500Medium",
                textDayHeaderFontSize: 11,
                textSectionTitleColor: COLORS.textMuted,
                textMonthFontFamily: "BonaNova_700Bold",
              }}
            />
            {selectedDay && selectedDay <= today && (
              <View style={styles.dayPreviewGrid}>
                {!selectedData ? (
                  <TouchableOpacity
                    style={styles.logItem}
                    onPress={() => {
                      setTempData({ symptoms: [], moods: [], intimacy: [] });
                      setModalMode("symptom");
                    }}
                  >
                    <Ionicons name="add" size={26} color={COLORS.textMuted} />
                    <Text style={styles.logItemLabelMuted}>ADD</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    {selectedData.intensity && (
                      <View style={styles.logItem}>
                        <Ionicons
                          name="water-outline"
                          size={26}
                          color={COLORS.text}
                        />
                        <Text style={styles.logItemLabel}>
                          {
                            FLOW.find((f) => f.key === selectedData.intensity)
                              ?.label
                          }
                        </Text>
                      </View>
                    )}
                    {selectedData.moods.map((m) => (
                      <View key={m} style={styles.logItem}>
                        <Ionicons
                          name={EMOTIONS.find((x) => x.key === m)?.icon as any}
                          size={26}
                          color={COLORS.text}
                        />
                        <Text style={styles.logItemLabel}>
                          {EMOTIONS.find((x) => x.key === m)?.label}
                        </Text>
                      </View>
                    ))}
                    {selectedData.intimacy.map((i) => (
                      <View key={i} style={styles.logItem}>
                        <Ionicons
                          name={INTIMACY.find((x) => x.key === i)?.icon as any}
                          size={26}
                          color={COLORS.text}
                        />
                        <Text style={styles.logItemLabel}>
                          {INTIMACY.find((x) => x.key === i)?.label}
                        </Text>
                      </View>
                    ))}
                    {selectedData.symptoms.map((s) => (
                      <View key={s} style={styles.logItem}>
                        <Ionicons
                          name="medical-outline"
                          size={26}
                          color={COLORS.text}
                        />
                        <Text style={styles.logItemLabel}>
                          {SYMPTOMS.find(
                            (x) => x.key === s,
                          )?.label.toUpperCase()}
                        </Text>
                      </View>
                    ))}
                    <TouchableOpacity
                      style={styles.logItem}
                      onPress={() => {
                        setTempData(
                          dayData[selectedDay] ?? {
                            symptoms: [],
                            moods: [],
                            intimacy: [],
                          },
                        );
                        setModalMode("symptom");
                      }}
                    >
                      <Ionicons name="add" size={26} color={COLORS.textMuted} />
                      <Text style={styles.logItemLabelMuted}>EDIT</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}
          </View>
        )}

        {/* DAILY LOGS HEADER */}
        <View style={styles.logsHeader}>
          <Text style={styles.logsTitle}>Daily Logs</Text>
          <TouchableOpacity
            onPress={() => {
              setSelectedDay(today);
              setTempData(
                dayData[today] ?? { symptoms: [], moods: [], intimacy: [] },
              );
              setModalMode("symptom");
            }}
          >
            <Text style={styles.logsEdit}>EDIT ENTRIES</Text>
          </TouchableOpacity>
        </View>

        {/* DAILY LOGS GRID */}
        {(() => {
          const todayData = dayData[today];
          if (!todayData)
            return (
              <TouchableOpacity
                style={styles.emptyLog}
                onPress={() => {
                  setSelectedDay(today);
                  setTempData({ symptoms: [], moods: [], intimacy: [] });
                  setModalMode("symptom");
                }}
              >
                <Ionicons name="add" size={24} color={COLORS.textMuted} />
                <Text style={styles.emptyLogText}>Add today's log</Text>
              </TouchableOpacity>
            );

          const allItems = [
            ...(todayData.intensity
              ? [
                  {
                    label:
                      FLOW.find((f) => f.key === todayData.intensity)?.label ??
                      "",
                    icon: "water-outline",
                    color: COLORS.text,
                  },
                ]
              : []),
            ...todayData.symptoms.map((s) => ({
              label:
                SYMPTOMS.find((x) => x.key === s)?.label.toUpperCase() ?? "",
              icon: "medical-outline",
              color: COLORS.text,
            })),
            ...todayData.moods.map((m) => ({
              label: EMOTIONS.find((x) => x.key === m)?.label ?? "",
              icon: EMOTIONS.find((x) => x.key === m)?.icon ?? "happy-outline",
              color: COLORS.text,
            })),
            ...todayData.intimacy.map((i) => ({
              label: INTIMACY.find((x) => x.key === i)?.label ?? "",
              icon: INTIMACY.find((x) => x.key === i)?.icon ?? "heart-outline",
              color: COLORS.text,
            })),
          ];

          const visibleItems = allItems.slice(0, 5);

          return (
            <View style={styles.logsGrid}>
              {visibleItems.map((item, idx) => (
                <View key={idx} style={styles.logItem}>
                  <Ionicons
                    name={item.icon as any}
                    size={26}
                    color={item.color}
                  />
                  <Text style={styles.logItemLabel}>{item.label}</Text>
                </View>
              ))}
              <TouchableOpacity
                style={styles.logItem}
                onPress={() => {
                  setSelectedDay(today);
                  setTempData(
                    dayData[today] ?? { symptoms: [], moods: [], intimacy: [] },
                  );
                  setModalMode("symptom");
                }}
              >
                <Ionicons name="add" size={26} color={COLORS.textMuted} />
                <Text style={styles.logItemLabelMuted}>EDIT</Text>
              </TouchableOpacity>
            </View>
          );
        })()}

        {/* ADD PERIOD */}
        <TouchableOpacity
          style={styles.addPeriodBtn}
          onPress={() => {
            setPeriodSelectDays([]);
            setModalMode("period");
          }}
        >
          <Ionicons name="add" size={20} color={COLORS.white} />
          <Text style={styles.addPeriodText}>add your period</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ═══ MODAL – SYMPTÓMY ═══ */}
      <Modal
        visible={modalMode === "symptom"}
        animationType="slide"
        transparent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Modal header */}
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setModalMode(null)}>
                  <Ionicons name="close" size={22} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.modalHeaderTitle}>Symptom Log</Text>
                <View style={{ width: 22 }} />
              </View>

              <Text style={styles.modalDateLabel}>DAILY LOG</Text>
              <Text style={styles.modalDate}>
                {selectedDay
                  ? (() => {
                      const d = new Date(selectedDay);
                      const days = [
                        "SUNDAY",
                        "MONDAY",
                        "TUESDAY",
                        "WEDNESDAY",
                        "THURSDAY",
                        "FRIDAY",
                        "SATURDAY",
                      ];
                      const months = [
                        "January",
                        "February",
                        "March",
                        "April",
                        "May",
                        "June",
                        "July",
                        "August",
                        "September",
                        "October",
                        "November",
                        "December",
                      ];
                      const n = d.getDate();
                      const suffix =
                        n > 3 && n < 21
                          ? "th"
                          : ["th", "st", "nd", "rd"][n % 10] || "th";
                      return `${days[d.getDay()]}, ${n}${suffix} ${months[d.getMonth()]}`;
                    })()
                  : ""}
              </Text>

              {/* MENSTRUAL FLOW */}
              <Text style={styles.sectionLabel}>MENSTRUAL FLOW</Text>
              <View style={styles.flowGrid}>
                {FLOW.map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.flowItem,
                      tempData.intensity === item.key && styles.flowItemActive,
                    ]}
                    onPress={() =>
                      setTempData((prev) => ({
                        ...prev,
                        intensity:
                          prev.intensity === item.key ? undefined : item.key,
                      }))
                    }
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={24}
                      color={
                        tempData.intensity === item.key
                          ? COLORS.white
                          : COLORS.textMuted
                      }
                    />
                    <Text
                      style={[
                        styles.flowLabel,
                        tempData.intensity === item.key &&
                          styles.flowLabelActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {item.key === "spotting" && (
                      <Text
                        style={[
                          styles.flowSave,
                          tempData.intensity === item.key && {
                            color: COLORS.white,
                          },
                        ]}
                      >
                        SAVE
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* EMOTIONS */}
              <Text style={styles.sectionLabel}>EMOTIONS</Text>
              <View style={styles.emotionGrid}>
                {EMOTIONS.map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.emotionItem,
                      tempData.moods.includes(item.key) &&
                        styles.emotionItemActive,
                    ]}
                    onPress={() => toggleEmotion(item.key)}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={22}
                      color={
                        tempData.moods.includes(item.key)
                          ? COLORS.symptom
                          : COLORS.textMuted
                      }
                    />
                    <Text
                      style={[
                        styles.emotionLabel,
                        tempData.moods.includes(item.key) &&
                          styles.emotionLabelActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* INTIMACY */}
              <Text style={styles.sectionLabel}>INTIMACY</Text>
              <View style={styles.intimacyGrid}>
                {INTIMACY.map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.intimacyItem,
                      tempData.intimacy.includes(item.key) &&
                        styles.intimacyItemActive,
                    ]}
                    onPress={() => toggleIntimacy(item.key)}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={22}
                      color={
                        tempData.intimacy.includes(item.key)
                          ? "#C2858C"
                          : COLORS.textMuted
                      }
                    />
                    <Text
                      style={[
                        styles.intimacyLabel,
                        tempData.intimacy.includes(item.key) &&
                          styles.intimacyLabelActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* SYMPTOMS */}
              <Text style={styles.sectionLabel}>SYMPTOMS</Text>
              <View style={styles.symptomsWrap}>
                {SYMPTOMS.map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.symptomChip,
                      tempData.symptoms.includes(item.key) &&
                        styles.symptomChipActive,
                    ]}
                    onPress={() => toggleSymptom(item.key)}
                  >
                    <Text
                      style={[
                        styles.symptomChipText,
                        tempData.symptoms.includes(item.key) &&
                          styles.symptomChipTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* NOTE */}
              <Text style={styles.sectionLabel}>NOTE</Text>
              <TextInput
                style={styles.noteInput}
                placeholder="write something more..."
                placeholderTextColor={COLORS.textMuted}
                multiline
                value={tempData.note ?? ""}
                onChangeText={(text) =>
                  setTempData((prev) => ({ ...prev, note: text }))
                }
              />

              <TouchableOpacity style={styles.saveBtn} onPress={saveSymptoms}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ═══ MODAL – PERIÓDA ═══ */}
      <Modal visible={modalMode === "period"} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalMode(null)}>
                <Ionicons name="close" size={22} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.modalHeaderTitle}>Period Log</Text>
              <View style={{ width: 22 }} />
            </View>

            <View style={styles.miniCalCard}>
              <Calendar
                firstDay={1}
                markingType="multi-dot"
                maxDate={today}
                onDayPress={(day: any) => togglePeriodDay(day.dateString)}
                markedDates={periodMarkedDates}
                theme={{
                  calendarBackground: "transparent",
                  selectedDayBackgroundColor: COLORS.period,
                  selectedDayTextColor: COLORS.white,
                  todayTextColor: COLORS.period,
                  dayTextColor: COLORS.text,
                  textDisabledColor: COLORS.textMuted,
                  arrowColor: COLORS.text,
                  monthTextColor: COLORS.text,
                  textMonthFontWeight: "700",
                  textMonthFontSize: 16,
                  textDayFontSize: 13,
                  textDayFontFamily: "Inter_400Regular",
                  textMonthFontFamily: "BonaNova_700Bold",
                }}
              />
            </View>

            <Text style={styles.modalHint}>select days of your period</Text>

            <TouchableOpacity style={styles.saveBtn} onPress={savePeriodDays}>
              <Text style={styles.saveBtnText}>Save period days</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { paddingBottom: 60 },

  // HEADER
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  logoBox: {
    width: 44,
    height: 44,
    backgroundColor: COLORS.bgCard,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.text,
  },

  // KRUH
  circleContainer: {
    alignSelf: "center",
    marginTop: 8,
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
  },
  circleInner: {
    position: "absolute",
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },

  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 3,
    borderColor: COLORS.bgElevated,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    gap: 4,
  },
  circlePhaseNum: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: COLORS.textMuted,
    letterSpacing: 2,
  },
  circlePhaseName: {
    fontSize: 23,
    fontFamily: "BonaNova_700Bold",
    color: COLORS.text,
    letterSpacing: 1,
  },
  circleDay: {
    fontSize: 24,
    fontFamily: "Inter_100Thin",
    color: COLORS.text,
  },
  circleOvBadge: {
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: COLORS.bgElevated,
    borderRadius: 20,
  },
  circleOvText: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    color: COLORS.textMuted,
    letterSpacing: 1,
  },

  // TIP
  tipsRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 16,
    gap: 10,
  },
  tipCard: {
    flex: 1,
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  tipLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.textMuted,
    letterSpacing: 2,
  },
  tipText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: COLORS.text,
    lineHeight: 18,
    textAlign: "justify",
  },

  // KALENDÁR TOGGLE
  calendarToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 16,
    marginBottom: 4,
  },
  calendarToggleText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: COLORS.textMuted,
  },
  calCard: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    padding: 8,
  },
  calDay: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.bgElevated,
  },
  calDayText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: COLORS.text,
  },
  calDotRow: {
    flexDirection: "row",
    gap: 2,
    position: "absolute",
    bottom: 4,
  },
  calDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },

  // DAY PREVIEW
  dayPreview: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.bgElevated,
    marginTop: 8,
  },
  dayPreviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  dayPreviewDate: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.text,
  },
  dayPreviewEdit: {
    backgroundColor: COLORS.period,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  dayPreviewEditText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.white,
  },
  dayPreviewEmpty: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: COLORS.textMuted,
    fontStyle: "italic",
  },
  dayPreviewTags: {
    flexDirection: "row",
    gap: 6,
  },
  previewTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  previewTagText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  dayPreviewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 8,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.bgElevated,
    marginTop: 8,
  },

  // DAILY LOGS
  logsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  logsTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.text,
  },
  logsEdit: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  logsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: 16,
    gap: 8,
  },
  logItem: {
    width: (width - 48) / 3,
    aspectRatio: 1,
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  logItemLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.text,
    textAlign: "center",
    letterSpacing: 1,
  },
  logItemLabelMuted: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.textMuted,
    textAlign: "center",
    letterSpacing: 1,
  },
  emptyLog: {
    marginHorizontal: 20,
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  emptyLogText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: COLORS.textMuted,
  },

  // ADD PERIOD
  addPeriodBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: COLORS.period,
    paddingVertical: 16,
    borderRadius: 32,
  },
  addPeriodText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.white,
  },

  // MODALY
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: COLORS.bgCard,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: "90%",
  },
  miniCalCard: {
    backgroundColor: COLORS.bgElevated,
    borderRadius: 16,
    padding: 4,
    marginBottom: 8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.text,
  },
  modalDateLabel: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    color: COLORS.textMuted,
    letterSpacing: 2,
    marginBottom: 4,
  },
  modalDate: {
    fontSize: 20,
    fontFamily: "BonaNova_700Bold",
    color: COLORS.text,
    marginBottom: 20,
  },
  modalHint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: COLORS.textMuted,
    textAlign: "center",
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.textMuted,
    letterSpacing: 2,
    marginTop: 20,
    marginBottom: 12,
  },

  // FLOW GRID
  flowGrid: {
    flexDirection: "row",
    gap: 8,
  },
  flowItem: {
    flex: 1,
    backgroundColor: COLORS.bgElevated,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "transparent",
  },
  flowItemActive: {
    backgroundColor: COLORS.period,
    borderColor: COLORS.period,
  },
  flowLabel: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.textMuted,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  flowLabelActive: { color: COLORS.white },
  flowSave: {
    fontSize: 8,
    fontFamily: "Inter_700Bold",
    color: COLORS.textMuted,
    letterSpacing: 1,
  },

  // EMOTION GRID
  emotionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  emotionItem: {
    width: (width - 96) / 5,
    backgroundColor: COLORS.bgElevated,
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "transparent",
  },
  emotionItemActive: {
    borderColor: COLORS.symptom,
  },
  emotionLabel: {
    fontSize: 8,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.textMuted,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  emotionLabelActive: { color: COLORS.symptom },

  // INTIMACY GRID
  intimacyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  intimacyItem: {
    width: (width - 64) / 2,
    backgroundColor: COLORS.bgElevated,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "transparent",
  },
  intimacyItemActive: {
    borderColor: COLORS.intimacy,
  },
  intimacyLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.textMuted,
    flex: 1,
    letterSpacing: 0.5,
  },
  intimacyLabelActive: { color: "#C2858C" },

  // SYMPTOMS CHIPS
  symptomsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  symptomChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.bgElevated,
    borderWidth: 1,
    borderColor: "transparent",
  },
  symptomChipActive: {
    borderColor: COLORS.text,
    backgroundColor: "transparent",
  },
  symptomChipText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: COLORS.textMuted,
  },
  symptomChipTextActive: {
    color: COLORS.text,
  },

  // NOTE
  noteInput: {
    backgroundColor: COLORS.bgElevated,
    borderRadius: 12,
    padding: 14,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: COLORS.text,
    minHeight: 80,
    textAlignVertical: "top",
  },

  // SAVE
  saveBtn: {
    backgroundColor: COLORS.period,
    padding: 16,
    borderRadius: 28,
    alignItems: "center",
    marginTop: 24,
    marginBottom: 8,
  },
  saveBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
