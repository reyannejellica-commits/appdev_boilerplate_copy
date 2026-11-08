import { getDb, newId } from './client';

export interface HunterProfile {
  id: string;
  hunter_name: string;
  rank: 'E-Rank' | 'D-Rank' | 'C-Rank' | 'B-Rank' | 'A-Rank' | 'S-Rank';
  level: number;
  exp: number;
  max_exp: number;
  streak_days: number;
  last_active_date: string;
  str: number;
  agi: number;
  sta: number;
  int_stat: number;
}

export interface DailyQuest {
  id: string;
  quest_key: string;
  title: string;
  current_count: number;
  target_count: number;
  unit: string;
  completed: boolean;
  exp_reward: number;
  date: string;
}

export interface CardioLog {
  id: string;
  duration_seconds: number;
  distance_km: number;
  calories: number;
  date: string;
}

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calculateRank(level: number): HunterProfile['rank'] {
  if (level >= 50) return 'S-Rank';
  if (level >= 35) return 'A-Rank';
  if (level >= 20) return 'B-Rank';
  if (level >= 10) return 'C-Rank';
  if (level >= 5) return 'D-Rank';
  return 'E-Rank';
}

/** Get or initialize the hunter profile */
export async function getHunterProfile(defaultName = 'Hunter'): Promise<HunterProfile> {
  const db = await getDb();
  const row = await db.getFirstAsync<HunterProfile>('SELECT * FROM hunter_profile LIMIT 1');
  if (row) {
    return {
      ...row,
      rank: calculateRank(row.level),
    };
  }

  const today = getTodayDateString();
  const profile: HunterProfile = {
    id: newId(),
    hunter_name: defaultName,
    rank: 'E-Rank',
    level: 1,
    exp: 0,
    max_exp: 100,
    streak_days: 1,
    last_active_date: today,
    str: 12,
    agi: 10,
    sta: 14,
    int_stat: 10,
  };

  await db.runAsync(
    `INSERT INTO hunter_profile (id, hunter_name, rank, level, exp, max_exp, streak_days, last_active_date, str, agi, sta, int_stat)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    profile.id,
    profile.hunter_name,
    profile.rank,
    profile.level,
    profile.exp,
    profile.max_exp,
    profile.streak_days,
    profile.last_active_date,
    profile.str,
    profile.agi,
    profile.sta,
    profile.int_stat
  );

  return profile;
}

/** Update the hunter's name */
export async function updateHunterName(name: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE hunter_profile SET hunter_name = ?', name.trim() || 'Hunter');
}

/** Add EXP and calculate leveling */
export async function addHunterExp(expGained: number): Promise<{ newLevel: number; leveledUp: boolean }> {
  const db = await getDb();
  const profile = await getHunterProfile();
  let { level, exp, max_exp, str, agi, sta, int_stat } = profile;

  exp += expGained;
  let leveledUp = false;

  while (exp >= max_exp) {
    exp -= max_exp;
    level += 1;
    max_exp = Math.round(max_exp * 1.35);
    str += 2;
    agi += 2;
    sta += 2;
    int_stat += 1;
    leveledUp = true;
  }

  const rank = calculateRank(level);

  await db.runAsync(
    `UPDATE hunter_profile 
     SET level = ?, exp = ?, max_exp = ?, rank = ?, str = ?, agi = ?, sta = ?, int_stat = ?, last_active_date = ?`,
    level,
    exp,
    max_exp,
    rank,
    str,
    agi,
    sta,
    int_stat,
    getTodayDateString()
  );

  return { newLevel: level, leveledUp };
}

/** Default daily quests based on Solo Leveling protocol */
const DEFAULT_QUEST_TEMPLATES = [
  { key: 'pushups', title: 'Push-ups Protocol', target: 100, unit: 'reps', exp: 60 },
  { key: 'situps', title: 'Core Sit-ups Protocol', target: 100, unit: 'reps', exp: 60 },
  { key: 'squats', title: 'Squat Mastery', target: 100, unit: 'reps', exp: 60 },
  { key: 'running', title: 'Daily Running / Cardio', target: 10, unit: 'km', exp: 120 },
  { key: 'workout', title: 'Target Gym Protocol (PPL)', target: 1, unit: 'routine', exp: 150 },
];

/** Fetch or initialize daily quests for a date */
export async function getDailyQuests(dateStr = getTodayDateString()): Promise<DailyQuest[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: string;
    quest_key: string;
    title: string;
    current_count: number;
    target_count: number;
    unit: string;
    completed: number;
    exp_reward: number;
    date: string;
  }>('SELECT * FROM daily_quests WHERE date = ?', dateStr);

  if (rows.length > 0) {
    return rows.map((r) => ({
      ...r,
      completed: r.completed === 1,
    }));
  }

  // Seed default daily quests
  const quests: DailyQuest[] = [];
  for (const t of DEFAULT_QUEST_TEMPLATES) {
    const q: DailyQuest = {
      id: newId(),
      quest_key: t.key,
      title: t.title,
      current_count: 0,
      target_count: t.target,
      unit: t.unit,
      completed: false,
      exp_reward: t.exp,
      date: dateStr,
    };
    await db.runAsync(
      `INSERT INTO daily_quests (id, quest_key, title, current_count, target_count, unit, completed, exp_reward, date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      q.id,
      q.quest_key,
      q.title,
      q.current_count,
      q.target_count,
      q.unit,
      0,
      q.exp_reward,
      q.date
    );
    quests.push(q);
  }

  return quests;
}

/** Update progress on a daily quest */
export async function incrementDailyQuest(
  questKey: string,
  amount: number,
  dateStr = getTodayDateString()
): Promise<{ completedNow: boolean; expGained: number }> {
  const db = await getDb();
  const quest = await db.getFirstAsync<{
    id: string;
    current_count: number;
    target_count: number;
    completed: number;
    exp_reward: number;
  }>('SELECT * FROM daily_quests WHERE quest_key = ? AND date = ?', questKey, dateStr);

  if (!quest) return { completedNow: false, expGained: 0 };

  const wasCompleted = quest.completed === 1;
  const newCount = Math.max(0, quest.current_count + amount);
  const isCompleted = newCount >= quest.target_count;

  await db.runAsync(
    'UPDATE daily_quests SET current_count = ?, completed = ? WHERE id = ?',
    newCount,
    isCompleted ? 1 : 0,
    quest.id
  );

  if (!wasCompleted && isCompleted) {
    await addHunterExp(quest.exp_reward);
    return { completedNow: true, expGained: quest.exp_reward };
  }

  return { completedNow: false, expGained: 0 };
}

/** Log cardio session */
export async function saveCardioSession(
  durationSeconds: number,
  distanceKm: number,
  calories: number
): Promise<void> {
  const db = await getDb();
  const id = newId();
  const date = getTodayDateString();

  await db.runAsync(
    `INSERT INTO cardio_logs (id, duration_seconds, distance_km, calories, date)
     VALUES (?, ?, ?, ?, ?)`,
    id,
    durationSeconds,
    distanceKm,
    calories,
    date
  );

  // Also update running quest
  await incrementDailyQuest('running', Math.round(distanceKm), date);
  // Add some EXP for cardio
  await addHunterExp(Math.round(distanceKm * 15 + durationSeconds / 60));
}

export async function getCardioHistory(limit = 10): Promise<CardioLog[]> {
  const db = await getDb();
  return db.getAllAsync<CardioLog>(
    'SELECT * FROM cardio_logs ORDER BY date DESC, id DESC LIMIT ?',
    limit
  );
}
