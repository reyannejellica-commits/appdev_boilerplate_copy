import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/** Ordered migrations, applied by PRAGMA user_version. */
const MIGRATIONS: string[] = [
  `
  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'done' CHECK (status IN ('done', 'pending', 'error')),
    error TEXT,
    provider TEXT,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_messages_conversation
    ON messages (conversation_id, created_at);
  `,
  `
  ALTER TABLE messages ADD COLUMN image_uri TEXT;
  `,
  `
  ALTER TABLE messages ADD COLUMN audio_uri TEXT;
  `,
  `
  CREATE TABLE IF NOT EXISTS hunter_profile (
    id TEXT PRIMARY KEY,
    hunter_name TEXT NOT NULL,
    rank TEXT NOT NULL DEFAULT 'E-Rank',
    level INTEGER NOT NULL DEFAULT 1,
    exp INTEGER NOT NULL DEFAULT 0,
    max_exp INTEGER NOT NULL DEFAULT 100,
    streak_days INTEGER NOT NULL DEFAULT 1,
    last_active_date TEXT NOT NULL,
    str INTEGER NOT NULL DEFAULT 10,
    agi INTEGER NOT NULL DEFAULT 10,
    sta INTEGER NOT NULL DEFAULT 10,
    int_stat INTEGER NOT NULL DEFAULT 10
  );

  CREATE TABLE IF NOT EXISTS exercise_logs (
    id TEXT PRIMARY KEY,
    split_id TEXT NOT NULL,
    exercise_name TEXT NOT NULL,
    set_number INTEGER NOT NULL,
    weight_kg REAL NOT NULL DEFAULT 0,
    reps INTEGER NOT NULL DEFAULT 10,
    completed INTEGER NOT NULL DEFAULT 0,
    date TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_exercise_logs_split_date
    ON exercise_logs (split_id, date);

  CREATE TABLE IF NOT EXISTS daily_quests (
    id TEXT PRIMARY KEY,
    quest_key TEXT NOT NULL,
    title TEXT NOT NULL,
    current_count INTEGER NOT NULL DEFAULT 0,
    target_count INTEGER NOT NULL,
    unit TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0,
    exp_reward INTEGER NOT NULL DEFAULT 50,
    date TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_daily_quests_date
    ON daily_quests (date);

  CREATE TABLE IF NOT EXISTS cardio_logs (
    id TEXT PRIMARY KEY,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    distance_km REAL NOT NULL DEFAULT 0,
    calories INTEGER NOT NULL DEFAULT 0,
    date TEXT NOT NULL
  );
  `,
];

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

async function migrate(database: SQLite.SQLiteDatabase): Promise<void> {
  const row = await database.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );
  const version = row?.user_version ?? 0;
  for (let i = version; i < MIGRATIONS.length; i++) {
    await database.execAsync(MIGRATIONS[i]);
    await database.execAsync(`PRAGMA user_version = ${i + 1}`);
  }
}

/** Open (and migrate) the database. Safe to call from anywhere; runs once. */
export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (db) return Promise.resolve(db);
  if (!initPromise) {
    initPromise = (async () => {
      const database = await SQLite.openDatabaseAsync('chat.db');
      await database.execAsync('PRAGMA foreign_keys = ON');
      await migrate(database);
      db = database;
      return database;
    })();
  }
  return initPromise;
}
