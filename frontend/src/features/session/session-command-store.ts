import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { PendingSessionCommand, PendingStartSessionCommand } from '@/src/api/contracts';
import { isPendingSessionCommand } from '@/src/api/runtime-validation';

const PENDING_COMMAND_KEY = 'component_b.pending_start_session';
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

export async function loadPendingCommand(): Promise<PendingSessionCommand | null> {
  const stored = await read(PENDING_COMMAND_KEY);
  if (!stored) return null;
  try {
    const parsed: unknown = JSON.parse(stored);
    if (isPendingSessionCommand(parsed)) return parsed;
  } catch {
    // Invalid local recovery data is discarded below and never sent.
  }
  await remove(PENDING_COMMAND_KEY);
  return null;
}

export async function savePendingCommand(command: PendingSessionCommand) {
  await write(PENDING_COMMAND_KEY, JSON.stringify(command));
}

export async function clearPendingCommand() {
  await remove(PENDING_COMMAND_KEY);
}

export async function loadPendingStartCommand(): Promise<PendingStartSessionCommand | null> {
  const pending = await loadPendingCommand();
  return pending?.kind === 'start_session' ? pending : null;
}

export async function savePendingStartCommand(command: PendingStartSessionCommand) {
  await savePendingCommand(command);
}

export async function clearPendingStartCommand() {
  await clearPendingCommand();
}

export async function saveActiveSessionId(sessionId: string) {
  await write(ACTIVE_SESSION_KEY, sessionId);
}

export async function loadActiveSessionId(): Promise<string | null> {
  const stored = await read(ACTIVE_SESSION_KEY);
  if (typeof stored === 'string' && stored.trim().length > 0) return stored;
  await remove(ACTIVE_SESSION_KEY);
  return null;
}

export async function clearActiveSessionId() {
  await remove(ACTIVE_SESSION_KEY);
}
