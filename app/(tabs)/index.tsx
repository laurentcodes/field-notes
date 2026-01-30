import { FlashList } from "@shopify/flash-list";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Keyboard, Platform, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// query
import { useQuery } from "@tanstack/react-query";

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
import { useSyncState } from "@/hooks/use-sync";
import * as db from "@/lib/db/queries";
import { syncManager } from "@/lib/sync/sync-manager";
import type { Note, NotesFilter } from "@/lib/types/note";

const initialFilterState: NotesFilter = {
	search: "",
	tag: null,
};

export default function NotesListScreen() {
	const router = useRouter();

	const [filter, setFilter] = useState<NotesFilter>(initialFilterState);

	const { status: syncStatus } = useSyncState();

	const listBottomPadding = Platform.OS === "android" ? 120 : 100;

	const {
		data: allNotes,
		refetch,
		isLoading,
	} = useQuery({
		queryKey: ["notes"],
		queryFn: db.getAllNotes,
	});

	const prevSyncStatus = useRef(syncStatus);

	// refetch notes when screen gains focus, dismiss keyboard on blur
	useFocusEffect(
		useCallback(() => {
			refetch();

			return () => {
				Keyboard.dismiss();
			};
		}, [refetch]),
	);

	// refetch when sync completes (syncing -> idle)
	useEffect(() => {
		if (prevSyncStatus.current === "syncing" && syncStatus === "idle") {
			refetch();
		}
		prevSyncStatus.current = syncStatus;
	}, [syncStatus, refetch]);

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
		// push failed changes first
		await syncManager.retryFailedSyncs();
		// then pull server changes
		await syncManager.pullFromServer();

		refetch();
	}, [refetch]);

	const handleNotePress = useCallback(
		(noteId: string) => {
			router.push(`/notes/${noteId}`);
		},
		[router],
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
		({ item }: { item: Note }) => (
			<NoteCard note={item} onPress={() => handleNotePress(item.id)} />
		),
		[handleNotePress],
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
	}, [filter.search, filter.tag, handleCreateNote]);

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
						keyExtractor={(item) => item.id}
						contentContainerStyle={
							filteredNotes?.length === 0
								? { flexGrow: 1 }
								: { paddingBottom: listBottomPadding }
						}
						ListEmptyComponent={renderEmptyList}
						refreshing={syncStatus === "syncing"}
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
