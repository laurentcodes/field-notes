import { FlashList } from "@shopify/flash-list";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Alert, Keyboard, Platform, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useConvex } from "convex/react";
import { toast } from "sonner-native";
import { api } from "@/convex/_generated/api";

// components
import {
	EmptyState,
	FAB,
	NoteCard,
	SearchBar,
	SyncStatusBar,
	TagFilter,
	LoadingState,
} from "@/components";

// lib
import { useNotes } from "@/hooks/use-convex-notes";
import { processPendingMutations } from "@/lib/sync/offline-sync";
import { isOnline } from "@/lib/sync/network-monitor";
import { addPendingMutation, deleteCachedNote } from "@/lib/db/queries";
import type { NoteWithSync, NoteId, NotesFilter } from "@/lib/types/note";

const initialFilterState: NotesFilter = {
	search: "",
	tag: null,
};

export default function NotesListScreen() {
	const router = useRouter();
	const convex = useConvex();

	const [filter, setFilter] = useState<NotesFilter>(initialFilterState);
	const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

	const { notes: allNotes, isLoading } = useNotes();

	const listBottomPadding = Platform.OS === "android" ? 120 : 100;

	// dismiss keyboard on blur
	useFocusEffect(
		useCallback(() => {
			return () => {
				Keyboard.dismiss();
			};
		}, []),
	);

	const allTags = useMemo(() => {
		const tagSet = new Set<string>();

		allNotes?.forEach((note) => note.tags.forEach((tag) => tagSet.add(tag)));

		return Array.from(tagSet).sort();
	}, [allNotes]);

	const filteredNotes = useMemo(() => {
		return allNotes?.filter((note) => {
			const matchesSearch =
				filter.search === "" ||
				note.title.toLowerCase().includes(filter.search.toLowerCase()) ||
				note.body.toLowerCase().includes(filter.search.toLowerCase());

			const matchesTag = filter.tag === null || note.tags.includes(filter.tag);

			return matchesSearch && matchesTag;
		});
	}, [allNotes, filter]);

	const handleRefresh = useCallback(async () => {
		setIsRefreshing(true);

		try {
			await processPendingMutations(convex);
		} finally {
			setIsRefreshing(false);
		}
	}, [convex]);

	const handleNotePress = useCallback(
		(noteId: string) => {
			router.push(`/notes/${noteId}`);
		},
		[router],
	);

	const handleDeleteNote = useCallback(
		(noteId: string) => {
			Alert.alert("Delete Note", "Are you sure you want to delete this note?", [
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete",
					style: "destructive",
					onPress: async () => {
						try {
							if (isOnline()) {
								await convex.mutation(api.notes.remove, {
									id: noteId as NoteId,
								});
							} else {
								await deleteCachedNote(noteId);
								await addPendingMutation("remove", noteId, { id: noteId });
							}

							toast.success("Note Deleted");
						} catch (error) {
							console.error("delete note error:", error);
							toast.error("Failed to delete note");
						}
					},
				},
			]);
		},
		[convex],
	);

	const handleCreateNote = useCallback(() => {
		router.push("/notes/create");
	}, [router]);

	const handleSearchChange = useCallback((text: string) => {
		setFilter((prev) => ({ ...prev, search: text }));
	}, []);

	const handleTagSelect = useCallback((tag: string | null) => {
		setFilter((prev) => ({ ...prev, tag }));
	}, []);

	const renderNote = useCallback(
		({ item }: { item: NoteWithSync }) => (
			<NoteCard
				note={item}
				onPress={() => handleNotePress(item._id)}
				onDelete={() => handleDeleteNote(item._id)}
			/>
		),
		[handleNotePress, handleDeleteNote],
	);

	const renderEmptyList = useCallback(() => {
		if (filter.search || filter.tag) {
			return (
				<EmptyState
					icon="search"
					title="No notes found"
					description="Try adjusting your search or filter"
				/>
			);
		}

		if (isLoading) {
			return <LoadingState />;
		}

		return (
			<EmptyState
				icon="file-text"
				title="No notes yet"
				description="Create your first note to get started"
				actionLabel="Create Note"
				onAction={handleCreateNote}
			/>
		);
	}, [filter.search, filter.tag, handleCreateNote, isLoading]);

	return (
		<SafeAreaView style={{ flex: 1 }} edges={["top"]}>
			<SyncStatusBar />

			<Pressable
				style={{ flex: 1 }}
				onPress={Keyboard.dismiss}
				accessible={false}
			>
				<View className="flex-1 bg-background">
					<SearchBar value={filter.search} onChangeText={handleSearchChange} />

					{allTags.length > 0 && (
						<TagFilter
							tags={allTags}
							selectedTag={filter.tag}
							onSelectTag={handleTagSelect}
						/>
					)}

					<FlashList
						data={filteredNotes}
						renderItem={renderNote}
						keyExtractor={(item) => item._id}
						contentContainerStyle={
							filteredNotes?.length === 0
								? { flexGrow: 1 }
								: { paddingBottom: listBottomPadding }
						}
						ListEmptyComponent={renderEmptyList}
						refreshing={isRefreshing}
						onRefresh={handleRefresh}
						keyboardDismissMode="on-drag"
						keyboardShouldPersistTaps="handled"
						maintainVisibleContentPosition={{ disabled: true }}
						showsVerticalScrollIndicator={false}
					/>

					<FAB
						icon="plus"
						onPress={handleCreateNote}
						accessibilityLabel="Create new note"
					/>
				</View>
			</Pressable>
		</SafeAreaView>
	);
}
