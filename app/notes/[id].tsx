import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";
import { useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";

// theme
import { useThemeColor } from "heroui-native";

// icons
import { Feather } from "@expo/vector-icons";

// components
import { ErrorState, LoadingState, SyncStatusBadge, TagBadge } from "@/components";

// hooks
import { useConvexNote } from "@/hooks/use-convex-note";

// lib
import { isOnline } from "@/lib/sync/network-monitor";
import { addPendingMutation, deleteCachedNote } from "@/lib/db/queries";
import type { NoteId } from "@/lib/types/note";

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function NoteDetailScreen() {
  const router = useRouter();
  const convex = useConvex();

  const { id } = useLocalSearchParams<{ id: string }>();

  const [foreground, muted] = useThemeColor(["foreground", "muted"]);

  const { note, isLoading } = useConvexNote(id as string);

  const handleEdit = () => {
    router.push(`/notes/${id}/edit`);
  };

  const handleDelete = () => {
    Alert.alert("Delete Note", "Are you sure you want to delete this note?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            if (isOnline()) {
              await convex.mutation(api.notes.remove, {
                id: id as NoteId,
              });
            } else {
              // update cache so the ui reflects the deletion immediately
              await deleteCachedNote(id as string);

              await addPendingMutation("remove", id as string, {
                id: id as string,
              });
            }

            toast.success("Note Deleted");
            router.back();
          } catch (error) {
            console.error("delete note error:", error);
            toast.error("Failed to delete note");
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return <LoadingState message="Loading note..." />;
  }

  if (!note) {
    return (
      <ErrorState
        title="Note not found"
        message="The note you are looking for does not exist."
        onRetry={() => router.back()}
      />
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "",
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              hitSlop={8}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <Feather
                name="chevron-left"
                size={24}
                color={foreground}
                className="ml-1"
              />
            </Pressable>
          ),
          headerRight: () => (
            <View className="flex-row gap-6 px-3 py-2">
              <Pressable
                onPress={handleEdit}
                hitSlop={8}
                style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
              >
                <Feather name="edit-2" size={20} color={muted} />
              </Pressable>

              <Pressable
                onPress={handleDelete}
                hitSlop={8}
                style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
              >
                <Feather name="trash-2" size={20} color={muted} />
              </Pressable>
            </View>
          ),
        }}
      />

      <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
        <ScrollView className="flex-1">
          <View className="p-4 gap-4">
            <View className="flex-row items-start justify-between">
              <Text className="text-2xl font-bold text-foreground flex-1 pr-2">
                {note.title}
              </Text>

              <SyncStatusBadge status={note.syncStatus} />
            </View>

            {note.tags.length > 0 && (
              <View className="flex-row flex-wrap gap-2">
                {note.tags.map((tag) => (
                  <TagBadge key={tag} label={tag} />
                ))}
              </View>
            )}

            <Text className="text-base text-foreground leading-6">
              {note.body}
            </Text>

            <View className="mt-8">
              <View className="flex-row items-center gap-2 mb-2">
                <Feather name="clock" size={14} color="#888" />

                <Text className="text-xs text-muted">
                  Created: {formatDate(note._creationTime)}
                </Text>
              </View>

              <View className="flex-row items-center gap-2">
                <Feather name="edit-3" size={14} color="#888" />

                <Text className="text-xs text-muted">
                  Updated: {formatDate(note.updatedAt)}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
