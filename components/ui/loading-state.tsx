import { View, ActivityIndicator, Text } from 'react-native';
import { useThemeColor } from 'heroui-native';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message }: LoadingStateProps) {
  const accent = useThemeColor('accent');

  return (
    <View className='flex-1 items-center justify-center p-8'>
      <ActivityIndicator size='large' color={accent} />

      {message && (
        <Text className='text-sm text-muted mt-4 text-center'>{message}</Text>
      )}
    </View>
  );
}
