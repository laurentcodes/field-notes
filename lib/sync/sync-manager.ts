import { AppState, type AppStateStatus } from "react-native";
import NetInfo from "@react-native-community/netinfo";

import { isOnline } from "./network-monitor";
import { handleConflict, isConflictError } from "./conflict-resolver";

// services
import * as notesService from "@/services/notes";

// lib
import * as db from "@/lib/db/queries";
import type { Note } from "@/lib/types/note";

class SyncManager {
	private isSyncing = false;
	private databaseReady = false;
	private syncListeners: Set<(status: "idle" | "syncing" | "error") => void> =
		new Set();

	constructor() {
		this.setupListeners();
	}

	// setup app state and network listeners
	private setupListeners() {
		// listen for app state changes (foreground/background)
		AppState.addEventListener("change", this.handleAppStateChange);

		// listen for network state changes
		NetInfo.addEventListener(this.handleNetworkChange);
	}

	// call this after database migrations complete
	public setDatabaseReady() {
		this.databaseReady = true;
	}

	private handleAppStateChange = (nextAppState: AppStateStatus) => {
		if (nextAppState === "active" && this.databaseReady) {
			// app came to foreground - retry failed syncs (which resets to pending, then syncs all)
			this.retryFailedSyncs();
		}
	};

	private handleNetworkChange = (state: any) => {
		if (state.isConnected && !this.isSyncing && this.databaseReady) {
			// network restored - retry failed syncs
			this.retryFailedSyncs();
		}
	};

	// add sync status listener
	public addListener(listener: (status: "idle" | "syncing" | "error") => void) {
		this.syncListeners.add(listener);
	}

	// remove sync status listener
	public removeListener(
		listener: (status: "idle" | "syncing" | "error") => void,
	) {
		this.syncListeners.delete(listener);
	}

	// notify all listeners of status change
	private notifyListeners(status: "idle" | "syncing" | "error") {
		this.syncListeners.forEach((listener) => listener(status));
	}

	// sync a single note by id
	public async syncNote(noteId: string): Promise<void> {
		console.log("syncing note:", noteId);

		if (!isOnline()) {
			return; // skip if offline
		}

		this.notifyListeners("syncing");

		try {
			// use getNoteByIdForSync to include soft-deleted notes
			const note = await db.getNoteByIdForSync(noteId);

			if (!note || note.syncStatus === "synced") {
				this.notifyListeners("idle");
				return;
			}

			await this.syncSingleNote(note);
			this.notifyListeners("idle");
		} catch (error) {
			console.error("failed to sync note:", error);
			this.notifyListeners("error");
		}
	}

	// sync all pending notes
	public async syncPendingChanges(): Promise<void> {
		if (!isOnline() || this.isSyncing) {
			return;
		}

		this.isSyncing = true;
		this.notifyListeners("syncing");

		try {
			const pendingNotes = await db.getPendingNotes();

			console.log("pending notes:", pendingNotes);

			for (const note of pendingNotes) {
				await this.syncSingleNote(note);
			}

			this.notifyListeners("idle");
		} catch (error) {
			console.error("sync failed:", error);
			this.notifyListeners("error");
		} finally {
			this.isSyncing = false;
		}
	}

	// sync a single note (create, update, or delete)
	private async syncSingleNote(note: Note): Promise<void> {
		try {
			if (note.isDeleted) {
				// delete on server
				await notesService.deleteNote(note.id);

				// hard delete locally after successful api delete
				await db.hardDeleteNote(note.id);
			} else {
				// check if note exists on server by fetching all and filtering
				const serverNotes = await notesService.getAllNotes();
				const existsOnServer = serverNotes.some((n) => n.id === note.id);

				if (existsOnServer) {
					// update existing note on server
					await notesService.updateNote(note.id, {
						title: note.title,
						body: note.body,
						tags: note.tags,
						updatedAt: note.updatedAt,
					});

					// mark as synced
					await db.updateSyncStatus(note.id, "synced");
				} else {
					// create new note on server
					const serverNote = await notesService.createNote({
						title: note.title,
						body: note.body,
						tags: note.tags,
					});

					// server generates the id - delete local note and insert server version
					await db.hardDeleteNote(note.id);
					await db.upsertNoteFromServer({
						id: serverNote.id,
						title: serverNote.title,
						body: serverNote.body,
						tags: serverNote.tags,
						updatedAt: serverNote.updatedAt,
					});
				}
			}
		} catch (error: any) {
			// handle conflict errors (409)
			if (isConflictError(error)) {
				await handleConflict(note, error);
			} else {
				// mark as failed with error message
				const errorMessage = error.message || "sync failed";
				await db.updateSyncStatus(note.id, "failed", errorMessage);
			}
		}
	}

	// pull all notes from server (initial sync or manual refresh)
	// isInitialSync: when true, errors result in 'idle' state instead of 'error' and exception is re-thrown
	public async pullFromServer(isInitialSync = false): Promise<void> {
		if (!isOnline()) {
			return;
		}

		this.isSyncing = true;
		this.notifyListeners("syncing");

		try {
			const serverNotes = await notesService.getAllNotes();
			const serverNoteIds = new Set(serverNotes.map((n) => n.id));

			console.log("Server notes:", serverNotes);

			// upsert each note from server
			for (const serverNote of serverNotes) {
				await db.upsertNoteFromServer({
					id: serverNote.id,
					title: serverNote.title,
					body: serverNote.body,
					tags: serverNote.tags,
					updatedAt: serverNote.updatedAt,
				});
			}

			// remove local synced notes that no longer exist on server (deleted remotely)
			const localSyncedIds = await db.getSyncedNoteIds();

			for (const localId of localSyncedIds) {
				if (!serverNoteIds.has(localId)) {
					console.log("[sync] removing remotely deleted note:", localId);
					await db.hardDeleteNote(localId);
				}
			}

			this.notifyListeners("idle");
		} catch (error) {
			console.error("pull from server failed:", error);

			// initial sync failures should be silent (set idle, not error)
			this.notifyListeners(isInitialSync ? "idle" : "error");

			// re-throw for initial sync to allow caller to handle
			if (isInitialSync) {
				throw error;
			}
		} finally {
			this.isSyncing = false;
		}
	}

	// retry all failed syncs
	public async retryFailedSyncs(): Promise<void> {
		if (!isOnline()) {
			return;
		}

		try {
			const failedNotes = await db.getFailedNotes();

			console.log("Failed notes:", failedNotes);

			for (const note of failedNotes) {
				// reset status to pending
				await db.updateSyncStatus(note.id, "pending");
			}

			// trigger sync
			await this.syncPendingChanges();
		} catch (error) {
			console.error("retry failed syncs error:", error);
		}
	}
}

// export singleton instance
export const syncManager = new SyncManager();
