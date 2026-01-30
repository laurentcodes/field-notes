import { View, Text, Pressable } from 'react-native';
import { useThemeColor } from 'heroui-native';

// components
import { Card } from 'heroui-native';
import { SyncStatusBadge } from './sync-status-badge';

// lib
import type { Note } from '@/lib/types/note';

interface NoteCardProps {
  note: Note;
  onPress: () => void;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export interface TagBadgeProps {
  label: string;
}

export function TagBadge({ label }: TagBadgeProps) {
  const [accent, surface] = useThemeColor(['accent', 'surface']);

  return (
    <View
      style={{
        backgroundColor: surface,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: accent + '30',
      }}
    >
      <Text style={{ color: accent, fontSize: 12, fontWeight: '500' }}>
        {label}
      </Text>
    </View>
  );
}

export function NoteCard({ note, onPress }: NoteCardProps) {
  const displayTags = note.tags.slice(0, 3);
  const hasMoreTags = note.tags.length > 3;

  return (
    <Pressable onPress={onPress}>
      <Card className='mx-4 my-2'>
        <Card.Body className='gap-2'>
          <View className='flex-row items-start justify-between'>
            <Text
              className='text-base font-semibold text-foreground flex-1'
              numberOfLines={1}
            >
              {note.title}
            </Text>

            <SyncStatusBadge status={note.syncStatus} />
          </View>

          <Text className='text-sm text-muted' numberOfLines={2}>
            {note.body}
          </Text>

          <View className='flex-row items-center justify-between mt-1'>
            <View className='flex-row gap-1 flex-1'>
              {displayTags.map((tag) => (
                <TagBadge key={tag} label={tag} />
              ))}

              {hasMoreTags && <TagBadge label={`+${note.tags.length - 3}`} />}
            </View>

            <Text className='text-xs text-muted'>
              {formatDate(note.updatedAt)}
            </Text>
          </View>
        </Card.Body>
      </Card>
    </Pressable>
  );
}
