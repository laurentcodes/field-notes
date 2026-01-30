import { View, ScrollView, Pressable, Text } from 'react-native';
import { useThemeColor } from 'heroui-native';

interface TagFilterProps {
  tags: string[];
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
}

export function TagFilter({ tags, selectedTag, onSelectTag }: TagFilterProps) {
  const allSelected = selectedTag === null;
  
  const [accent, accentForeground, surface, foreground] = useThemeColor([
    'accent',
    'accent-foreground',
    'surface',
    'foreground',
  ]);

  return (
    <View style={{ flexShrink: 0 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingVertical: 8,
          gap: 8,
          alignItems: 'center',
        }}
      >
        <Pressable
          onPress={() => onSelectTag(null)}
          style={{
            backgroundColor: allSelected ? accent : surface,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 16,
          }}
        >
          <Text
            style={{
              color: allSelected ? accentForeground : foreground,
              fontSize: 14,
              fontWeight: '500',
            }}
          >
            All
          </Text>
        </Pressable>

        {tags.map((tag) => {
          const isSelected = selectedTag === tag;
          return (
            <Pressable
              key={tag}
              onPress={() => onSelectTag(tag)}
              style={{
                backgroundColor: isSelected ? accent : surface,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 16,
              }}
            >
              <Text
                style={{
                  color: isSelected ? accentForeground : foreground,
                  fontSize: 14,
                  fontWeight: '500',
                }}
              >
                {tag}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
