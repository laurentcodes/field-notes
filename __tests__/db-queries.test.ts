// mock expo-sqlite
const mockRunAsync = jest.fn();
const mockGetAllAsync = jest.fn();
const mockGetFirstAsync = jest.fn();
const mockExecAsync = jest.fn();

jest.mock("expo-sqlite", () => ({
	openDatabaseAsync: jest.fn().mockResolvedValue({
		runAsync: mockRunAsync,
		getAllAsync: mockGetAllAsync,
		getFirstAsync: mockGetFirstAsync,
		execAsync: mockExecAsync,
		closeAsync: jest.fn(),
	}),
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

	describe("getCachedNotes", () => {
		it("should return non-deleted cached notes sorted by updated_at DESC", async () => {
			mockGetAllAsync.mockResolvedValueOnce([
				{
					id: "note-1",
					title: "Newer Note",
					body: "Body 1",
					tags: '["work"]',
					updated_at: 1705320000000,
					creation_time: 1705310000000,
					is_deleted: 0,
				},
				{
					id: "note-2",
					title: "Older Note",
					body: "Body 2",
					tags: "[]",
					updated_at: 1705230000000,
					creation_time: 1705220000000,
					is_deleted: 0,
				},
			]);

			const notes = await db.getCachedNotes();

			expect(mockGetAllAsync).toHaveBeenCalledWith(
				"SELECT * FROM notes_cache WHERE is_deleted = 0 ORDER BY updated_at DESC",
			);

			expect(notes).toHaveLength(2);
			expect(notes[0].title).toBe("Newer Note");
			expect(notes[1].title).toBe("Older Note");
		});

		it("should return empty array when no notes exist", async () => {
			mockGetAllAsync.mockResolvedValueOnce([]);

			const notes = await db.getCachedNotes();

			expect(notes).toEqual([]);
		});
	});

	describe("getCachedNote", () => {
		it("should return a single cached note by id", async () => {
			mockGetFirstAsync.mockResolvedValueOnce({
				id: "note-1",
				title: "Test Note",
				body: "Test body",
				tags: '["tag1"]',
				updated_at: 1705320000000,
				creation_time: 1705310000000,
				is_deleted: 0,
			});

			const note = await db.getCachedNote("note-1");

			expect(mockGetFirstAsync).toHaveBeenCalledWith(
				"SELECT * FROM notes_cache WHERE id = ? AND is_deleted = 0",
				["note-1"],
			);

			expect(note).not.toBeNull();
			expect(note?.title).toBe("Test Note");
		});

		it("should return null when note not found", async () => {
			mockGetFirstAsync.mockResolvedValueOnce(null);

			const note = await db.getCachedNote("nonexistent");

			expect(note).toBeNull();
		});
	});

	describe("addPendingMutation", () => {
		it("should insert a pending mutation", async () => {
			await db.addPendingMutation("create", null, {
				title: "New Note",
				body: "Content",
				tags: ["test"],
			});

			expect(mockRunAsync).toHaveBeenCalledWith(
				expect.stringContaining("INSERT INTO pending_mutations"),
				[
					"create",
					null,
					'{"title":"New Note","body":"Content","tags":["test"]}',
					"2024-01-15T10:00:00.000Z",
				],
			);
		});
	});

	describe("getPendingMutations", () => {
		it("should return all pending mutations ordered by id", async () => {
			mockGetAllAsync.mockResolvedValueOnce([
				{
					id: 1,
					type: "create",
					note_id: null,
					payload: '{"title":"Note 1","body":"Body","tags":[]}',
					created_at: "2024-01-15T10:00:00.000Z",
				},
			]);

			const mutations = await db.getPendingMutations();

			expect(mockGetAllAsync).toHaveBeenCalledWith(
				"SELECT * FROM pending_mutations ORDER BY id ASC",
			);

			expect(mutations).toHaveLength(1);
			expect(mutations[0].type).toBe("create");
			expect(mutations[0].payload).toEqual({
				title: "Note 1",
				body: "Body",
				tags: [],
			});
		});
	});

	describe("removePendingMutation", () => {
		it("should delete a pending mutation by id", async () => {
			await db.removePendingMutation(1);

			expect(mockRunAsync).toHaveBeenCalledWith(
				"DELETE FROM pending_mutations WHERE id = ?",
				[1],
			);
		});
	});

	describe("hasPendingMutations", () => {
		it("should return true when there are pending mutations", async () => {
			mockGetFirstAsync.mockResolvedValueOnce({ count: 3 });

			const result = await db.hasPendingMutations();

			expect(result).toBe(true);
		});

		it("should return false when there are no pending mutations", async () => {
			mockGetFirstAsync.mockResolvedValueOnce({ count: 0 });

			const result = await db.hasPendingMutations();

			expect(result).toBe(false);
		});
	});
});
