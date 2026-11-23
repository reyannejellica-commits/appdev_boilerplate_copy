import { getDb, newId } from './client';

export interface HunterProfile {
  id: string;
  hunter_name: string;
  rank: 'E-Rank' | 'D-Rank' | 'C-Rank' | 'B-Rank' | 'A-Rank' | 'S-Rank';
  level: number;
  exp: number;
  max_exp: number;
  coins: number;
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
      coins: row.coins !== undefined && row.coins !== null ? row.coins : 190,
    };
  }

  const today = getTodayDateString();
  const profile: HunterProfile = {
    id: newId(),
    hunter_name: defaultName,
    rank: 'B-Rank',
    level: 20,
    exp: 340,
    max_exp: 1000,
    coins: 190,
    streak_days: 4,
    last_active_date: today,
    str: 18,
    agi: 16,
    sta: 20,
    int_stat: 14,
  };

  try {
    await db.runAsync(
      `INSERT INTO hunter_profile (id, hunter_name, rank, level, exp, max_exp, coins, streak_days, last_active_date, str, agi, sta, int_stat)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      profile.id,
      profile.hunter_name,
      profile.rank,
      profile.level,
      profile.exp,
      profile.max_exp,
      profile.coins,
      profile.streak_days,
      profile.last_active_date,
      profile.str,
      profile.agi,
      profile.sta,
      profile.int_stat
    );
  } catch {
    // Fallback if coins column is not yet migrated in old session
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
  }

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

export async function deleteCardioLog(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM cardio_logs WHERE id = ?', id);
}

export async function clearCardioHistory(): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM cardio_logs');
}

export interface DungeonGate {
  id: string;
  title: string;
  rank: 'E-Rank' | 'D-Rank' | 'C-Rank' | 'B-Rank' | 'A-Rank' | 'S-Rank';
  boss_name: string;
  boss_image: string;
  total_hp: number;
  current_hp: number;
  defeated: boolean;
  reward_exp: number;
  reward_title: string;
}

const DEFAULT_GATES: Omit<DungeonGate, 'id'>[] = [
  {
    title: 'Double Dungeon Chamber',
    rank: 'E-Rank',
    boss_name: 'Statue of the God',
    boss_image: 'skull-outline',
    total_hp: 500,
    current_hp: 500,
    defeated: false,
    reward_exp: 250,
    reward_title: 'Courageous Survivor',
  },
  {
    title: 'Blue Venom Insect Cavern',
    rank: 'D-Rank',
    boss_name: 'Blue Venom-Fanged Kasaka',
    boss_image: 'bug-outline',
    total_hp: 1200,
    current_hp: 1200,
    defeated: false,
    reward_exp: 500,
    reward_title: 'Kasaka Poison Tamer',
  },
  {
    title: 'Demon Castle Outskirts',
    rank: 'C-Rank',
    boss_name: 'Cerberus - Gatekeeper of Hell',
    boss_image: 'flame-outline',
    total_hp: 2500,
    current_hp: 2500,
    defeated: false,
    reward_exp: 1000,
    reward_title: 'Hell Gate Infiltrator',
  },
  {
    title: 'High Orc Sovereign Domain',
    rank: 'A-Rank',
    boss_name: 'Kargalgan - High Orc Great Shaman',
    boss_image: 'flash-outline',
    total_hp: 6000,
    current_hp: 6000,
    defeated: false,
    reward_exp: 2500,
    reward_title: 'Curse Destroyer',
  },
  {
    title: 'Jeju Island Ant Queen Hive',
    rank: 'S-Rank',
    boss_name: 'Ant King - Predator of the Black Island',
    boss_image: 'nuclear-outline',
    total_hp: 15000,
    current_hp: 15000,
    defeated: false,
    reward_exp: 10000,
    reward_title: 'Monarch of Shadows',
  },
];

/** Retrieve all dungeon gates or populate defaults */
export async function getDungeonGates(): Promise<DungeonGate[]> {
  const db = await getDb();
  let gates = await db.getAllAsync<any>('SELECT * FROM dungeon_gates ORDER BY total_hp ASC');

  if (gates.length === 0) {
    for (const g of DEFAULT_GATES) {
      const id = newId();
      await db.runAsync(
        `INSERT INTO dungeon_gates (id, title, rank, boss_name, boss_image, total_hp, current_hp, defeated, reward_exp, reward_title)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        id,
        g.title,
        g.rank,
        g.boss_name,
        g.boss_image,
        g.total_hp,
        g.current_hp,
        0,
        g.reward_exp,
        g.reward_title
      );
    }
    gates = await db.getAllAsync<any>('SELECT * FROM dungeon_gates ORDER BY total_hp ASC');
  }

  return gates.map((g) => ({
    ...g,
    defeated: Boolean(g.defeated),
  }));
}

/** Deal damage to a boss through training exertion (reps, volume, cardio) */
export async function attackDungeonBoss(
  gateId: string,
  damage: number
): Promise<{ bossDefeated: boolean; expAwarded: number; newHp: number }> {
  const db = await getDb();
  const gate = await db.getFirstAsync<any>(
    'SELECT * FROM dungeon_gates WHERE id = ?',
    gateId
  );
  if (!gate) return { bossDefeated: false, expAwarded: 0, newHp: 0 };
  if (gate.defeated) return { bossDefeated: false, expAwarded: 0, newHp: 0 };

  const newHp = Math.max(0, gate.current_hp - damage);
  const bossDefeated = newHp === 0;

  await db.runAsync(
    'UPDATE dungeon_gates SET current_hp = ?, defeated = ? WHERE id = ?',
    newHp,
    bossDefeated ? 1 : 0,
    gateId
  );

  let expAwarded = 0;
  if (bossDefeated) {
    expAwarded = gate.reward_exp;
    await addHunterExp(expAwarded);
  }

  return { bossDefeated, expAwarded, newHp };
}

/** Add coins to hunter */
export async function addHunterCoins(amount: number): Promise<number> {
  const db = await getDb();
  const profile = await getHunterProfile();
  const current = profile.coins !== undefined && profile.coins !== null ? profile.coins : 190;
  const newCoins = Math.max(0, current + amount);
  try {
    await db.runAsync('UPDATE hunter_profile SET coins = ?', newCoins);
  } catch {
    // safe fallback
  }
  return newCoins;
}

/** Spend coins if sufficient balance */
export async function spendHunterCoins(amount: number): Promise<boolean> {
  const db = await getDb();
  const profile = await getHunterProfile();
  const current = profile.coins !== undefined && profile.coins !== null ? profile.coins : 190;
  if (current < amount) return false;
  const newCoins = current - amount;
  try {
    await db.runAsync('UPDATE hunter_profile SET coins = ?', newCoins);
  } catch {
    // safe fallback
  }
  return true;
}

/** Get list of unlocked shop item IDs */
export async function getUnlockedShopItems(): Promise<string[]> {
  const db = await getDb();
  try {
    const rows = await db.getAllAsync<{ item_id: string }>(
      'SELECT item_id FROM unlocked_shop_items'
    );
    return rows.map((r) => r.item_id);
  } catch {
    return [];
  }
}

/** Unlock a shop item */
export async function unlockShopItem(itemId: string): Promise<void> {
  const db = await getDb();
  const id = newId();
  try {
    await db.runAsync(
      'INSERT INTO unlocked_shop_items (id, item_id, unlocked_at) VALUES (?, ?, ?)',
      id,
      itemId,
      Date.now()
    );
  } catch {
    // safe fallback
  }
}

/** Get total cardio distance logged */
export async function getTotalCardioDistanceKm(): Promise<number> {
  const db = await getDb();
  try {
    const row = await db.getFirstAsync<{ total_dist: number }>(
      'SELECT SUM(distance_km) as total_dist FROM cardio_logs'
    );
    return row?.total_dist ? Math.round(row.total_dist * 10) / 10 : 0.0;
  } catch {
    return 0.0;
  }
}
