import { useEffect } from "react";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { HeroUINativeProvider } from "heroui-native";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { Toaster } from "sonner-native";

import "../global.css";

// lib
import { runMigrations } from "@/lib/db/migrations";
import {
	initializeNetworkMonitor,
	setOnConnectivityRestored,
} from "@/lib/sync/network-monitor";
import { processPendingMutations } from "@/lib/sync/offline-sync";

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
  skipConvexDeploymentUrlCheck: true,
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

	// initialize database and network monitoring
	useEffect(() => {
		const initializeApp = async () => {
			try {
				await runMigrations();
				console.log("[app] database migrations completed");

				await initializeNetworkMonitor();
				console.log("[app] network monitoring initialized");

				// process pending mutations on connectivity restored
				setOnConnectivityRestored(() => {
					processPendingMutations(convex);
				});

				// process any pending offline mutations
				await processPendingMutations(convex);
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
		<ConvexProvider client={convex}>
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
		</ConvexProvider>
	);
}
