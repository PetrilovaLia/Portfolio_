import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("fitflow.db");

export function initDatabase() {
  // CYCLE
  db.execSync(`
    CREATE TABLE IF NOT EXISTS cycle_days (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      intensity TEXT,
      symptoms TEXT,
      moods TEXT,
      intimacy TEXT,
      notes TEXT
    );
  `);
  try {
    db.execSync(`ALTER TABLE cycle_days ADD COLUMN intimacy TEXT;`);
  } catch {}

  // CVIKY
  db.execSync(`
    CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      muscle_group TEXT NOT NULL,
      category TEXT NOT NULL,
      is_custom INTEGER DEFAULT 0
    );
  `);

  // TRÉNINGOVÉ PLÁNY
  db.execSync(`
    CREATE TABLE IF NOT EXISTS workout_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  // DNI V PLÁNE (Pondelok = Push atď.)
  db.execSync(`
    CREATE TABLE IF NOT EXISTS plan_days (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id INTEGER NOT NULL,
      day_of_week INTEGER NOT NULL,
      name TEXT,
      is_rest INTEGER DEFAULT 0,
      FOREIGN KEY (plan_id) REFERENCES workout_plans(id)
    );
  `);

  // CVIKY V DNI PLÁNU
  db.execSync(`
    CREATE TABLE IF NOT EXISTS plan_day_exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_day_id INTEGER NOT NULL,
      exercise_id INTEGER NOT NULL,
      target_sets INTEGER,
      target_reps INTEGER,
      target_weight REAL,
      order_index INTEGER DEFAULT 0,
      FOREIGN KEY (plan_day_id) REFERENCES plan_days(id),
      FOREIGN KEY (exercise_id) REFERENCES exercises(id)
    );
  `);

  // TRÉNINGOVÉ ZÁZNAMY (denník)
  db.execSync(`
    CREATE TABLE IF NOT EXISTS workout_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      plan_day_id INTEGER,
      duration_minutes INTEGER,
      rpe INTEGER,
      note TEXT,
      FOREIGN KEY (plan_day_id) REFERENCES plan_days(id)
    );
  `);

  // SÉRIE V ZÁZNAME
  db.execSync(`
    CREATE TABLE IF NOT EXISTS workout_sets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      log_id INTEGER NOT NULL,
      exercise_id INTEGER NOT NULL,
      set_number INTEGER NOT NULL,
      reps INTEGER,
      weight REAL,
      FOREIGN KEY (log_id) REFERENCES workout_logs(id),
      FOREIGN KEY (exercise_id) REFERENCES exercises(id)
    );
  `);

  // Naplň základné cviky ak sú prázdne
  const count = db.getFirstSync(`SELECT COUNT(*) as c FROM exercises;`) as any;
  if (count.c === 0) {
    seedExercises();
  }
}

function seedExercises() {
  const exercises = [
    // PUSH
    ["Bench Press", "chest", "push"],
    ["Incline Bench Press", "chest", "push"],
    ["Decline Bench Press", "chest", "push"],
    ["Dumbbell Fly", "chest", "push"],
    ["Cable Fly", "chest", "push"],
    ["Push Up", "chest", "push"],
    ["Overhead Press", "shoulders", "push"],
    ["Lateral Raise", "shoulders", "push"],
    ["Front Raise", "shoulders", "push"],
    ["Arnold Press", "shoulders", "push"],
    ["Tricep Pushdown", "triceps", "push"],
    ["Skull Crusher", "triceps", "push"],
    ["Overhead Tricep Extension", "triceps", "push"],
    ["Dips", "triceps", "push"],
    // PULL
    ["Pull Up", "back", "pull"],
    ["Lat Pulldown", "back", "pull"],
    ["Seated Cable Row", "back", "pull"],
    ["Bent Over Row", "back", "pull"],
    ["Single Arm Row", "back", "pull"],
    ["Face Pull", "back", "pull"],
    ["Deadlift", "back", "pull"],
    ["Bicep Curl", "biceps", "pull"],
    ["Hammer Curl", "biceps", "pull"],
    ["Incline Curl", "biceps", "pull"],
    ["Cable Curl", "biceps", "pull"],
    // LEGS
    ["Squat", "quads", "legs"],
    ["Front Squat", "quads", "legs"],
    ["Leg Press", "quads", "legs"],
    ["Leg Extension", "quads", "legs"],
    ["Bulgarian Split Squat", "quads", "legs"],
    ["Lunge", "quads", "legs"],
    ["Romanian Deadlift", "hamstrings", "legs"],
    ["Leg Curl", "hamstrings", "legs"],
    ["Hip Thrust", "glutes", "legs"],
    ["Glute Bridge", "glutes", "legs"],
    ["Cable Kickback", "glutes", "legs"],
    ["Calf Raise", "calves", "legs"],
    ["Seated Calf Raise", "calves", "legs"],
    // CORE
    ["Plank", "core", "core"],
    ["Crunch", "core", "core"],
    ["Leg Raise", "core", "core"],
    ["Russian Twist", "core", "core"],
    ["Cable Crunch", "core", "core"],
    ["Ab Wheel", "core", "core"],
    ["Side Plank", "core", "core"],
    // CARDIO
    ["Running", "cardio", "cardio"],
    ["Cycling", "cardio", "cardio"],
    ["Rowing", "cardio", "cardio"],
    ["Jump Rope", "cardio", "cardio"],
    ["Stairmaster", "cardio", "cardio"],
  ];

  for (const [name, muscle_group, category] of exercises) {
    db.runSync(
      `INSERT INTO exercises (name, muscle_group, category) VALUES (?, ?, ?);`,
      [name, muscle_group, category],
    );
  }
}

// ═══════════════════════════════════
// CYCLE FUNKCIE
// ═══════════════════════════════════

export function saveCycleDay(
  date: string,
  intensity: string | undefined,
  symptoms: string[],
  moods: string[],
  intimacy: string[],
) {
  db.runSync(
    `INSERT INTO cycle_days (date, intensity, symptoms, moods, intimacy)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET
       intensity = excluded.intensity,
       symptoms = excluded.symptoms,
       moods = excluded.moods,
       intimacy = excluded.intimacy;`,
    [
      date,
      intensity ?? null,
      JSON.stringify(symptoms),
      JSON.stringify(moods),
      JSON.stringify(intimacy),
    ],
  );
}

export function loadAllCycleDays(): Record<string, any> {
  const rows = db.getAllSync("SELECT * FROM cycle_days;") as any[];
  const result: Record<string, any> = {};
  for (const row of rows) {
    result[row.date] = {
      intensity: row.intensity,
      symptoms: JSON.parse(row.symptoms ?? "[]"),
      moods: JSON.parse(row.moods ?? "[]"),
      intimacy: JSON.parse(row.intimacy ?? "[]"),
    };
  }
  return result;
}

export function deleteCycleDay(date: string) {
  db.runSync("DELETE FROM cycle_days WHERE date = ?;", [date]);
}

function diffDays(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

export function loadCycleStartDates(): string[] {
  const rows = db.getAllSync(
    `SELECT date FROM cycle_days WHERE intensity IS NOT NULL ORDER BY date ASC;`,
  ) as any[];
  if (rows.length === 0) return [];
  const allPeriodDays = rows.map((r) => r.date);
  const startDates: string[] = [];
  for (let i = 0; i < allPeriodDays.length; i++) {
    const current = allPeriodDays[i];
    const previous = allPeriodDays[i - 1];
    if (!previous || diffDays(previous, current) > 1) {
      startDates.push(current);
    }
  }
  return startDates;
}

// ═══════════════════════════════════
// EXERCISE FUNKCIE
// ═══════════════════════════════════

export function loadAllExercises() {
  return db.getAllSync(
    `SELECT * FROM exercises ORDER BY category, name;`,
  ) as any[];
}

export function addCustomExercise(
  name: string,
  muscle_group: string,
  category: string,
) {
  db.runSync(
    `INSERT INTO exercises (name, muscle_group, category, is_custom) VALUES (?, ?, ?, 1);`,
    [name, muscle_group, category],
  );
}

export function deleteCustomExercise(id: number) {
  db.runSync(`DELETE FROM exercises WHERE id = ? AND is_custom = 1;`, [id]);
}

// ═══════════════════════════════════
// WORKOUT PLAN FUNKCIE
// ═══════════════════════════════════

export function loadAllPlans() {
  return db.getAllSync(
    `SELECT * FROM workout_plans ORDER BY created_at DESC;`,
  ) as any[];
}

export function createPlan(name: string) {
  db.runSync(`INSERT INTO workout_plans (name, created_at) VALUES (?, ?);`, [
    name,
    new Date().toISOString(),
  ]);
  return (db.getFirstSync(`SELECT last_insert_rowid() as id;`) as any).id;
}

export function deletePlan(id: number) {
  db.runSync(`DELETE FROM plan_days WHERE plan_id = ?;`, [id]);
  db.runSync(`DELETE FROM workout_plans WHERE id = ?;`, [id]);
}

export function loadPlanDays(planId: number) {
  return db.getAllSync(
    `SELECT * FROM plan_days WHERE plan_id = ? ORDER BY day_of_week;`,
    [planId],
  ) as any[];
}

export function savePlanDay(
  planId: number,
  dayOfWeek: number,
  name: string,
  isRest: boolean,
) {
  db.runSync(
    `INSERT INTO plan_days (plan_id, day_of_week, name, is_rest) VALUES (?, ?, ?, ?)
     ON CONFLICT DO NOTHING;`,
    [planId, dayOfWeek, name, isRest ? 1 : 0],
  );
  return (db.getFirstSync(`SELECT last_insert_rowid() as id;`) as any).id;
}

export function loadPlanDayExercises(planDayId: number) {
  return db.getAllSync(
    `SELECT pde.*, e.name, e.muscle_group, e.category
     FROM plan_day_exercises pde
     JOIN exercises e ON pde.exercise_id = e.id
     WHERE pde.plan_day_id = ?
     ORDER BY pde.order_index;`,
    [planDayId],
  ) as any[];
}

export function addExerciseToPlanDay(
  planDayId: number,
  exerciseId: number,
  targetSets: number,
  targetReps: number,
  targetWeight: number,
  orderIndex: number,
) {
  db.runSync(
    `INSERT INTO plan_day_exercises (plan_day_id, exercise_id, target_sets, target_reps, target_weight, order_index)
     VALUES (?, ?, ?, ?, ?, ?);`,
    [planDayId, exerciseId, targetSets, targetReps, targetWeight, orderIndex],
  );
}

export function removeExerciseFromPlanDay(id: number) {
  db.runSync(`DELETE FROM plan_day_exercises WHERE id = ?;`, [id]);
}

// ═══════════════════════════════════
// WORKOUT LOG FUNKCIE
// ═══════════════════════════════════

export function createWorkoutLog(
  date: string,
  planDayId: number | null,
  note: string,
  rpe: number,
) {
  db.runSync(
    `INSERT INTO workout_logs (date, plan_day_id, note, rpe) VALUES (?, ?, ?, ?);`,
    [date, planDayId, note, rpe],
  );
  return (db.getFirstSync(`SELECT last_insert_rowid() as id;`) as any).id;
}

export function finishWorkoutLog(id: number, durationMinutes: number) {
  db.runSync(`UPDATE workout_logs SET duration_minutes = ? WHERE id = ?;`, [
    durationMinutes,
    id,
  ]);
}

export function loadWorkoutLogs() {
  return db.getAllSync(
    `SELECT wl.*, pd.name as plan_day_name
     FROM workout_logs wl
     LEFT JOIN plan_days pd ON wl.plan_day_id = pd.id
     ORDER BY wl.date DESC;`,
  ) as any[];
}

export function saveWorkoutSet(
  logId: number,
  exerciseId: number,
  setNumber: number,
  reps: number,
  weight: number,
) {
  db.runSync(
    `INSERT INTO workout_sets (log_id, exercise_id, set_number, reps, weight)
     VALUES (?, ?, ?, ?, ?);`,
    [logId, exerciseId, setNumber, reps, weight],
  );
}

export function loadSetsForLog(logId: number) {
  return db.getAllSync(
    `SELECT ws.*, e.name, e.muscle_group
     FROM workout_sets ws
     JOIN exercises e ON ws.exercise_id = e.id
     WHERE ws.log_id = ?
     ORDER BY ws.exercise_id, ws.set_number;`,
    [logId],
  ) as any[];
}

export function loadExerciseHistory(exerciseId: number) {
  return db.getAllSync(
    `SELECT ws.weight, ws.reps, wl.date
     FROM workout_sets ws
     JOIN workout_logs wl ON ws.log_id = wl.id
     WHERE ws.exercise_id = ?
     ORDER BY wl.date ASC;`,
    [exerciseId],
  ) as any[];
}

export function loadPersonalRecords() {
  return db.getAllSync(
    `SELECT e.name, e.muscle_group, MAX(ws.weight) as max_weight, ws.reps, wl.date
     FROM workout_sets ws
     JOIN exercises e ON ws.exercise_id = e.id
     JOIN workout_logs wl ON ws.log_id = wl.id
     GROUP BY ws.exercise_id;`,
  ) as any[];
}
