import type { Doc, Id } from "@/convex/_generated/dataModel";

export type Note = Doc<"notes">;

export type NoteId = Id<"notes">;

export type SyncStatus = "synced" | "pending";

export interface NoteWithSync extends Note {
  syncStatus: SyncStatus;
}

export interface NoteFormData {
  title: string;
  body: string;
  tags: string[];
}

export interface NotesFilter {
  search: string;
  tag: string | null;
}
