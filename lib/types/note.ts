export type SyncStatus = 'synced' | 'pending' | 'failed';

export interface Note {
  id: string;
  title: string;
  body: string;
  tags: string[];
  syncStatus: SyncStatus;
  createdAt: string;
  updatedAt: string;
  localUpdatedAt: string;
  isDeleted: boolean;
  lastSyncError?: string;
}

export interface NoteApiResponse {
  id: string;
  title: string;
  body: string;
  tags: string[];
  updatedAt: string;
}

export interface CreateNoteRequest {
  title: string;
  body: string;
  tags: string[];
}

export interface UpdateNoteRequest {
  title?: string;
  body?: string;
  tags?: string[];
  updatedAt: string;
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
