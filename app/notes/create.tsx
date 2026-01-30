import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";

// components
import { NoteForm } from "@/components";

// lib
import * as db from "@/lib/db/queries";
import type { NoteFormSchema } from "@/lib/schemas/note";
import { syncManager } from "@/lib/sync/sync-manager";

export default function CreateNoteScreen() {
	const router = useRouter();
	const queryClient = useQueryClient();

	const { mutate: createNote, isPending: isSubmitting } = useMutation({
		mutationFn: db.insertNote,
		onSuccess: async (note) => {
			syncManager.syncNote(note.id);

			await queryClient.invalidateQueries({ queryKey: ["notes"] });
			toast.success("Note Created");

			router.back();
		},
		onError: (error) => {
			console.error("create note error:", error);
			toast.error("Failed to create note");
		},
	});

	const handleSubmit = (data: NoteFormSchema) => {
		createNote({
			title: data.title,
			body: data.body,
			tags: data.tags,
		});
	};

	const handleCancel = () => {
		router.back();
	};

	return (
		<>
			<Stack.Screen
				options={{
					title: "New Note",
					headerBackVisible: false,
				}}
			/>

			<SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
				<NoteForm
					onSubmit={handleSubmit}
					onCancel={handleCancel}
					isSubmitting={isSubmitting}
				/>
			</SafeAreaView>
		</>
	);
}
