import { Pressable, StyleSheet, Platform } from 'react-native';
import { useThemeColor } from 'heroui-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// icons
import { Feather } from '@expo/vector-icons';

interface FABProps {
  icon?: keyof typeof Feather.glyphMap;
  onPress: () => void;
  accessibilityLabel?: string;
}

export function FAB({
  icon = 'plus',
  onPress,
  accessibilityLabel = 'Add',
}: FABProps) {
  const [accent, accentForeground] = useThemeColor([
    'accent',
    'accent-foreground',
  ]);
  const insets = useSafeAreaInsets();

  // add extra padding on android to account for native tab bar
  const bottomOffset = Platform.OS === 'android' ? 100 : 70;

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole='button'
      style={[
        styles.fab,
        { backgroundColor: accent, bottom: insets.bottom + bottomOffset },
      ]}
    >
      <Feather name={icon} size={24} color={accentForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
});
