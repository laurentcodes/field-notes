import { useEffect } from "react";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { HeroUINativeProvider } from "heroui-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner-native";

import "../global.css";

// lib
import { runMigrations } from "@/lib/db/migrations";
import { initializeNetworkMonitor, isOnline } from "@/lib/sync/network-monitor";
import { syncManager } from "@/lib/sync/sync-manager";
import * as db from "@/lib/db/queries";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 0,
			retry: 2,
		},
	},
});

// fonts
import FontAwesome from "@expo/vector-icons/FontAwesome";

export {
	// Catch any errors thrown by the Layout component.
	ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
	// Ensure that reloading on `/modal` keeps a back button present.
	initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
	const [loaded, error] = useFonts({
		SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
		...FontAwesome.font,
	});

	// Expo Router uses Error Boundaries to catch errors in the navigation tree.
	useEffect(() => {
		if (error) throw error;
	}, [error]);

	useEffect(() => {
		if (loaded) {
			SplashScreen.hideAsync();
		}
	}, [loaded]);

	// initialize database and sync on mount
	useEffect(() => {
		const initializeApp = async () => {
			try {
				// run database migrations
				await runMigrations();
				console.log("[app] database migrations completed");

				// initialize network monitoring first (before setDatabaseReady)
				await initializeNetworkMonitor();
				console.log("[app] network monitoring initialized");

				// mark database as ready for sync operations
				// this must come after network monitor so isOnline() returns correct value
				syncManager.setDatabaseReady();

				// check if database is empty and attempt initial sync
				const notes = await db.getAllNotes();
				console.log(`[app] database loaded (${notes.length} notes)`);

				if (notes.length === 0 && isOnline()) {
					// first launch while online - attempt initial sync
					try {
						await syncManager.pullFromServer(true);
						console.log("[app] initial sync completed");

						// invalidate notes query so ui refreshes with synced data
						queryClient.invalidateQueries({ queryKey: ["notes"] });
					} catch (syncError) {
						// silent failure - offline-first app should work without server
						console.log("[app] starting in offline mode - initial sync failed");
					}
				} else if (notes.length === 0) {
					// first launch while offline
					console.log("[app] starting offline - no network");
				}
			} catch (error) {
				console.error("[app] failed to initialize:", error);
			}
		};

		initializeApp();
	}, []);

	if (!loaded) {
		return null;
	}

	return <RootLayoutNav />;
}

function RootLayoutNav() {
	return (
		<QueryClientProvider client={queryClient}>
			<GestureHandlerRootView style={{ flex: 1 }}>
				<HeroUINativeProvider
					config={{
						devInfo: {
							stylingPrinciples: false,
						},
					}}
				>
					<Stack>
						<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
						<Stack.Screen name="notes" options={{ headerShown: false }} />
					</Stack>

					<Toaster closeButton />
				</HeroUINativeProvider>
			</GestureHandlerRootView>
		</QueryClientProvider>
	);
}
