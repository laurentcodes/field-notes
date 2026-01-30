import { getDatabase } from "./client";
import { generateUUID } from "@/lib/utils/uuid";
import { getCurrentISOTimestamp } from "@/lib/utils/date";
import type { Note, NoteFormData, SyncStatus } from "@/lib/types/note";

// internal sqlite row type (snake_case columns)
interface NoteRow {
	id: string;
	title: string;
	body: string;
	tags: string;
	updated_at: string;
	local_updated_at: string;
	sync_status: SyncStatus;
	is_deleted: number;
	last_sync_error: string | null;
}

// helper to deserialize sqlite row to note object
const deserializeNote = (row: NoteRow): Note => {
	return {
		id: row.id,
		title: row.title,
		body: row.body,
		tags: JSON.parse(row.tags),
		updatedAt: row.updated_at,
		localUpdatedAt: row.local_updated_at,
		syncStatus: row.sync_status,
		isDeleted: row.is_deleted === 1,
		lastSyncError: row.last_sync_error || undefined,
		createdAt: row.updated_at, // derive from updatedAt
	};
};

// get all non-deleted notes
export const getAllNotes = async (): Promise<Note[]> => {
	const db = await getDatabase();

	const rows = await db.getAllAsync<NoteRow>(
		"SELECT * FROM notes WHERE is_deleted = 0 ORDER BY updated_at DESC",
	);

	return rows.map(deserializeNote);
};

// get single note by id
export const getNoteById = async (id: string): Promise<Note | null> => {
	const db = await getDatabase();

	const row = await db.getFirstAsync<NoteRow>(
		"SELECT * FROM notes WHERE id = ? AND is_deleted = 0",
		[id],
	);

	return row ? deserializeNote(row) : null;
};

// get single note by id including deleted (for sync operations)
export const getNoteByIdForSync = async (id: string): Promise<Note | null> => {
	const db = await getDatabase();

	const row = await db.getFirstAsync<NoteRow>(
		"SELECT * FROM notes WHERE id = ?",
		[id],
	);

	return row ? deserializeNote(row) : null;
};

// insert new note
export const insertNote = async (input: NoteFormData): Promise<Note> => {
	const db = await getDatabase();

	const now = getCurrentISOTimestamp();
	const id = generateUUID();

	await db.runAsync(
		`INSERT INTO notes (
      id, title, body, tags, updated_at, local_updated_at, sync_status, is_deleted
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		[
			id,
			input.title,
			input.body,
			JSON.stringify(input.tags),
			now,
			now,
			"pending",
			0,
		],
	);

	const note = await getNoteById(id);

	console.log("note created:", note);

	if (!note) {
		throw new Error("failed to create note");
	}

	return note;
};

// update existing note
export const updateNote = async (
	params: { id: string } & Partial<NoteFormData>,
): Promise<Note> => {
	const db = await getDatabase();
	const { id, ...updates } = params;
	const now = getCurrentISOTimestamp();

	// build dynamic update query
	const updateFields: string[] = [];
	const updateValues: any[] = [];

	if (updates.title !== undefined) {
		updateFields.push("title = ?");
		updateValues.push(updates.title);
	}

	if (updates.body !== undefined) {
		updateFields.push("body = ?");
		updateValues.push(updates.body);
	}

	if (updates.tags !== undefined) {
		updateFields.push("tags = ?");
		updateValues.push(JSON.stringify(updates.tags));
	}

	// always update timestamps and sync status
	updateFields.push(
		"updated_at = ?",
		"local_updated_at = ?",
		"sync_status = ?",
	);
	updateValues.push(now, now, "pending");

	// add id at the end for WHERE clause
	updateValues.push(id);

	await db.runAsync(
		`UPDATE notes SET ${updateFields.join(", ")} WHERE id = ?`,
		updateValues,
	);

	const note = await getNoteById(id);
	if (!note) {
		throw new Error("failed to update note");
	}

	return note;
};

// soft delete note (mark as deleted)
export const softDeleteNote = async (id: string): Promise<void> => {
	const db = await getDatabase();
	const now = getCurrentISOTimestamp();

	await db.runAsync(
		`UPDATE notes SET is_deleted = 1, sync_status = 'pending', local_updated_at = ? WHERE id = ?`,
		[now, id],
	);
};

// hard delete note (permanently remove from db)
export const hardDeleteNote = async (id: string): Promise<void> => {
	const db = await getDatabase();
	await db.runAsync("DELETE FROM notes WHERE id = ?", [id]);
};

// get all notes pending sync
export const getPendingNotes = async (): Promise<Note[]> => {
	const db = await getDatabase();

	const rows = await db.getAllAsync<NoteRow>(
		"SELECT * FROM notes WHERE sync_status = 'pending' ORDER BY local_updated_at ASC",
	);

	return rows.map(deserializeNote);
};

// get all notes that failed to sync
export const getFailedNotes = async (): Promise<Note[]> => {
	const db = await getDatabase();
	const rows = await db.getAllAsync<NoteRow>(
		"SELECT * FROM notes WHERE sync_status = 'failed' ORDER BY local_updated_at DESC",
	);
	return rows.map(deserializeNote);
};

// update sync status
export const updateSyncStatus = async (
	id: string,
	status: SyncStatus,
	error?: string,
): Promise<void> => {
	const db = await getDatabase();
	await db.runAsync(
		"UPDATE notes SET sync_status = ?, last_sync_error = ? WHERE id = ?",
		[status, error || null, id],
	);
};

// get ids of all synced (non-pending) notes for remote deletion detection
export const getSyncedNoteIds = async (): Promise<string[]> => {
	const db = await getDatabase();

	const rows = await db.getAllAsync<{ id: string }>(
		"SELECT id FROM notes WHERE sync_status = 'synced' AND is_deleted = 0",
	);

	return rows.map((row) => row.id);
};

// update note from server (during sync pull)
export const upsertNoteFromServer = async (serverNote: {
	id: string;
	title: string;
	body: string;
	tags: string[];
	updatedAt: string;
}): Promise<void> => {
	const db = await getDatabase();

	// check if note exists locally
	const existing = await db.getFirstAsync<{ id: string }>(
		"SELECT id FROM notes WHERE id = ?",
		[serverNote.id],
	);

	if (existing) {
		// update existing note
		await db.runAsync(
			`UPDATE notes SET
        title = ?,
        body = ?,
        tags = ?,
        updated_at = ?,
        local_updated_at = ?,
        sync_status = 'synced',
        is_deleted = 0,
        last_sync_error = NULL
      WHERE id = ?`,
			[
				serverNote.title,
				serverNote.body,
				JSON.stringify(serverNote.tags),
				serverNote.updatedAt,
				serverNote.updatedAt,
				serverNote.id,
			],
		);
	} else {
		// insert new note from server
		await db.runAsync(
			`INSERT INTO notes (
        id, title, body, tags, updated_at, local_updated_at, sync_status, is_deleted
      ) VALUES (?, ?, ?, ?, ?, ?, 'synced', 0)`,
			[
				serverNote.id,
				serverNote.title,
				serverNote.body,
				JSON.stringify(serverNote.tags),
				serverNote.updatedAt,
				serverNote.updatedAt,
			],
		);
	}
};
