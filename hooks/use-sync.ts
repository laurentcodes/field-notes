import { useState, useEffect } from "react";

// lib
import { syncManager } from "@/lib/sync/sync-manager";

export type SyncStatus = "idle" | "syncing" | "error";

export const useSyncState = () => {
	const [status, setStatus] = useState<SyncStatus>("idle");

	useEffect(() => {
		const handleStatusChange = (newStatus: SyncStatus) => {
			setStatus(newStatus);
		};

		syncManager.addListener(handleStatusChange);

		return () => {
			syncManager.removeListener(handleStatusChange);
		};
	}, []);

	return { status };
};
