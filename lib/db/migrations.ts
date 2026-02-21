import { getDatabase } from "./client";

export const runMigrations = async (): Promise<void> => {
  const db = await getDatabase();

  // drop legacy notes table from pre-convex era
  await db.execAsync(`DROP TABLE IF EXISTS notes;`);

  // cache table mirroring convex notes for offline reads
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS notes_cache (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]',
      updated_at REAL NOT NULL,
      creation_time REAL NOT NULL,
      is_deleted INTEGER NOT NULL DEFAULT 0,
      sync_status TEXT NOT NULL DEFAULT 'synced'
    );
  `);

  // pending mutations queue for offline writes
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS pending_mutations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      note_id TEXT,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
};
