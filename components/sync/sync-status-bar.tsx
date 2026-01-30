import { View, Text, Pressable } from "react-native";
import { useThemeColor } from "heroui-native";
import { toast } from "sonner-native";

// icons
import { Feather } from "@expo/vector-icons";

// hooks
import { useSyncState } from "@/hooks/use-sync";
import { useNetwork } from "@/hooks/use-network";
import { useFailedNotes } from "@/hooks/use-failed-notes";

// lib
import { syncManager } from "@/lib/sync/sync-manager";

const statusConfig = {
	idle: null,
	syncing: {
		icon: "cloud" as const,
		message: "Syncing...",
		bgColor: "bg-accent/10",
		textColor: "text-accent",
	},
	error: {
		icon: "alert-circle" as const,
		message: "Sync error",
		bgColor: "bg-danger/10",
		textColor: "text-danger",
	},
};

export function SyncStatusBar() {
	const { status } = useSyncState();
	const { isOnline } = useNetwork();
	const { failedCount } = useFailedNotes();

	const [accent, danger, warning] = useThemeColor([
		"accent",
		"danger",
		"warning",
	]);

	const handleRetry = async () => {
		toast.info("Retrying failed syncs...");
		await syncManager.retryFailedSyncs();
	};

	// show offline indicator if not connected
	if (!isOnline) {
		return (
			<View className="flex-row items-center justify-center py-2 px-4 bg-warning/10">
				<Feather name="wifi-off" size={16} color={warning} />

				<Text className="text-sm ml-2 text-warning">Offline</Text>
			</View>
		);
	}

	// show failed notes indicator with retry button (when idle and there are failures)
	if (status === "idle" && failedCount > 0) {
		return (
			<Pressable
				onPress={handleRetry}
				className="flex-row items-center justify-center py-2 px-4 bg-danger/10 active:bg-danger/20"
			>
				<Feather name="alert-circle" size={16} color={danger} />

				<Text className="text-sm ml-2 text-danger">
					{failedCount} note{failedCount > 1 ? "s" : ""} failed to sync
				</Text>

				<Feather
					name="refresh-cw"
					size={14}
					color={danger}
					style={{ marginLeft: 8 }}
				/>
			</Pressable>
		);
	}

	const config = statusConfig[status];

	// don't show anything when idle and no failures
	if (!config) {
		return null;
	}

	const iconColor = status === "syncing" ? accent : danger;

	return (
		<View
			className={`flex-row items-center justify-center py-2 px-4 ${config.bgColor}`}
		>
			<Feather name={config.icon} size={16} color={iconColor} />

			<Text className={`text-sm ml-2 ${config.textColor}`}>
				{config.message}
			</Text>
		</View>
	);
}
