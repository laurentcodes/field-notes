import { useCallback, useEffect, useState } from "react";

import * as db from "@/lib/db/queries";
import { syncManager } from "@/lib/sync/sync-manager";

// returns count of failed notes for ui display
export const useFailedNotes = () => {
	const [failedCount, setFailedCount] = useState<number>(0);

	const fetchFailedCount = useCallback(async () => {
		try {
			const failedNotes = await db.getFailedNotes();
			setFailedCount(failedNotes.length);
		} catch (error) {
			console.error("failed to fetch failed notes count:", error);
		}
	}, []);

	// fetch count on mount
	useEffect(() => {
		fetchFailedCount();
	}, [fetchFailedCount]);

	// refetch when sync status changes (to update count after retries)
	useEffect(() => {
		const handleStatusChange = () => {
			fetchFailedCount();
		};

		syncManager.addListener(handleStatusChange);

		return () => {
			syncManager.removeListener(handleStatusChange);
		};
	}, [fetchFailedCount]);

	return { failedCount, refetch: fetchFailedCount };
};
