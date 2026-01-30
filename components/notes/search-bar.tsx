import { useRef } from 'react';
import { Keyboard, Pressable, TextInput, View } from 'react-native';
import { useThemeColor } from 'heroui-native';

// icons
import { Feather } from '@expo/vector-icons';

// components
import { TextField } from 'heroui-native';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search notes',
}: SearchBarProps) {
  const muted = useThemeColor('muted');
  const inputRef = useRef<TextInput>(null);

  const handleClear = () => {
    onChangeText('');
    inputRef.current?.blur();
    Keyboard.dismiss();
  };

  return (
    <View className='px-4 py-2'>
      <TextField>
        <View className='flex-row items-center'>
          <Feather
            name='search'
            size={18}
            color={muted}
            style={{ marginRight: 8 }}
          />

          <TextField.Input
            ref={inputRef}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            className='flex-1'
            returnKeyType='search'
            blurOnSubmit
          />

          {value.length > 0 && (
            <Pressable onPress={handleClear} className='ml-2'>
              <Feather name='x' size={18} color={muted} />
            </Pressable>
          )}
        </View>
      </TextField>
    </View>
  );
}
