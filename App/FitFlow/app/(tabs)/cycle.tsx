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
  Montserrat_400Regular,
  Montserrat_600SemiBold,
} from "@expo-google-fonts/montserrat";
import { useFonts } from "expo-font";
import { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  ImageBackground,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";

const { width, height } = Dimensions.get("window");
const CIRCLE_SIZE = width * 0.72;

const INTENSITY = [
  {
    key: "spotting",
    label: "Spotting",
    image: require("@/assets/images/spotting.png"),
  },
  { key: "low", label: "Low", image: require("@/assets/images/low.png") },
  {
    key: "medium",
    label: "Medium",
    image: require("@/assets/images/medium.png"),
  },
  { key: "heavy", label: "Heavy", image: require("@/assets/images/heavy.png") },
];

const MOODS = [
  {
    key: "normal",
    label: "Normal",
    image: require("@/assets/images/normal.png"),
  },
  { key: "happy", label: "Happy", image: require("@/assets/images/happy.png") },
  {
    key: "exhausted",
    label: "Exhausted",
    image: require("@/assets/images/exhausted.png"),
  },
  {
    key: "stressed",
    label: "Stressed",
    image: require("@/assets/images/stressed.png"),
  },
  { key: "angry", label: "Angry", image: require("@/assets/images/angry.png") },
  {
    key: "anxious",
    label: "Anxious",
    image: require("@/assets/images/anxious.png"),
  },
  { key: "moody", label: "Moody", image: require("@/assets/images/moody.png") },
  {
    key: "inspired",
    label: "Inspired",
    image: require("@/assets/images/inspired.png"),
  },
  {
    key: "peaceful",
    label: "Peaceful",
    image: require("@/assets/images/peaceful.png"),
  },
  {
    key: "playful",
    label: "Playful",
    image: require("@/assets/images/playful.png"),
  },
  {
    key: "frustrated",
    label: "Frustrated",
    image: require("@/assets/images/frustrated.png"),
  },
  { key: "sad", label: "Sad", image: require("@/assets/images/sad.png") },
];

const INTIMACY = [
  {
    key: "unprotected",
    label: "Unprotected",
    image: require("@/assets/images/unprotected.png"),
  },
  {
    key: "protected",
    label: "Protected",
    image: require("@/assets/images/protected.png"),
  },
  {
    key: "orgasm",
    label: "Orgasm",
    image: require("@/assets/images/orgasm.png"),
  },
  { key: "horny", label: "Horny", image: require("@/assets/images/horny.png") },
];

type DayData = {
  intensity?: string;
  symptoms: string[];
  moods: string[];
  intimacy: string[];
};

type ModalMode = "calendar" | "period" | "symptom" | null;

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
    ovulation: futureOvulations[0],
  };
}

function getCurrentPhase(startDates: string[], avgCycleLength: number) {
  if (!startDates.length) return null;
  const lastStart = startDates[startDates.length - 1];
  const today = new Date().toISOString().split("T")[0];
  const dayOfCycle = diffDays(lastStart, today) + 1;
  const ovDay = avgCycleLength - 14;

  if (dayOfCycle <= 5) {
    return {
      name: "menstrual phase",
      dayOfCycle,
      tip: "Iron levels drop - add spinach, lentils or red meat. Skip HIIT, your VO2 max is lower now.",
    };
  } else if (dayOfCycle <= ovDay - 2) {
    return {
      name: "follicular phase",
      dayOfCycle,
      tip: "Estrogen peaks - your muscles recover faster. Best time for strength training and new PRs.",
    };
  } else if (dayOfCycle <= ovDay + 2) {
    return {
      name: "ovulation phase",
      dayOfCycle,
      tip: "Testosterone surge - power output is highest. Go for heavy lifts. Add zinc: pumpkin seeds, eggs.",
    };
  } else {
    return {
      name: "luteal phase",
      dayOfCycle,
      tip: "Progesterone raises metabolism by ~300 kcal. Magnesium reduces cramps: dark chocolate, nuts.",
    };
  }
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
          selectedColor: "#F2D0DA",
          selectedTextColor: COLORS.primary,
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
      dots.push({ key: "sym", color: COLORS.primary });
    if (d.intimacy.length > 0) dots.push({ key: "int", color: COLORS.accent });
    marked[date] = {
      selected: !!d.intensity,
      selectedColor: COLORS.primary,
      selectedTextColor: COLORS.white,
      dots,
    };
  }

  if (selectedDay && !dayData[selectedDay]?.intensity) {
    marked[selectedDay] = {
      ...marked[selectedDay],
      selected: true,
      selectedColor: COLORS.primaryLight,
      selectedTextColor: COLORS.primary,
    };
  }

  return marked;
}

function getWeekDays(today: string) {
  const days = [];
  const labels = ["S", "M", "T", "W", "T", "F", "S"];
  for (let i = -3; i <= 3; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    days.push({
      dateStr,
      day: d.getDate(),
      label: labels[d.getDay()],
    });
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
  const nth =
    n > 3 && n < 21
      ? `${n}th`
      : ["th", "st", "nd", "rd"][n % 10]
        ? `${n}${["th", "st", "nd", "rd"][n % 10]}`
        : `${n}th`;
  return `${days[d.getDay()]}, ${nth} ${months[d.getMonth()]}`;
}

export default function CycleScreen() {
  const [fontsLoaded] = useFonts({
    BonaNova_400Regular,
    BonaNova_700Bold,
    Montserrat_400Regular,
    Montserrat_600SemiBold,
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

  const today = new Date().toISOString().split("T")[0];
  const weekDays = getWeekDays(today);

  useEffect(() => {
    const loaded = loadAllCycleDays();
    setDayData(loaded);
    const starts = loadCycleStartDates();
    setStartDates(starts);
    setPredictions(computePredictions(starts));
    // Preload pozadia
    Image.prefetch(
      Image.resolveAssetSource(require("@/assets/images/background.png")).uri,
    );
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
  const dotX = circleR + (circleR - 2) * Math.cos(dotRad);
  const dotY = circleR + (circleR - 2) * Math.sin(dotRad);

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
      tempData.intimacy.length === 0;
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

  const SYMPTOMS = [
    { key: "cramps", label: "Cramps", emoji: "😣" },
    { key: "back_pain", label: "Back pain", emoji: "🔙" },
    { key: "bloating", label: "Bloating", emoji: "🫃" },
    { key: "headache", label: "Headache", emoji: "🤕" },
    { key: "fatigue", label: "Fatigue", emoji: "😴" },
    { key: "acne", label: "Acne", emoji: "😤" },
    { key: "tender_breasts", label: "Tender breasts", emoji: "💗" },
    { key: "nausea", label: "Nausea", emoji: "🤢" },
    { key: "insomnia", label: "Insomnia", emoji: "😵" },
  ];

  const toggleSymptom = (key: string) =>
    setTempData((prev) => ({
      ...prev,
      symptoms: prev.symptoms.includes(key)
        ? prev.symptoms.filter((s) => s !== key)
        : [...prev.symptoms, key],
    }));

  const toggleMood = (key: string) =>
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

  const periodMarkedDates = {
    ...Object.fromEntries(
      Object.keys(dayData)
        .filter((d) => dayData[d].intensity)
        .map((d) => [
          d,
          {
            selected: true,
            selectedColor: COLORS.primary,
            selectedTextColor: COLORS.white,
          },
        ]),
    ),
    ...Object.fromEntries(
      periodSelectDays.map((d) => [
        d,
        {
          selected: true,
          selectedColor: COLORS.primaryLight,
          selectedTextColor: COLORS.primary,
        },
      ]),
    ),
  };

  if (!fontsLoaded) return null;

  return (
    <View style={styles.container}>
      {/* ═══ HLAVNÁ OBRAZOVKA ═══ */}
      <ImageBackground
        source={require("@/assets/images/background.png")}
        style={[
          StyleSheet.absoluteFillObject,
          {
            display:
              modalMode === "calendar" || modalMode === "symptom"
                ? "none"
                : "flex",
          },
        ]}
        resizeMode="cover"
      >
        <StatusBar barStyle="dark-content" />

        <View style={styles.header}>
          <Image
            source={require("@/assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.headerDate}>{formatHeaderDate(today)}</Text>
          <TouchableOpacity
            onPress={() => setModalMode("calendar")}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Image
              source={require("@/assets/images/calendar.png")}
              style={styles.calIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.weekStrip}>
          {weekDays.map((d) => {
            const isToday = d.dateStr === today;
            const hasPeriod = !!dayData[d.dateStr]?.intensity;
            return (
              <TouchableOpacity
                key={d.dateStr}
                style={[styles.weekDay, isToday && styles.weekDayActive]}
                onPress={() => {
                  setSelectedDay(d.dateStr);
                  if (d.dateStr <= today) {
                    setTempData(
                      dayData[d.dateStr] ?? {
                        symptoms: [],
                        moods: [],
                        intimacy: [],
                      },
                    );
                  }
                }}
              >
                <Text
                  style={[
                    styles.weekDayLabel,
                    isToday && styles.weekDayLabelActive,
                  ]}
                >
                  {d.label}
                </Text>
                <Text
                  style={[
                    styles.weekDayNum,
                    isToday && styles.weekDayNumActive,
                  ]}
                >
                  {d.day}
                </Text>
                <View style={styles.weekDotRow}>
                  {dayData[d.dateStr]?.intensity && (
                    <View
                      style={[
                        styles.weekDot,
                        { backgroundColor: COLORS.primary },
                      ]}
                    />
                  )}
                  {(dayData[d.dateStr]?.symptoms?.length > 0 ||
                    dayData[d.dateStr]?.moods?.length > 0) && (
                    <View
                      style={[styles.weekDot, { backgroundColor: "#C77D6B" }]}
                    />
                  )}
                  {dayData[d.dateStr]?.intimacy?.length > 0 && (
                    <View
                      style={[styles.weekDot, { backgroundColor: "#C1909E" }]}
                    />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.circleContainer}>
          <View style={styles.circle}>
            {phase ? (
              <>
                <Text style={styles.circleDay}>
                  Day{" "}
                  <Text style={styles.circleDayBold}>{phase.dayOfCycle}</Text>
                </Text>
                <Text style={styles.circleLabel}>of the cycle</Text>
                <Text style={styles.circlePhase}>{phase.name}</Text>
              </>
            ) : (
              <Text style={styles.circlePhase}>
                Start tracking{"\n"}your cycle
              </Text>
            )}
          </View>
          {phase && (
            <View
              style={[styles.circleDot, { left: dotX - 12, top: dotY - 12 }]}
            />
          )}
        </View>

        {/* TIP POD KRUHOM */}
        {phase && (
          <View style={styles.tipCard}>
            <Text style={styles.tipText}>{phase.tip}</Text>
          </View>
        )}

        <View style={styles.bottomBtn}>
          <TouchableOpacity
            style={styles.addPeriodBtn}
            onPress={() => {
              setPeriodSelectDays([]);
              setModalMode("period");
            }}
          >
            <Text style={styles.addBtnPlus}>+</Text>
            <Text style={styles.addBtnText}>log period</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>

      {/* ═══ KALENDÁR – vždy namountovaný ═══ */}
      <ImageBackground
        source={require("@/assets/images/background.png")}
        style={[
          StyleSheet.absoluteFillObject,
          {
            display:
              modalMode === "calendar" || modalMode === "symptom"
                ? "flex"
                : "none",
          },
        ]}
        resizeMode="cover"
      >
        <StatusBar barStyle="dark-content" />

        <View style={styles.header}>
          <Image
            source={require("@/assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            onPress={() => setModalMode(null)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Image
              source={require("@/assets/images/calendar.png")}
              style={styles.calIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.calCard}>
          <Calendar
            firstDay={1}
            markingType="multi-dot"
            onDayPress={(day: any) => {
              const dateStr = day.dateString;
              setSelectedDay(dateStr);
              if (dateStr <= today) {
                setTempData(
                  dayData[dateStr] ?? { symptoms: [], moods: [], intimacy: [] },
                );
              }
            }}
            markedDates={buildMarkedDates(dayData, predictions, selectedDay)}
            theme={{
              calendarBackground: "transparent",
              backgroundColor: "transparent",
              selectedDayBackgroundColor: COLORS.primary,
              selectedDayTextColor: COLORS.white,
              todayTextColor: COLORS.primary,
              dayTextColor: COLORS.text,
              textDisabledColor: "#C8C8C8",
              arrowColor: COLORS.primary,
              monthTextColor: COLORS.primary,
              textMonthFontWeight: "700",
              textMonthFontSize: 18,
              textDayFontSize: 14,
              textDayFontFamily: "Montserrat_400Regular",
              textMonthFontFamily: "BonaNova_700Bold",
            }}
          />
        </View>
        {/* nova sekcia */}
        {selectedDay && selectedDay <= today && (
          <View style={styles.dayPreview}>
            <View style={styles.dayPreviewHeader}>
              <Text style={styles.dayPreviewDate}>
                {selectedDay.split("-").reverse().join("-")}
              </Text>
              <TouchableOpacity
                style={styles.dayPreviewEdit}
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
                <Text style={styles.dayPreviewEditText}>+ add</Text>
              </TouchableOpacity>
            </View>

            {!dayData[selectedDay] ? (
              <Text style={styles.dayPreviewEmpty}>
                No records for this day
              </Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.dayPreviewTags}
              >
                {dayData[selectedDay]?.intensity && (
                  <View
                    style={[styles.previewTag, { borderColor: COLORS.primary }]}
                  >
                    <Text
                      style={[styles.previewTagText, { color: COLORS.primary }]}
                    >
                      🩸{" "}
                      {
                        INTENSITY.find(
                          (i) => i.key === dayData[selectedDay]?.intensity,
                        )?.label
                      }
                    </Text>
                  </View>
                )}
                {dayData[selectedDay]?.moods?.map((m) => (
                  <View
                    key={m}
                    style={[styles.previewTag, { borderColor: "#C77D6B" }]}
                  >
                    <Text style={[styles.previewTagText, { color: "#C77D6B" }]}>
                      {MOODS.find((x) => x.key === m)?.label}
                    </Text>
                  </View>
                ))}
                {dayData[selectedDay]?.intimacy?.map((i) => (
                  <View
                    key={i}
                    style={[styles.previewTag, { borderColor: "#C1909E" }]}
                  >
                    <Text style={[styles.previewTagText, { color: "#C1909E" }]}>
                      {INTIMACY.find((x) => x.key === i)?.label}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        <View style={styles.bottomBtn}>
          <TouchableOpacity
            style={styles.addPeriodBtn}
            onPress={() => {
              setSelectedDay(today);
              setTempData(
                dayData[today] ?? { symptoms: [], moods: [], intimacy: [] },
              );
              setModalMode("symptom");
            }}
          >
            <Text style={styles.addBtnPlus}>+ </Text>
            <Text style={styles.addBtnText}>add symptom</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>

      {/* ═══ MODAL – PERIÓDA ═══ */}
      <Modal visible={modalMode === "period"} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {(selectedDay ?? today).split("-").reverse().join("-")}
                </Text>
                {phase && (
                  <Text style={styles.modalSub}>
                    Cycle day {phase.dayOfCycle}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => setModalMode(null)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
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
                  selectedDayBackgroundColor: COLORS.primary,
                  selectedDayTextColor: COLORS.white,
                  todayTextColor: COLORS.primary,
                  dayTextColor: COLORS.text,
                  textDisabledColor: "#C8C8C8",
                  arrowColor: COLORS.primary,
                  monthTextColor: COLORS.primary,
                  textMonthFontWeight: "700",
                  textMonthFontSize: 16,
                  textDayFontSize: 13,
                  textDayFontFamily: "Montserrat_400Regular",
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

      {/* ═══ MODAL – SYMPTÓMY ═══ */}
      <Modal
        visible={modalMode === "symptom"}
        animationType="slide"
        transparent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>
                    {selectedDay
                      ? selectedDay.split("-").reverse().join("-")
                      : ""}
                  </Text>
                  {phase && (
                    <Text style={styles.modalSub}>
                      Cycle day {phase.dayOfCycle}
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => setModalMode(null)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.closeBtn}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionLabel}>Menstrual flow</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.emojiRow}
              >
                {INTENSITY.map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.emojiItem,
                      tempData.intensity === item.key && styles.emojiItemActive,
                    ]}
                    onPress={() =>
                      setTempData((prev) => ({
                        ...prev,
                        intensity:
                          prev.intensity === item.key ? undefined : item.key,
                      }))
                    }
                  >
                    <Image
                      source={item.image}
                      style={styles.emojiImg}
                      resizeMode="contain"
                    />
                    <Text
                      style={[
                        styles.emojiLabel,
                        tempData.intensity === item.key &&
                          styles.emojiLabelActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.sectionLabel}>Mood</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.emojiRow}
              >
                {MOODS.map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.emojiItem,
                      tempData.moods.includes(item.key) &&
                        styles.emojiItemActive,
                    ]}
                    onPress={() => toggleMood(item.key)}
                  >
                    <Image
                      source={item.image}
                      style={styles.emojiImg}
                      resizeMode="contain"
                    />
                    <Text
                      style={[
                        styles.emojiLabel,
                        tempData.moods.includes(item.key) &&
                          styles.emojiLabelActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.sectionLabel}>Intimacy</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.emojiRow}
              >
                {INTIMACY.map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.emojiItem,
                      tempData.intimacy.includes(item.key) &&
                        styles.emojiItemActive,
                    ]}
                    onPress={() => toggleIntimacy(item.key)}
                  >
                    <Image
                      source={item.image}
                      style={styles.emojiImg}
                      resizeMode="contain"
                    />
                    <Text
                      style={[
                        styles.emojiLabel,
                        tempData.intimacy.includes(item.key) &&
                          styles.emojiLabelActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.sectionLabel}>Symptoms</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.emojiRow}
              >
                {SYMPTOMS.map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.emojiItem,
                      tempData.symptoms.includes(item.key) &&
                        styles.emojiItemActive,
                    ]}
                    onPress={() => toggleSymptom(item.key)}
                  >
                    <Text style={styles.emojiIcon}>{item.emoji}</Text>
                    <Text
                      style={[
                        styles.emojiLabel,
                        tempData.symptoms.includes(item.key) &&
                          styles.emojiLabelActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity style={styles.saveBtn} onPress={saveSymptoms}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // HEADER
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 12,
  },
  logo: { width: 36, height: 36, marginRight: 12 },
  headerDate: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Montserrat_400Regular",
    color: COLORS.text,
    textAlign: "center",
  },
  calIcon: { width: 26, height: 26 },

  // TÝŽDENNÝ STRIP
  weekStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 20,
    marginTop: 30,
  },
  weekDay: {
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.85)",
    minWidth: 45,
    minHeight: 65,
  },
  weekDayActive: { backgroundColor: COLORS.primary },
  weekDayLabel: {
    fontSize: 16,
    fontFamily: "Montserrat_400Regular",
    color: COLORS.text,
    marginBottom: 1,
  },
  weekDayLabelActive: { color: COLORS.white },
  weekDayNum: {
    fontSize: 16,
    fontFamily: "Montserrat_600SemiBold",
    color: COLORS.text,
  },
  weekDayNumActive: { color: COLORS.white },
  weekDotRow: {
    flexDirection: "row",
    gap: 3,
    position: "absolute",
    bottom: -4,
  },
  weekDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  // KRUH
  circleContainer: {
    alignSelf: "center",
    marginTop: 40,
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    position: "relative",
  },
  // maly na kruhu
  circleDot: {
    position: "absolute",
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  // velky biely
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 8,
    borderColor: "rgba(255,255,255,0.85)",
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
  },
  circleDay: {
    fontSize: 28,
    fontFamily: "BonaNova_400Regular",
    color: COLORS.text,
  },
  circleDayBold: {
    fontFamily: "BonaNova_700Bold",
    fontSize: 36,
  },
  circleLabel: {
    fontSize: 32,
    fontFamily: "BonaNova_400Regular",
    color: COLORS.text,
    marginTop: 2,
  },
  circlePhase: {
    fontSize: 18,
    fontFamily: "Montserrat_400Regular",
    color: COLORS.white,
    marginTop: 8,
    opacity: 0.7,
    textAlign: "center",
  },
  tipCard: {
    marginHorizontal: 32,
    marginTop: 16,
    // backgroundColor: "rgba(255,255,255,0.5)",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  tipText: {
    fontSize: 16,
    fontFamily: "Montserrat_400Regular",
    color: COLORS.white,
    textAlign: "center",
    lineHeight: 18,
  },
  // circleDot: {
  //   position: "absolute",
  //   width: 24,
  //   height: 24,
  //   borderRadius: 12,
  //   backgroundColor: COLORS.primary,
  // },

  // BOTTOM TLAČIDLO
  bottomBtn: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  addPeriodBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 32,
    flexDirection: "row",
    alignItems: "center",
  },
  addBtnPlus: {
    color: COLORS.white,
    fontSize: 25,
    fontWeight: "300",
  },
  addBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: "Montserrat_600SemiBold",
  },

  // KALENDÁR MODAL
  calCard: {
    marginHorizontal: 16,
    marginTop: 40,
    backgroundColor: "rgba(255,255,255,0.82)",
    borderRadius: 16,
    padding: 8,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  // SHEET MODALY
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    maxHeight: "88%",
  },
  miniCalCard: {
    backgroundColor: "#FAF7F5",
    borderRadius: 32,
    padding: 4,
    marginBottom: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Montserrat_600Regular",
    color: COLORS.text,
  },
  modalSub: {
    fontSize: 12,
    fontFamily: "Montserrat_400Regular",
    color: COLORS.textLight,
    marginTop: 2,
  },
  closeBtn: {
    fontSize: 20,
    color: COLORS.textLight,
  },
  modalHint: {
    fontSize: 12,
    fontFamily: "Montserrat_400Regular",
    color: COLORS.textLight,
    textAlign: "center",
    marginBottom: 6,
    marginTop: 10,
  },
  emojiIcon: {
    fontSize: 32,
    height: 40,
    textAlign: "center",
  },
  // EMOJI GRID
  sectionLabel: {
    fontSize: 18,
    fontFamily: "BonaNova_700Bold",
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 10,
  },
  emojiRow: {
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: 10,
    paddingVertical: 4,
  },
  emojiItem: {
    alignItems: "center",
    padding: 10,
    borderRadius: 16,
    backgroundColor: "#FAF7F5",
    borderWidth: 1.5,
    borderColor: "transparent",
    minWidth: 70,
  },
  emojiItemActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  emojiImg: {
    width: 40,
    height: 40,
  },
  emojiLabel: {
    fontSize: 12,
    fontFamily: "Montserrat_400Regular",
    color: COLORS.textLight,
    marginTop: 4,
    textAlign: "center",
  },
  emojiLabelActive: {
    color: COLORS.primary,
    fontFamily: "Montserrat_600SemiBold",
  },

  // SAVE
  saveBtn: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 28,
    alignItems: "center",
    marginTop: 24,
    marginBottom: 8,
  },
  saveBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontFamily: "Montserrat_600SemiBold",
  },
  // nova sekcia
  dayPreview: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: "rgba(255,255,255,0.82)",
    borderRadius: 16,
    padding: 16,
  },
  dayPreviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  dayPreviewDate: {
    fontSize: 14,
    fontFamily: "BonaNova_700Bold",
    color: COLORS.text,
  },
  dayPreviewEdit: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  dayPreviewEditText: {
    fontSize: 12,
    fontFamily: "Montserrat_600SemiBold",
    color: COLORS.white,
  },
  dayPreviewEmpty: {
    fontSize: 12,
    fontFamily: "Montserrat_400Regular",
    color: COLORS.textLight,
    fontStyle: "italic",
  },
  dayPreviewTags: {
    flexDirection: "row",
  },
  previewTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  previewTagText: {
    fontSize: 12,
    fontFamily: "Montserrat_400Regular",
  },
});
