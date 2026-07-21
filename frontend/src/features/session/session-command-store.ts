import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { PendingStartSessionCommand } from '@/src/api/contracts';
import { isPendingStartSessionCommand } from '@/src/api/runtime-validation';

const PENDING_START_KEY = 'component_b.pending_start_session';
const ACTIVE_SESSION_KEY = 'component_b.active_session_id';
const webStore = new Map<string, string>();

async function read(key: string) {
  return Platform.OS === 'web' ? webStore.get(key) ?? null : SecureStore.getItemAsync(key);
}

async function write(key: string, value: string) {
  if (Platform.OS === 'web') {
    webStore.set(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

async function remove(key: string) {
  if (Platform.OS === 'web') {
    webStore.delete(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export async function loadPendingStartCommand(): Promise<PendingStartSessionCommand | null> {
  const stored = await read(PENDING_START_KEY);
  if (!stored) return null;
  try {
    const parsed: unknown = JSON.parse(stored);
    if (isPendingStartSessionCommand(parsed)) return parsed;
  } catch {
    // Invalid local recovery data is discarded below and never sent.
  }
  await remove(PENDING_START_KEY);
  return null;
}

export async function savePendingStartCommand(command: PendingStartSessionCommand) {
  await write(PENDING_START_KEY, JSON.stringify(command));
}

export async function clearPendingStartCommand() {
  await remove(PENDING_START_KEY);
}

export async function saveActiveSessionId(sessionId: string) {
  await write(ACTIVE_SESSION_KEY, sessionId);
}
