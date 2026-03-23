import { COLORS } from "@/constants/colors";
import {
  addExerciseToPlanDay,
  createPlan,
  createWorkoutLog,
  finishWorkoutLog,
  loadAllExercises,
  loadAllPlans,
  loadPersonalRecords,
  loadPlanDayExercises,
  loadPlanDays,
  loadWorkoutLogs,
  savePlanDay,
  saveWorkoutSet
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
import { useEffect, useRef, useState } from "react";
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

const { width } = Dimensions.get("window");

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const CATEGORIES = ["push", "pull", "legs", "core", "cardio"];
const MUSCLE_GROUPS = [
  "chest",
  "shoulders",
  "triceps",
  "back",
  "biceps",
  "quads",
  "hamstrings",
  "glutes",
  "calves",
  "core",
  "cardio",
];

type ModalMode =
  | "create_plan"
  | "edit_day"
  | "exercise_picker"
  | "active_workout"
  | "history"
  | "prs"
  | null;

export default function WorkoutScreen() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    BonaNova_400Regular,
    BonaNova_700Bold,
  });

  const [plans, setPlans] = useState<any[]>([]);
  const [activePlanId, setActivePlanId] = useState<number | null>(null);
  const [planDays, setPlanDays] = useState<any[]>([]);
  const [selectedDayIndex, setSelectedDayIndex] = useState(
    new Date().getDay() === 0 ? 6 : new Date().getDay() - 1,
  );
  const [dayExercises, setDayExercises] = useState<any[]>([]);
  const [allExercises, setAllExercises] = useState<any[]>([]);
  const [prs, setPrs] = useState<any[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<any[]>([]);
  const [modalMode, setModalMode] = useState<ModalMode>(null);

  // Create plan
  const [newPlanName, setNewPlanName] = useState("");

  // Edit day
  const [editingDayId, setEditingDayId] = useState<number | null>(null);
  const [editingDayName, setEditingDayName] = useState("");
  const [editingDayIsRest, setEditingDayIsRest] = useState(false);
  const [editingDayExercises, setEditingDayExercises] = useState<any[]>([]);

  // Exercise picker
  const [pickerCategory, setPickerCategory] = useState("push");
  const [pickerSearch, setPickerSearch] = useState("");

  // Active workout
  const [activeLogId, setActiveLogId] = useState<number | null>(null);
  const [activeSets, setActiveSets] = useState<
    Record<number, { reps: string; weight: string }[]>
  >({});
  const [workoutNote, setWorkoutNote] = useState("");
  const [workoutRpe, setWorkoutRpe] = useState(7);
  const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<any>(null);

  const today = new Date().toISOString().split("T")[0];
  const todayDayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

  useEffect(() => {
    refresh();
  }, []);

  const refresh = () => {
    const p = loadAllPlans();
    setPlans(p);
    if (p.length > 0) {
      const id = p[0].id;
      setActivePlanId(id);
      const days = loadPlanDays(id);
      setPlanDays(days);
      if (days.length > 0) {
        const todayDay = days.find((d: any) => d.day_of_week === todayDayIndex);
        if (todayDay) {
          setDayExercises(loadPlanDayExercises(todayDay.id));
        }
      }
    }
    setAllExercises(loadAllExercises());
    setPrs(loadPersonalRecords());
    setWorkoutLogs(loadWorkoutLogs());
  };

  const loadDayExercises = (dayIndex: number) => {
    const day = planDays.find((d: any) => d.day_of_week === dayIndex);
    if (day) setDayExercises(loadPlanDayExercises(day.id));
    else setDayExercises([]);
  };

  // Timer
  const startTimer = () => {
    setWorkoutStartTime(new Date());
    setElapsed(0);
    timerRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const formatElapsed = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const startWorkout = () => {
    const todayDay = planDays.find((d: any) => d.day_of_week === todayDayIndex);
    const logId = createWorkoutLog(today, todayDay?.id ?? null, "", 7);
    setActiveLogId(logId);
    // Init sets pre každý cvik
    const initialSets: Record<number, { reps: string; weight: string }[]> = {};
    dayExercises.forEach((ex: any) => {
      initialSets[ex.exercise_id] = Array(ex.target_sets || 3)
        .fill(null)
        .map(() => ({
          reps: String(ex.target_reps || ""),
          weight: String(ex.target_weight || ""),
        }));
    });
    setActiveSets(initialSets);
    setWorkoutNote("");
    setWorkoutRpe(7);
    startTimer();
    setModalMode("active_workout");
  };

  const finishWorkout = () => {
    if (!activeLogId) return;
    const duration = Math.floor(elapsed / 60);
    finishWorkoutLog(activeLogId, duration);
    // Ulož všetky série
    Object.entries(activeSets).forEach(([exerciseId, sets]) => {
      sets.forEach((set, idx) => {
        if (set.reps && set.weight) {
          saveWorkoutSet(
            activeLogId,
            Number(exerciseId),
            idx + 1,
            Number(set.reps),
            Number(set.weight),
          );
        }
      });
    });
    stopTimer();
    setModalMode(null);
    refresh();
  };

  const createNewPlan = () => {
    if (!newPlanName.trim()) return;
    const planId = createPlan(newPlanName.trim());
    // Vytvor 7 dní
    DAYS.forEach((day, idx) => {
      savePlanDay(planId, idx, day, false);
    });
    setNewPlanName("");
    setModalMode(null);
    refresh();
  };

  const openEditDay = (dayIndex: number) => {
    const day = planDays.find((d: any) => d.day_of_week === dayIndex);
    if (!day) return;
    setEditingDayId(day.id);
    setEditingDayName(day.name ?? DAYS[dayIndex]);
    setEditingDayIsRest(day.is_rest === 1);
    setEditingDayExercises(loadPlanDayExercises(day.id));
    setModalMode("edit_day");
  };

  const addExerciseToDay = (exercise: any) => {
    if (!editingDayId) return;
    addExerciseToPlanDay(
      editingDayId,
      exercise.id,
      3,
      10,
      0,
      editingDayExercises.length,
    );
    setEditingDayExercises(loadPlanDayExercises(editingDayId));
    setModalMode("edit_day");
  };

  const filteredExercises = allExercises.filter(
    (e) =>
      e.category === pickerCategory &&
      e.name.toLowerCase().includes(pickerSearch.toLowerCase()),
  );

  const todayPlanDay = planDays.find(
    (d: any) => d.day_of_week === todayDayIndex,
  );
  const selectedPlanDay = planDays.find(
    (d: any) => d.day_of_week === selectedDayIndex,
  );

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
          <Text style={styles.headerTitle}>Workout</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => {
                setPrs(loadPersonalRecords());
                setModalMode("prs");
              }}
            >
              <Ionicons
                name="trophy-outline"
                size={20}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => {
                setWorkoutLogs(loadWorkoutLogs());
                setModalMode("history");
              }}
            >
              <Ionicons
                name="time-outline"
                size={20}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* TÝŽDENNÝ PLÁN */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Weekly Plan</Text>
          {plans.length === 0 ? (
            <TouchableOpacity onPress={() => setModalMode("create_plan")}>
              <Text style={styles.sectionAction}>+ create plan</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => setModalMode("create_plan")}>
              <Text style={styles.sectionAction}>+ new plan</Text>
            </TouchableOpacity>
          )}
        </View>

        {plans.length === 0 ? (
          <TouchableOpacity
            style={styles.emptyCard}
            onPress={() => setModalMode("create_plan")}
          >
            <Ionicons
              name="add-circle-outline"
              size={32}
              color={COLORS.textMuted}
            />
            <Text style={styles.emptyText}>Create your first workout plan</Text>
          </TouchableOpacity>
        ) : (
          <>
            {/* Plan selector */}
            {plans.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.planSelector}
              >
                {plans.map((plan: any) => (
                  <TouchableOpacity
                    key={plan.id}
                    style={[
                      styles.planChip,
                      activePlanId === plan.id && styles.planChipActive,
                    ]}
                    onPress={() => {
                      setActivePlanId(plan.id);
                      const days = loadPlanDays(plan.id);
                      setPlanDays(days);
                    }}
                  >
                    <Text
                      style={[
                        styles.planChipText,
                        activePlanId === plan.id && styles.planChipTextActive,
                      ]}
                    >
                      {plan.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Dni v týždni */}
            <View style={styles.weekRow}>
              {DAYS.map((day, idx) => {
                const planDay = planDays.find(
                  (d: any) => d.day_of_week === idx,
                );
                const isToday = idx === todayDayIndex;
                const isSelected = idx === selectedDayIndex;
                const isRest = planDay?.is_rest === 1;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.weekDayBtn,
                      isSelected && styles.weekDayBtnActive,
                      isToday && !isSelected && styles.weekDayBtnToday,
                    ]}
                    onPress={() => {
                      setSelectedDayIndex(idx);
                      loadDayExercises(idx);
                    }}
                    onLongPress={() => openEditDay(idx)}
                  >
                    <Text
                      style={[
                        styles.weekDayLabel,
                        isSelected && styles.weekDayLabelActive,
                      ]}
                    >
                      {day}
                    </Text>
                    {isRest ? (
                      <Ionicons
                        name="moon-outline"
                        size={14}
                        color={isSelected ? COLORS.white : COLORS.textMuted}
                      />
                    ) : (
                      <View
                        style={[
                          styles.weekDayDot,
                          isSelected && styles.weekDayDotActive,
                        ]}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Cviky vybraného dňa */}
            <View style={styles.dayCard}>
              <View style={styles.dayCardHeader}>
                <Text style={styles.dayCardTitle}>
                  {selectedPlanDay?.name ?? DAYS[selectedDayIndex]}
                  {selectedDayIndex === todayDayIndex && (
                    <Text style={styles.todayBadge}> · today</Text>
                  )}
                </Text>
                <TouchableOpacity onPress={() => openEditDay(selectedDayIndex)}>
                  <Text style={styles.editBtn}>edit</Text>
                </TouchableOpacity>
              </View>

              {selectedPlanDay?.is_rest === 1 ? (
                <View style={styles.restDay}>
                  <Ionicons
                    name="moon-outline"
                    size={24}
                    color={COLORS.textMuted}
                  />
                  <Text style={styles.restDayText}>Rest day</Text>
                </View>
              ) : dayExercises.length === 0 ? (
                <TouchableOpacity
                  style={styles.emptyDayBtn}
                  onPress={() => openEditDay(selectedDayIndex)}
                >
                  <Ionicons name="add" size={20} color={COLORS.textMuted} />
                  <Text style={styles.emptyDayText}>Add exercises</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.exerciseList}>
                  {dayExercises.map((ex: any, idx: number) => (
                    <View key={idx} style={styles.exerciseRow}>
                      <View style={styles.exerciseMuscleTag}>
                        <Text style={styles.exerciseMuscleText}>
                          {ex.muscle_group}
                        </Text>
                      </View>
                      <View style={styles.exerciseInfo}>
                        <Text style={styles.exerciseName}>{ex.name}</Text>
                        <Text style={styles.exerciseSets}>
                          {ex.target_sets} × {ex.target_reps} reps
                          {ex.target_weight > 0
                            ? ` · ${ex.target_weight} kg`
                            : ""}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        )}

        {/* DNEŠNÝ TRÉNING */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Workout</Text>
        </View>

        {todayPlanDay?.is_rest === 1 ? (
          <View style={styles.restCard}>
            <Ionicons name="moon-outline" size={28} color={COLORS.textMuted} />
            <Text style={styles.restCardText}>
              Rest day – recovery is part of training
            </Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.startBtn} onPress={startWorkout}>
            <Ionicons name="play" size={20} color={COLORS.white} />
            <Text style={styles.startBtnText}>Start Workout</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* ═══ MODAL – CREATE PLAN ═══ */}
      <Modal
        visible={modalMode === "create_plan"}
        animationType="slide"
        transparent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalMode(null)}>
                <Ionicons name="close" size={22} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.modalHeaderTitle}>New Plan</Text>
              <View style={{ width: 22 }} />
            </View>

            <Text style={styles.inputLabel}>PLAN NAME</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Push Pull Legs"
              placeholderTextColor={COLORS.textMuted}
              value={newPlanName}
              onChangeText={setNewPlanName}
            />

            <TouchableOpacity style={styles.saveBtn} onPress={createNewPlan}>
              <Text style={styles.saveBtnText}>Create Plan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ═══ MODAL – EDIT DAY ═══ */}
      <Modal
        visible={modalMode === "edit_day"}
        animationType="slide"
        transparent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={() => {
                    setModalMode(null);
                    loadDayExercises(selectedDayIndex);
                    refresh();
                  }}
                >
                  <Ionicons name="close" size={22} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.modalHeaderTitle}>
                  {DAYS[selectedDayIndex]}
                </Text>
                <View style={{ width: 22 }} />
              </View>

              {/* Rest toggle */}
              <TouchableOpacity
                style={[
                  styles.restToggle,
                  editingDayIsRest && styles.restToggleActive,
                ]}
                onPress={() => setEditingDayIsRest((prev) => !prev)}
              >
                <Ionicons
                  name="moon-outline"
                  size={18}
                  color={editingDayIsRest ? COLORS.white : COLORS.textMuted}
                />
                <Text
                  style={[
                    styles.restToggleText,
                    editingDayIsRest && styles.restToggleTextActive,
                  ]}
                >
                  Rest day
                </Text>
              </TouchableOpacity>

              {!editingDayIsRest && (
                <>
                  <Text style={styles.sectionLabel}>EXERCISES</Text>
                  {editingDayExercises.map((ex: any, idx: number) => (
                    <View key={idx} style={styles.editExerciseRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.editExerciseName}>{ex.name}</Text>
                        <Text style={styles.editExerciseSub}>
                          {ex.muscle_group} · {ex.target_sets}×{ex.target_reps}
                        </Text>
                      </View>
                      <Ionicons
                        name="remove-circle-outline"
                        size={22}
                        color={COLORS.period}
                      />
                    </View>
                  ))}

                  <TouchableOpacity
                    style={styles.addExerciseBtn}
                    onPress={() => {
                      setPickerCategory("push");
                      setPickerSearch("");
                      setModalMode("exercise_picker");
                    }}
                  >
                    <Ionicons name="add" size={20} color={COLORS.text} />
                    <Text style={styles.addExerciseBtnText}>Add exercise</Text>
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={() => {
                  setModalMode(null);
                  loadDayExercises(selectedDayIndex);
                  refresh();
                }}
              >
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ═══ MODAL – EXERCISE PICKER ═══ */}
      <Modal
        visible={modalMode === "exercise_picker"}
        animationType="slide"
        transparent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalMode("edit_day")}>
                <Ionicons name="arrow-back" size={22} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.modalHeaderTitle}>Add Exercise</Text>
              <View style={{ width: 22 }} />
            </View>

            <TextInput
              style={styles.searchInput}
              placeholder="Search..."
              placeholderTextColor={COLORS.textMuted}
              value={pickerSearch}
              onChangeText={setPickerSearch}
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
            >
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    pickerCategory === cat && styles.categoryChipActive,
                  ]}
                  onPress={() => setPickerCategory(cat)}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      pickerCategory === cat && styles.categoryChipTextActive,
                    ]}
                  >
                    {cat.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 400 }}
            >
              {filteredExercises.map((ex: any) => (
                <TouchableOpacity
                  key={ex.id}
                  style={styles.exercisePickerRow}
                  onPress={() => addExerciseToDay(ex)}
                >
                  <View style={styles.exerciseMuscleTag}>
                    <Text style={styles.exerciseMuscleText}>
                      {ex.muscle_group}
                    </Text>
                  </View>
                  <Text style={styles.exercisePickerName}>{ex.name}</Text>
                  <Ionicons
                    name="add-circle-outline"
                    size={22}
                    color={COLORS.textMuted}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ═══ MODAL – ACTIVE WORKOUT ═══ */}
      <Modal visible={modalMode === "active_workout"} animationType="slide">
        <View style={[styles.container, { paddingTop: 56 }]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120 }}
          >
            {/* Header */}
            <View style={styles.activeHeader}>
              <TouchableOpacity
                onPress={() => {
                  stopTimer();
                  setModalMode(null);
                }}
              >
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
              <View style={styles.timerBox}>
                <Ionicons
                  name="timer-outline"
                  size={16}
                  color={COLORS.textMuted}
                />
                <Text style={styles.timerText}>{formatElapsed(elapsed)}</Text>
              </View>
              <TouchableOpacity
                onPress={finishWorkout}
                style={styles.finishBtn}
              >
                <Text style={styles.finishBtnText}>Finish</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.activeTitle}>
              {todayPlanDay?.name ?? "Workout"}
            </Text>

            {/* Cviky */}
            {dayExercises.map((ex: any) => {
              const sets = activeSets[ex.exercise_id] ?? [];
              return (
                <View key={ex.exercise_id} style={styles.activeExerciseCard}>
                  <View style={styles.activeExerciseHeader}>
                    <View style={styles.exerciseMuscleTag}>
                      <Text style={styles.exerciseMuscleText}>
                        {ex.muscle_group}
                      </Text>
                    </View>
                    <Text style={styles.activeExerciseName}>{ex.name}</Text>
                  </View>

                  {/* Header riadok */}
                  <View style={styles.setHeaderRow}>
                    <Text style={styles.setHeaderText}>SET</Text>
                    <Text style={styles.setHeaderText}>REPS</Text>
                    <Text style={styles.setHeaderText}>KG</Text>
                  </View>

                  {sets.map((set, setIdx) => (
                    <View key={setIdx} style={styles.setRow}>
                      <Text style={styles.setNumber}>{setIdx + 1}</Text>
                      <TextInput
                        style={styles.setInput}
                        value={set.reps}
                        onChangeText={(val) => {
                          const newSets = { ...activeSets };
                          newSets[ex.exercise_id] = [...sets];
                          newSets[ex.exercise_id][setIdx] = {
                            ...set,
                            reps: val,
                          };
                          setActiveSets(newSets);
                        }}
                        keyboardType="numeric"
                        placeholder={String(ex.target_reps || "")}
                        placeholderTextColor={COLORS.textMuted}
                      />
                      <TextInput
                        style={styles.setInput}
                        value={set.weight}
                        onChangeText={(val) => {
                          const newSets = { ...activeSets };
                          newSets[ex.exercise_id] = [...sets];
                          newSets[ex.exercise_id][setIdx] = {
                            ...set,
                            weight: val,
                          };
                          setActiveSets(newSets);
                        }}
                        keyboardType="numeric"
                        placeholder={String(ex.target_weight || "")}
                        placeholderTextColor={COLORS.textMuted}
                      />
                    </View>
                  ))}

                  <TouchableOpacity
                    style={styles.addSetBtn}
                    onPress={() => {
                      const newSets = { ...activeSets };
                      newSets[ex.exercise_id] = [
                        ...sets,
                        { reps: "", weight: "" },
                      ];
                      setActiveSets(newSets);
                    }}
                  >
                    <Ionicons name="add" size={16} color={COLORS.textMuted} />
                    <Text style={styles.addSetBtnText}>Add set</Text>
                  </TouchableOpacity>
                </View>
              );
            })}

            {/* RPE */}
            <View style={styles.rpeCard}>
              <Text style={styles.rpeLabel}>HOW HARD WAS IT?</Text>
              <View style={styles.rpeRow}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <TouchableOpacity
                    key={n}
                    style={[
                      styles.rpeBtn,
                      workoutRpe === n && styles.rpeBtnActive,
                    ]}
                    onPress={() => setWorkoutRpe(n)}
                  >
                    <Text
                      style={[
                        styles.rpeBtnText,
                        workoutRpe === n && styles.rpeBtnTextActive,
                      ]}
                    >
                      {n}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Note */}
            <TextInput
              style={styles.noteInput}
              placeholder="Workout note..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              value={workoutNote}
              onChangeText={setWorkoutNote}
            />
          </ScrollView>
        </View>
      </Modal>

      {/* ═══ MODAL – HISTORY ═══ */}
      <Modal
        visible={modalMode === "history"}
        animationType="slide"
        transparent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalMode(null)}>
                <Ionicons name="close" size={22} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.modalHeaderTitle}>History</Text>
              <View style={{ width: 22 }} />
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 500 }}
            >
              {workoutLogs.length === 0 ? (
                <Text style={styles.emptyText}>No workouts yet</Text>
              ) : (
                workoutLogs.map((log: any) => (
                  <View key={log.id} style={styles.historyRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historyDate}>{log.date}</Text>
                      <Text style={styles.historyName}>
                        {log.plan_day_name ?? "Workout"}
                      </Text>
                    </View>
                    <View style={styles.historyMeta}>
                      {log.duration_minutes && (
                        <Text style={styles.historyMetaText}>
                          {log.duration_minutes} min
                        </Text>
                      )}
                      {log.rpe && (
                        <Text style={styles.historyMetaText}>
                          RPE {log.rpe}
                        </Text>
                      )}
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ═══ MODAL – PRs ═══ */}
      <Modal visible={modalMode === "prs"} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalMode(null)}>
                <Ionicons name="close" size={22} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.modalHeaderTitle}>Personal Records</Text>
              <View style={{ width: 22 }} />
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 500 }}
            >
              {prs.length === 0 ? (
                <Text style={styles.emptyText}>No records yet</Text>
              ) : (
                prs.map((pr: any, idx: number) => (
                  <View key={idx} style={styles.prRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.prName}>{pr.name}</Text>
                      <Text style={styles.prMuscle}>{pr.muscle_group}</Text>
                    </View>
                    <View style={styles.prRecord}>
                      <Text style={styles.prWeight}>{pr.max_weight} kg</Text>
                      <Text style={styles.prReps}>× {pr.reps}</Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { paddingBottom: 120 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    gap: 12,
  },
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
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontFamily: "BonaNova_700Bold",
    color: COLORS.text,
  },
  headerRight: { flexDirection: "row", gap: 8 },
  headerBtn: {
    width: 36,
    height: 36,
    backgroundColor: COLORS.bgCard,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "BonaNova_700Bold",
    color: COLORS.text,
  },
  sectionAction: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: COLORS.period,
  },

  emptyCard: {
    marginHorizontal: 20,
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    gap: 12,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: COLORS.textMuted,
    textAlign: "center",
  },

  planSelector: { paddingHorizontal: 20, marginBottom: 12 },
  planChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.bgCard,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  planChipActive: { borderColor: COLORS.period },
  planChipText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: COLORS.textMuted,
  },
  planChipTextActive: { color: COLORS.period, fontFamily: "Inter_600SemiBold" },

  weekRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    gap: 6,
    marginBottom: 12,
  },
  weekDayBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    backgroundColor: COLORS.bgCard,
    borderRadius: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: "transparent",
  },
  weekDayBtnActive: {
    backgroundColor: COLORS.period,
    borderColor: COLORS.period,
  },
  weekDayBtnToday: { borderColor: COLORS.period },
  weekDayLabel: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    color: COLORS.textMuted,
  },
  weekDayLabelActive: { color: COLORS.white },
  weekDayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.bgElevated,
  },
  weekDayDotActive: { backgroundColor: COLORS.white },

  dayCard: {
    marginHorizontal: 16,
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    padding: 16,
  },
  dayCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dayCardTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.text,
  },
  todayBadge: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: COLORS.period,
  },
  editBtn: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: COLORS.textMuted,
  },

  restDay: { alignItems: "center", paddingVertical: 16, gap: 8 },
  restDayText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: COLORS.textMuted,
  },

  emptyDayBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  emptyDayText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: COLORS.textMuted,
  },

  exerciseList: { gap: 8 },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
  },
  exerciseMuscleTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: COLORS.bgElevated,
    borderRadius: 6,
  },
  exerciseMuscleText: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  exerciseInfo: { flex: 1 },
  exerciseName: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: COLORS.text,
  },
  exerciseSets: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: COLORS.textMuted,
    marginTop: 2,
  },

  restCard: {
    marginHorizontal: 20,
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 12,
  },
  restCardText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: COLORS.textMuted,
    textAlign: "center",
  },

  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 20,
    backgroundColor: COLORS.period,
    paddingVertical: 16,
    borderRadius: 32,
  },
  startBtnText: {
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
    maxHeight: "88%",
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

  inputLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.textMuted,
    letterSpacing: 2,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.bgElevated,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: COLORS.text,
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: COLORS.bgElevated,
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: COLORS.text,
    marginBottom: 12,
  },

  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.textMuted,
    letterSpacing: 2,
    marginTop: 16,
    marginBottom: 10,
  },

  restToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 14,
    backgroundColor: COLORS.bgElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  restToggleActive: {
    backgroundColor: COLORS.bgElevated,
    borderColor: COLORS.period,
  },
  restToggleText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: COLORS.textMuted,
  },
  restToggleTextActive: { color: COLORS.period },

  editExerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: COLORS.bgElevated,
    borderRadius: 12,
    marginBottom: 8,
    gap: 10,
  },
  editExerciseName: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: COLORS.text,
  },
  editExerciseSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: COLORS.textMuted,
    marginTop: 2,
  },

  addExerciseBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.bgElevated,
    borderRadius: 12,
    marginTop: 8,
    borderStyle: "dashed",
  },
  addExerciseBtnText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: COLORS.text,
  },

  categoryScroll: { marginBottom: 12 },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: COLORS.bgElevated,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  categoryChipActive: { borderColor: COLORS.period },
  categoryChipText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  categoryChipTextActive: { color: COLORS.period },

  exercisePickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bgElevated,
  },
  exercisePickerName: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: COLORS.text,
  },

  // ACTIVE WORKOUT
  activeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  timerBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.bgCard,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  timerText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.text,
  },
  finishBtn: {
    backgroundColor: COLORS.period,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  finishBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.white,
  },
  activeTitle: {
    fontSize: 22,
    fontFamily: "BonaNova_700Bold",
    color: COLORS.text,
    paddingHorizontal: 20,
    marginBottom: 16,
  },

  activeExerciseCard: {
    marginHorizontal: 16,
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  activeExerciseHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  activeExerciseName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.text,
  },

  setHeaderRow: {
    flexDirection: "row",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  setHeaderText: {
    flex: 1,
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.textMuted,
    letterSpacing: 1,
    textAlign: "center",
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  setNumber: {
    width: 28,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: COLORS.textMuted,
    textAlign: "center",
  },
  setInput: {
    flex: 1,
    backgroundColor: COLORS.bgElevated,
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.text,
    textAlign: "center",
  },
  addSetBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    marginTop: 4,
  },
  addSetBtnText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: COLORS.textMuted,
  },

  rpeCard: {
    marginHorizontal: 16,
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  rpeLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.textMuted,
    letterSpacing: 2,
    marginBottom: 12,
  },
  rpeRow: { flexDirection: "row", justifyContent: "space-between" },
  rpeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.bgElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  rpeBtnActive: { backgroundColor: COLORS.period },
  rpeBtnText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.textMuted,
  },
  rpeBtnTextActive: { color: COLORS.white },

  noteInput: {
    marginHorizontal: 16,
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    padding: 16,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: COLORS.text,
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: 12,
  },

  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bgElevated,
  },
  historyDate: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: COLORS.textMuted,
  },
  historyName: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: COLORS.text,
    marginTop: 2,
  },
  historyMeta: { alignItems: "flex-end", gap: 2 },
  historyMetaText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: COLORS.textMuted,
  },

  prRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bgElevated,
  },
  prName: { fontSize: 14, fontFamily: "Inter_500Medium", color: COLORS.text },
  prMuscle: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: COLORS.textMuted,
    marginTop: 2,
  },
  prRecord: { alignItems: "flex-end" },
  prWeight: { fontSize: 16, fontFamily: "Inter_700Bold", color: COLORS.period },
  prReps: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: COLORS.textMuted,
  },

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
