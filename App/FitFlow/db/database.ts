import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("fitflow.db");

export function initDatabase() {
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
  // Pridaj stĺpec ak už tabuľka existuje (pre existujúce inštalácie)
  try {
    db.execSync(`ALTER TABLE cycle_days ADD COLUMN intimacy TEXT;`);
  } catch {}
}

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

    // Je to začiatok ak predchádzajúci deň nie je deň pred current
    if (!previous || diffDays(previous, current) > 1) {
      startDates.push(current);
    }
  }

  return startDates;
}
