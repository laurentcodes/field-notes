import { View, Text } from 'react-native';
import { useThemeColor } from 'heroui-native';

// icons
import { Feather } from '@expo/vector-icons';

// components
import { Button } from 'heroui-native';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'An error occurred. Please try again.',
  onRetry,
}: ErrorStateProps) {
  const danger = useThemeColor('danger');

  return (
    <View className='flex-1 items-center justify-center p-8'>
      <Feather name='alert-circle' size={48} color={danger} />

      <Text className='text-lg font-semibold text-foreground mt-4 text-center'>
        {title}
      </Text>

      <Text className='text-sm text-muted mt-2 text-center'>{message}</Text>

      {onRetry && (
        <Button variant='primary' onPress={onRetry} className='mt-6'>
          <Feather name='refresh-cw' size={18} color='white' />
          <Button.Label>Try Again</Button.Label>
        </Button>
      )}
    </View>
  );
}
