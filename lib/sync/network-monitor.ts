import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

let isConnected = true;

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

// initialize network listener
export const initializeNetworkMonitor = async () => {
  // fetch initial network state
  const initialState = await NetInfo.fetch();
  isConnected = getIsOnline(initialState);
  console.log('[network] initial state:', {
    type: initialState.type,
    isConnected: initialState.isConnected,
    isInternetReachable: initialState.isInternetReachable,
    resolved: isConnected,
  });

  // listen for changes
  NetInfo.addEventListener((state) => {
    const wasConnected = isConnected;
    isConnected = getIsOnline(state);
    if (wasConnected !== isConnected) {
      console.log('[network] state changed:', {
        type: state.type,
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        resolved: isConnected,
      });
    }
  });
};

// check if device is online
export const isOnline = (): boolean => {
  return isConnected;
};

// wait for network connection
export const waitForConnection = async (): Promise<void> => {
  if (isConnected) {
    return;
  }

  return new Promise((resolve) => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        unsubscribe();
        resolve();
      }
    });
  });
};
