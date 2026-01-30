import { toast } from "sonner-native";

// lib
import { upsertNoteFromServer } from "@/lib/db/queries";
import type { Note, NoteApiResponse } from "@/lib/types/note";

interface ConflictError extends Error {
	isConflict: boolean;
	serverVersion: NoteApiResponse;
}

// server-wins conflict resolution strategy
export const handleConflict = async (
	localNote: Note,
	conflictError: ConflictError,
): Promise<void> => {
	const serverNote = conflictError.serverVersion;

	// accept server version
	await upsertNoteFromServer({
		id: serverNote.id,
		title: serverNote.title,
		body: serverNote.body,
		tags: serverNote.tags,
		updatedAt: serverNote.updatedAt,
	});

	// notify user of conflict resolution
	toast.info("Note updated on another device", {
		description: `"${serverNote.title}" was synced from server`,
	});
};

// check if error is a conflict error
export const isConflictError = (error: any): error is ConflictError => {
	return error?.isConflict === true && error?.serverVersion !== undefined;
};
