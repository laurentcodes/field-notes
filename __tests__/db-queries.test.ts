import type { Note, SyncStatus } from "@/lib/types/note";

// mock expo-sqlite
const mockRunAsync = jest.fn();
const mockGetAllAsync = jest.fn();
const mockGetFirstAsync = jest.fn();

jest.mock("expo-sqlite", () => ({
	openDatabaseAsync: jest.fn().mockResolvedValue({
		runAsync: mockRunAsync,
		getAllAsync: mockGetAllAsync,
		getFirstAsync: mockGetFirstAsync,
		closeAsync: jest.fn(),
	}),
}));

// mock uuid generation for predictable ids
jest.mock("@/lib/utils/uuid", () => ({
	generateUUID: jest.fn().mockReturnValue("test-uuid-123"),
}));

// mock date utility for predictable timestamps
jest.mock("@/lib/utils/date", () => ({
	getCurrentISOTimestamp: jest.fn().mockReturnValue("2024-01-15T10:00:00.000Z"),
}));

import * as db from "@/lib/db/queries";

describe("Database Queries", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("insertNote", () => {
		it("should create a note with syncStatus pending", async () => {
			// mock the subsequent getNoteById call
			mockGetFirstAsync.mockResolvedValueOnce({
				id: "test-uuid-123",
				title: "Test Note",
				body: "Test body content",
				tags: '["tag1","tag2"]',
				updated_at: "2024-01-15T10:00:00.000Z",
				local_updated_at: "2024-01-15T10:00:00.000Z",
				sync_status: "pending" as SyncStatus,
				is_deleted: 0,
				last_sync_error: null,
			});

			const result = await db.insertNote({
				title: "Test Note",
				body: "Test body content",
				tags: ["tag1", "tag2"],
			});

			// verify insert was called with correct params
			expect(mockRunAsync).toHaveBeenCalledWith(
				expect.stringContaining("INSERT INTO notes"),
				[
					"test-uuid-123",
					"Test Note",
					"Test body content",
					'["tag1","tag2"]',
					"2024-01-15T10:00:00.000Z",
					"2024-01-15T10:00:00.000Z",
					"pending",
					0,
				],
			);

			// verify returned note has pending sync status
			expect(result.syncStatus).toBe("pending");
			expect(result.id).toBe("test-uuid-123");
			expect(result.title).toBe("Test Note");
			expect(result.tags).toEqual(["tag1", "tag2"]);
		});
	});

	describe("getAllNotes", () => {
		it("should return non-deleted notes sorted by updated_at DESC", async () => {
			mockGetAllAsync.mockResolvedValueOnce([
				{
					id: "note-1",
					title: "Newer Note",
					body: "Body 1",
					tags: '["work"]',
					updated_at: "2024-01-15T12:00:00.000Z",
					local_updated_at: "2024-01-15T12:00:00.000Z",
					sync_status: "synced" as SyncStatus,
					is_deleted: 0,
					last_sync_error: null,
				},
				{
					id: "note-2",
					title: "Older Note",
					body: "Body 2",
					tags: "[]",
					updated_at: "2024-01-14T10:00:00.000Z",
					local_updated_at: "2024-01-14T10:00:00.000Z",
					sync_status: "pending" as SyncStatus,
					is_deleted: 0,
					last_sync_error: null,
				},
			]);

			const notes = await db.getAllNotes();

			// verify query excludes deleted notes and orders correctly
			expect(mockGetAllAsync).toHaveBeenCalledWith(
				"SELECT * FROM notes WHERE is_deleted = 0 ORDER BY updated_at DESC",
			);

			expect(notes).toHaveLength(2);
			expect(notes[0].title).toBe("Newer Note");
			expect(notes[1].title).toBe("Older Note");
		});

		it("should return empty array when no notes exist", async () => {
			mockGetAllAsync.mockResolvedValueOnce([]);

			const notes = await db.getAllNotes();

			expect(notes).toEqual([]);
		});
	});

	describe("softDeleteNote", () => {
		it("should mark note as deleted with pending sync status", async () => {
			await db.softDeleteNote("note-to-delete");

			expect(mockRunAsync).toHaveBeenCalledWith(
				expect.stringContaining("is_deleted = 1"),
				["2024-01-15T10:00:00.000Z", "note-to-delete"],
			);

			// verify sync_status is set to pending for sync
			expect(mockRunAsync).toHaveBeenCalledWith(
				expect.stringContaining("sync_status = 'pending'"),
				expect.any(Array),
			);
		});
	});

	describe("updateNote", () => {
		it("should update fields and reset sync status to pending", async () => {
			mockGetFirstAsync.mockResolvedValueOnce({
				id: "note-1",
				title: "Updated Title",
				body: "Updated body",
				tags: '["updated"]',
				updated_at: "2024-01-15T10:00:00.000Z",
				local_updated_at: "2024-01-15T10:00:00.000Z",
				sync_status: "pending" as SyncStatus,
				is_deleted: 0,
				last_sync_error: null,
			});

			const result = await db.updateNote({
				id: "note-1",
				title: "Updated Title",
				body: "Updated body",
				tags: ["updated"],
			});

			// verify update was called
			expect(mockRunAsync).toHaveBeenCalledWith(
				expect.stringContaining("UPDATE notes SET"),
				expect.arrayContaining([
					"Updated Title",
					"Updated body",
					'["updated"]',
					"pending",
				]),
			);

			// verify returned note has pending status
			expect(result.syncStatus).toBe("pending");
			expect(result.title).toBe("Updated Title");
		});
	});

	describe("getPendingNotes", () => {
		it("should return only notes with pending sync status", async () => {
			mockGetAllAsync.mockResolvedValueOnce([
				{
					id: "pending-note",
					title: "Pending Note",
					body: "Body",
					tags: "[]",
					updated_at: "2024-01-15T10:00:00.000Z",
					local_updated_at: "2024-01-15T10:00:00.000Z",
					sync_status: "pending" as SyncStatus,
					is_deleted: 0,
					last_sync_error: null,
				},
			]);

			const notes = await db.getPendingNotes();

			expect(mockGetAllAsync).toHaveBeenCalledWith(
				"SELECT * FROM notes WHERE sync_status = 'pending' ORDER BY local_updated_at ASC",
			);

			expect(notes).toHaveLength(1);
			expect(notes[0].syncStatus).toBe("pending");
		});
	});

	describe("updateSyncStatus", () => {
		it("should update sync status and error message", async () => {
			await db.updateSyncStatus("note-1", "failed", "Network error");

			expect(mockRunAsync).toHaveBeenCalledWith(
				"UPDATE notes SET sync_status = ?, last_sync_error = ? WHERE id = ?",
				["failed", "Network error", "note-1"],
			);
		});

		it("should clear error message when status is synced", async () => {
			await db.updateSyncStatus("note-1", "synced");

			expect(mockRunAsync).toHaveBeenCalledWith(
				"UPDATE notes SET sync_status = ?, last_sync_error = ? WHERE id = ?",
				["synced", null, "note-1"],
			);
		});
	});
});
