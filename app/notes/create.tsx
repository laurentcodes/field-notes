import { useState } from "react";
import { Stack, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";
import { useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";

// components
import { NoteForm } from "@/components";

// lib
import type { NoteFormSchema } from "@/lib/schemas/note";
import { isOnline } from "@/lib/sync/network-monitor";
import { addPendingMutation, insertCachedNote } from "@/lib/db/queries";
import { generateUUID } from "@/lib/utils/uuid";

export default function CreateNoteScreen() {
	const router = useRouter();
	const convex = useConvex();

	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

	const handleSubmit = async (data: NoteFormSchema) => {
		setIsSubmitting(true);

		try {
			const payload = {
				title: data.title,
				body: data.body,
				tags: data.tags,
			};

			if (isOnline()) {
				await convex.mutation(api.notes.create, payload);
			} else {
				// write to cache so it shows in the ui immediately
				const tempId = generateUUID();
				await insertCachedNote(tempId, payload);

				// queue for later sync
				await addPendingMutation("create", null, payload);
			}

			toast.success("Note Created");
			router.back();
		} catch (error) {
			console.error("create note error:", error);
			toast.error("Failed to create note");
		} finally {
			setIsSubmitting(false);
		}
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
