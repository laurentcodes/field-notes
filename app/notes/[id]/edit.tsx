import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

// query
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// components
import { ErrorState, LoadingState, NoteForm } from '@/components';

// lib
import * as db from '@/lib/db/queries';
import type { NoteFormSchema } from '@/lib/schemas/note';
import { syncManager } from '@/lib/sync/sync-manager';

export default function EditNoteScreen() {
  const router = useRouter();

  const queryClient = useQueryClient();

  const { id } = useLocalSearchParams<{ id: string }>();

  const {
    data: note,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['notes', id],
    queryFn: () => db.getNoteById(id as string),
    enabled: !!id,
  });

  const { mutate: updateNote, isPending: isSubmitting } = useMutation({
    mutationFn: db.updateNote,
    onSuccess: async (updatedNote) => {
      syncManager.syncNote(updatedNote.id);

      await queryClient.invalidateQueries({ queryKey: ['notes'] });

      toast.success('Note Updated');

      router.back();
    },
  });

  const handleSubmit = (data: NoteFormSchema) => {
    updateNote({
      id: id as string,
      title: data.title,
      body: data.body,
      tags: data.tags,
    });
  };

  const handleCancel = () => {
    router.back();
  };

  if (isLoading) {
    return <LoadingState message='Loading note...' />;
  }

  if (error || !note) {
    return (
      <ErrorState
        title='Note not found'
        message='The note you are trying to edit does not exist.'
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
          title: 'Edit Note',
          headerBackVisible: false,
        }}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
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
