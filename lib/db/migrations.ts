import { getDatabase } from './client';

export const runMigrations = async (): Promise<void> => {
  const db = await getDatabase();

  // create notes table with all required fields
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]',
      updated_at TEXT NOT NULL,
      local_updated_at TEXT NOT NULL,
      sync_status TEXT NOT NULL DEFAULT 'pending',
      is_deleted INTEGER NOT NULL DEFAULT 0,
      last_sync_error TEXT
    );
  `);

  // create indexes for performance
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_notes_sync_status ON notes(sync_status);
  `);

  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at);
  `);

  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_notes_is_deleted ON notes(is_deleted);
  `);
};
