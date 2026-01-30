import { View, Text } from 'react-native';
import { useThemeColor } from 'heroui-native';

// icons
import { Feather } from '@expo/vector-icons';

// components
import { Button } from 'heroui-native';

interface EmptyStateProps {
  icon?: keyof typeof Feather.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = 'file-text',
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const muted = useThemeColor('muted');

  return (
    <View className='flex-1 items-center justify-center p-8'>
      <Feather name={icon} size={48} color={muted} />

      <Text className='text-lg font-semibold text-foreground mt-4 text-center'>
        {title}
      </Text>

      {description && (
        <Text className='text-sm text-muted mt-2 text-center'>
          {description}
        </Text>
      )}

      {actionLabel && onAction && (
        <Button variant='primary' onPress={onAction} className='mt-6'>
          <Button.Label>{actionLabel}</Button.Label>
        </Button>
      )}
    </View>
  );
}
