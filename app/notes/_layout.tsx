import { Stack } from 'expo-router';
import { View } from 'react-native';
import { useThemeColor } from 'heroui-native';

export default function NotesLayout() {
  const [background, foreground] = useThemeColor(['background', 'foreground']);

  return (
    <View style={{ flex: 1, backgroundColor: background }}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: background },
          headerTintColor: foreground,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: background },
        }}
      >
        <Stack.Screen
          name='[id]'
          options={{
            title: 'Note',
          }}
        />

        <Stack.Screen
          name='create'
          options={{
            title: 'New Note',
            presentation: 'modal',
          }}
        />

        <Stack.Screen
          name='[id]/edit'
          options={{
            title: 'Edit Note',
            presentation: 'modal',
          }}
        />
      </Stack>
    </View>
  );
}
