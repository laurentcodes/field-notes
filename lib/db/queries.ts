import { getDatabase } from "./client";
import { getCurrentISOTimestamp } from "@/lib/utils/date";
import type { Note, NoteWithSync, SyncStatus } from "@/lib/types/note";

// internal sqlite row type for notes cache
interface NotesCacheRow {
  id: string;
  title: string;
  body: string;
  tags: string;
  updated_at: number;
  creation_time: number;
  is_deleted: number;
  sync_status: string;
}

// internal row type for pending mutations
interface PendingMutationRow {
  id: number;
  type: string;
  note_id: string | null;
  payload: string;
  created_at: string;
}

export interface PendingMutation {
  id: number;
  type: "create" | "update" | "remove";
  noteId: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
}

// helper to convert cache row to note object with sync status
const deserializeCacheRow = (row: NotesCacheRow): NoteWithSync => {
  return {
    _id: row.id as Note["_id"],
    _creationTime: row.creation_time,
    title: row.title,
    body: row.body,
    tags: JSON.parse(row.tags),
    updatedAt: row.updated_at,
    isDeleted: row.is_deleted === 1,
    syncStatus: row.sync_status as SyncStatus,
  };
};

// bulk upsert notes from convex into cache
export const cacheNotes = async (notes: Note[]): Promise<void> => {
  const db = await getDatabase();

  // clear existing cache and insert fresh data
  await db.execAsync(`DELETE FROM notes_cache;`);

  for (const note of notes) {
    await db.runAsync(
      `INSERT INTO notes_cache (id, title, body, tags, updated_at, creation_time, is_deleted, sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        note._id,
        note.title,
        note.body,
        JSON.stringify(note.tags),
        note.updatedAt,
        note._creationTime,
        note.isDeleted ? 1 : 0,
        "synced",
      ],
    );
  }
};

// get all cached notes for offline display
export const getCachedNotes = async (): Promise<NoteWithSync[]> => {
  const db = await getDatabase();

  const rows = await db.getAllAsync<NotesCacheRow>(
    "SELECT * FROM notes_cache WHERE is_deleted = 0 ORDER BY updated_at DESC",
  );

  return rows.map(deserializeCacheRow);
};

// get a single cached note
export const getCachedNote = async (id: string): Promise<NoteWithSync | null> => {
  const db = await getDatabase();

  const row = await db.getFirstAsync<NotesCacheRow>(
    "SELECT * FROM notes_cache WHERE id = ? AND is_deleted = 0",
    [id],
  );

  return row ? deserializeCacheRow(row) : null;
};

// insert a note directly into cache (for offline creates)
export const insertCachedNote = async (
  id: string,
  data: { title: string; body: string; tags: string[] },
): Promise<void> => {
  const db = await getDatabase();
  const now = Date.now();

  await db.runAsync(
    `INSERT OR REPLACE INTO notes_cache (id, title, body, tags, updated_at, creation_time, is_deleted, sync_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, data.title, data.body, JSON.stringify(data.tags), now, now, 0, "pending"],
  );
};

// update a note in cache (for offline edits)
export const updateCachedNote = async (
  id: string,
  data: { title?: string; body?: string; tags?: string[] },
): Promise<void> => {
  const db = await getDatabase();
  const now = Date.now();

  const fields: string[] = [];
  const values: any[] = [];

  if (data.title !== undefined) {
    fields.push("title = ?");
    values.push(data.title);
  }
  if (data.body !== undefined) {
    fields.push("body = ?");
    values.push(data.body);
  }
  if (data.tags !== undefined) {
    fields.push("tags = ?");
    values.push(JSON.stringify(data.tags));
  }

  fields.push("updated_at = ?", "sync_status = ?");
  values.push(now, "pending");
  values.push(id);

  await db.runAsync(
    `UPDATE notes_cache SET ${fields.join(", ")} WHERE id = ?`,
    values,
  );
};

// soft delete a note in cache (for offline deletes)
export const deleteCachedNote = async (id: string): Promise<void> => {
  const db = await getDatabase();

  await db.runAsync(
    "UPDATE notes_cache SET is_deleted = 1, updated_at = ? WHERE id = ?",
    [Date.now(), id],
  );
};

// queue an offline mutation
export const addPendingMutation = async (
  type: "create" | "update" | "remove",
  noteId: string | null,
  payload: Record<string, unknown>,
): Promise<void> => {
  const db = await getDatabase();
  const now = getCurrentISOTimestamp();

  await db.runAsync(
    `INSERT INTO pending_mutations (type, note_id, payload, created_at) VALUES (?, ?, ?, ?)`,
    [type, noteId, JSON.stringify(payload), now],
  );
};

// get all pending mutations
export const getPendingMutations = async (): Promise<PendingMutation[]> => {
  const db = await getDatabase();

  const rows = await db.getAllAsync<PendingMutationRow>(
    "SELECT * FROM pending_mutations ORDER BY id ASC",
  );

  return rows.map((row) => ({
    id: row.id,
    type: row.type as PendingMutation["type"],
    noteId: row.note_id,
    payload: JSON.parse(row.payload),
    createdAt: row.created_at,
  }));
};

// remove a pending mutation after it has been synced
export const removePendingMutation = async (id: number): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync("DELETE FROM pending_mutations WHERE id = ?", [id]);
};

// check if there are any pending mutations
export const hasPendingMutations = async (): Promise<boolean> => {
  const db = await getDatabase();

  const row = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM pending_mutations",
  );

  return (row?.count ?? 0) > 0;
};
