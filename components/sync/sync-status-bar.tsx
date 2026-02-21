import { View, Text } from "react-native";
import { useThemeColor } from "heroui-native";

// icons
import { Feather } from "@expo/vector-icons";

// hooks
import { useNetwork } from "@/hooks/use-network";

export function SyncStatusBar() {
	const { isOnline } = useNetwork();

	const [warning] = useThemeColor(["warning"]);

	// only show when offline
	if (isOnline) {
		return null;
	}

	return (
		<View className="flex-row items-center justify-center py-2 px-4 bg-warning/10">
			<Feather name="wifi-off" size={16} color={warning} />

			<Text className="text-sm ml-2 text-warning">Offline</Text>
		</View>
	);
}
