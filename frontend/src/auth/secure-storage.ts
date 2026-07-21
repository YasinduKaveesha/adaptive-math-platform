import type { SupportedStorage } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const volatileWebStorage = new Map<string, string>();

/** Native sessions use the keychain/keystore. Web sessions remain memory-only. */
export const authStorage: SupportedStorage = {
  async getItem(key) {
    if (Platform.OS === 'web') return volatileWebStorage.get(key) ?? null;
    return SecureStore.getItemAsync(key);
  },
  async removeItem(key) {
    if (Platform.OS === 'web') {
      volatileWebStorage.delete(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
  async setItem(key, value) {
    if (Platform.OS === 'web') {
      volatileWebStorage.set(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },
};
