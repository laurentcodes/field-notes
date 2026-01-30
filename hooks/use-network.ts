import { useState, useEffect } from "react";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";

// determine if device has internet connectivity
const getIsOnline = (state: NetInfoState): boolean => {
	// isConnected: connected to a network (wifi, cellular, etc)
	// isInternetReachable: internet is actually reachable (important on android)
	// on android, isInternetReachable can be null while checking, so we fall back to isConnected
	if (state.isInternetReachable !== null) {
		return state.isInternetReachable;
	}

	return state.isConnected ?? false;
};

export const useNetwork = () => {
	const [isOnline, setIsOnline] = useState<boolean>(true);

	useEffect(() => {
		NetInfo.fetch().then((state) => {
			setIsOnline(getIsOnline(state));
		});

		// listen for changes
		const unsubscribe = NetInfo.addEventListener((state) => {
			setIsOnline(getIsOnline(state));
		});

		return () => {
			unsubscribe();
		};
	}, []);

	return { isOnline };
};
