import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

// theme
import { useThemeColor } from 'heroui-native';

// icons
import { Feather } from '@expo/vector-icons';

// components
import {
  ErrorState,
  LoadingState,
  SyncStatusBadge,
  TagBadge,
} from '@/components';

// db and sync
import { useSyncState } from '@/hooks/use-sync';
import * as db from '@/lib/db/queries';
import { syncManager } from '@/lib/sync/sync-manager';

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function NoteDetailScreen() {
  const router = useRouter();
  
  const queryClient = useQueryClient();

  const { id } = useLocalSearchParams<{ id: string }>();

  const [foreground, muted] = useThemeColor(['foreground', 'muted']);

  const { status: syncStatus } = useSyncState();
  const prevSyncStatus = useRef(syncStatus);

  // inline query - fetch note from sqlite
  const {
    data: note,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['notes', id],
    queryFn: () => db.getNoteById(id as string),
    enabled: !!id,
  });

  // refetch when sync completes (syncing -> idle)
  useEffect(() => {
    if (prevSyncStatus.current === 'syncing' && syncStatus === 'idle') {
      refetch();
    }
    prevSyncStatus.current = syncStatus;
  }, [syncStatus, refetch]);

  // inline mutation - delete note
  const { mutate: deleteNote } = useMutation({
    mutationFn: db.softDeleteNote,
    onSuccess: async () => {
      syncManager.syncNote(id as string);

      await queryClient.invalidateQueries({ queryKey: ['notes'] });

      toast.success('Note Deleted');
     
      router.back();
    },
  });

  const handleEdit = () => {
    router.push(`/notes/${id}/edit`);
  };

  const handleDelete = () => {
    Alert.alert('Delete Note', 'Are you sure you want to delete this note?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteNote(id as string),
      },
    ]);
  };

  if (isLoading) {
    return <LoadingState message='Loading note...' />;
  }

  if (error || !note) {
    return (
      <ErrorState
        title='Note not found'
        message='The note you are looking for does not exist.'
        onRetry={() => router.back()}
      />
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              hitSlop={8}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <Feather
                name='chevron-left'
                size={24}
                color={foreground}
                className='ml-1'
              />
            </Pressable>
          ),
          headerRight: () => (
            <View className='flex-row gap-6 px-3 py-2'>
              <Pressable
                onPress={handleEdit}
                hitSlop={8}
                style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
              >
                <Feather name='edit-2' size={20} color={muted} />
              </Pressable>

              <Pressable
                onPress={handleDelete}
                hitSlop={8}
                style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
              >
                <Feather name='trash-2' size={20} color={muted} />
              </Pressable>
            </View>
          ),
        }}
      />

      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <ScrollView className='flex-1'>
          <View className='p-4 gap-4'>
            <View className='flex-row items-start justify-between'>
              <Text className='text-2xl font-bold text-foreground flex-1 pr-2'>
                {note.title}
              </Text>
              <SyncStatusBadge status={note.syncStatus} />
            </View>

            {note.tags.length > 0 && (
              <View className='flex-row flex-wrap gap-2'>
                {note.tags.map((tag) => (
                  <TagBadge key={tag} label={tag} />
                ))}
              </View>
            )}

            <Text className='text-base text-foreground leading-6'>
              {note.body}
            </Text>

            <View className='mt-8'>
              <View className='flex-row items-center gap-2 mb-2'>
                <Feather name='clock' size={14} color='#888' />

                <Text className='text-xs text-muted'>
                  Created: {formatDate(note.createdAt)}
                </Text>
              </View>

              <View className='flex-row items-center gap-2'>
                <Feather name='edit-3' size={14} color='#888' />

                <Text className='text-xs text-muted'>
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
