import { View, Text } from "react-native";
import { Button } from "heroui-native";
import { useThemeColor } from "heroui-native";

// icons
import { Feather } from "@expo/vector-icons";

// hooks
import { useTheme } from "@/hooks/useTheme";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
	
  const color = useThemeColor("foreground");

	return (
		<Button variant="ghost" size="sm" onPress={toggleTheme}>
			<View className="flex-row items-center gap-2">
				<Feather
					name={theme === "dark" ? "sun" : "moon"}
					size={18}
					color={color}
				/>

				<Text className="text-foreground">
					{theme === "dark" ? "Dark Mode" : "Light Mode"}
				</Text>
			</View>
		</Button>
	);
}
