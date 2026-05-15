import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

const SESSION_KEY = 'exab_session_id';

/**
 * Returns a persistent anonymous session ID for the device.
 * Now ASYNC — callers must await it.
 *
 * Web:    const id = getSessionId();
 * Mobile: const id = await getSessionId();
 */
export const getSessionId = async () => {
  try {
    let sessionId = await AsyncStorage.getItem(SESSION_KEY);
    if (!sessionId) {
      sessionId = Crypto.randomUUID();
      await AsyncStorage.setItem(SESSION_KEY, sessionId);
    }
    return sessionId;
  } catch (error) {
    console.warn('getSessionId failed:', error);
    // Fallback: non-persistent ID so the app keeps working
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
};