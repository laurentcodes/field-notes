import axios from "@/utils/axios";

import type {
	NoteApiResponse,
	CreateNoteRequest,
	UpdateNoteRequest,
} from "@/lib/types/note";

export const getAllNotes = async () => {
	const { data } = await axios.get<NoteApiResponse[]>("/notes");
	return data;
};

export const createNote = async (note: CreateNoteRequest) => {
	console.log("api note", note);

	const { data } = await axios.post<NoteApiResponse>("/notes", note);
	return data;
};

export const updateNote = async (id: string, note: UpdateNoteRequest) => {
	const { data } = await axios.patch<NoteApiResponse>(`/notes/${id}`, note);
	return data;
};

export const deleteNote = async (id: string) => {
	await axios.delete(`/notes/${id}`);
};
