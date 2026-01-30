import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// components
import { Card, Divider } from 'heroui-native';
import { ThemeToggle } from '@/components';

export default function SettingsScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <ScrollView className='flex-1 bg-background'>
        <View className='p-4 gap-6'>
          <Text className='text-2xl font-bold text-foreground'>Field Notes</Text>

          <Card>
            <Card.Header>
              <Card.Title>Appearance</Card.Title>
              <Card.Description>
                Customize how Field Notes looks
              </Card.Description>
            </Card.Header>

            <Card.Body>
              <View className='flex-row items-center justify-between mt-3'>
                <Text className='text-foreground'>Theme</Text>
                
                <ThemeToggle />
              </View>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title>About</Card.Title>
            </Card.Header>

            <Card.Body>
              <View className='flex-row items-center justify-between'>
                <Text className='text-foreground'>Version</Text>
                <Text className='text-muted'>1.0.0</Text>
              </View>
            </Card.Body>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
