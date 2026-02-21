import { useState } from "react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";
import { useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";

// components
import { ErrorState, LoadingState, NoteForm } from "@/components";

// lib
import type { NoteFormSchema } from "@/lib/schemas/note";
import { useConvexNote } from "@/hooks/use-convex-note";
import { isOnline } from "@/lib/sync/network-monitor";
import { addPendingMutation, updateCachedNote } from "@/lib/db/queries";
import type { NoteId } from "@/lib/types/note";

export default function EditNoteScreen() {
  const router = useRouter();
  const convex = useConvex();

  const { id } = useLocalSearchParams<{ id: string }>();

  const { note, isLoading } = useConvexNote(id as string);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (data: NoteFormSchema) => {
    setIsSubmitting(true);

    try {
      const payload = {
        id: id as string,
        title: data.title,
        body: data.body,
        tags: data.tags,
      };

      if (isOnline()) {
        await convex.mutation(api.notes.update, {
          id: id as NoteId,
          title: data.title,
          body: data.body,
          tags: data.tags,
        });
      } else {
        // update cache so the ui reflects changes immediately
        await updateCachedNote(id as string, {
          title: data.title,
          body: data.body,
          tags: data.tags,
        });

        await addPendingMutation("update", id as string, payload);
      }

      toast.success("Note Updated");
      router.back();
    } catch (error) {
      console.error("update note error:", error);
      toast.error("Failed to update note");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (isLoading) {
    return <LoadingState message="Loading note..." />;
  }

  if (!note) {
    return (
      <ErrorState
        title="Note not found"
        message="The note you are trying to edit does not exist."
        onRetry={() => router.back()}
      />
    );
  }

  const initialFormValues: NoteFormSchema = {
    title: note.title,
    body: note.body,
    tags: note.tags,
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Edit Note",
          headerBackVisible: false,
        }}
      />

      <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
        <NoteForm
          initialValues={initialFormValues}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      </SafeAreaView>
    </>
  );
}
