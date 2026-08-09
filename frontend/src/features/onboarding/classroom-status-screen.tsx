import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import type { LearnerMembershipListItem } from '@/src/api/contracts';
import { listLearnerClassrooms } from '@/src/api/learner-onboarding-api';
import { pickMembership } from '@/src/api/membership-selection';
import { useAuth } from '@/src/auth/auth-context';
import { AppText } from '@/src/components/app-text';
import { ScreenShell } from '@/src/components/screen-shell';
import { readPublicConfig } from '@/src/config/env';
import { colors, radius, spacing } from '@/src/theme/tokens';

type StatusPhase = 'loading' | 'ready' | 'error';

function iconFor(
  phase: StatusPhase,
  membership: LearnerMembershipListItem | null,
): React.ComponentProps<typeof Ionicons>['name'] {
  if (phase === 'error') return 'alert-circle-outline';
  if (membership?.state === 'REJECTED') return 'close-circle-outline';
  if (membership?.state === 'APPROVED') return 'checkmark-circle-outline';
  return 'hourglass-outline';
}

function titleFor(phase: StatusPhase, membership: LearnerMembershipListItem | null) {
  if (phase === 'loading') return 'Checking your classroom…';
  if (phase === 'error') return 'We could not check your classroom';
  if (!membership) return 'No classroom yet';
  if (membership.state === 'APPROVED') return 'You are all set!';
  if (membership.state === 'REJECTED') return "That code didn't work";
  return 'Almost there!';
}

function detailFor(phase: StatusPhase, membership: LearnerMembershipListItem | null) {
  if (phase === 'loading') return 'One moment…';
  if (phase === 'error') return 'Check the connection and pull down to try again.';
  if (!membership) return 'Enter a classroom code to get started.';
  if (membership.state === 'APPROVED') return 'Taking you to your lessons…';
  if (membership.state === 'REJECTED') return 'Ask your teacher for a new code and try again.';
  return 'Waiting for your teacher to approve';
}

/**
 * Fetches membership status on mount and pull-to-refresh only — no continuous polling
 * while this screen is foregrounded, per frontend.md 15.10's don't-poll guidance.
 */
export function ClassroomStatusScreen() {
  const palette = colors;
  const { membershipId } = useLocalSearchParams<{ membershipId?: string }>();
  const { getAccessToken } = useAuth();
  const configResult = useMemo(() => readPublicConfig(), []);
  const [phase, setPhase] = useState<StatusPhase>('loading');
  const [membership, setMembership] = useState<LearnerMembershipListItem | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const config = configResult.config;
    if (!config) {
      setPhase('error');
      return;
    }
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        setPhase('error');
        return;
      }
      const response = await listLearnerClassrooms(config, accessToken);
      const found = pickMembership(response.memberships, membershipId);
      setMembership(found);
      setPhase('ready');

      if (found?.state === 'APPROVED') {
        router.replace('/(learner)/home');
      }
    } catch {
      setPhase('error');
    }
  }, [configResult.config, getAccessToken, membershipId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <ScreenShell>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl onRefresh={() => void handleRefresh()} refreshing={refreshing} />
        }>
        <View style={styles.content}>
          <View style={[styles.iconCircle, { backgroundColor: palette.primarySoft }]}>
            <Ionicons color={palette.textPrimary} name={iconFor(phase, membership)} size={42} />
          </View>

          <AppText align="center" variant="title">
            {titleFor(phase, membership)}
          </AppText>
          <AppText align="center" style={{ color: palette.textSecondary }}>
            {detailFor(phase, membership)}
          </AppText>

          {phase === 'loading' ? <ActivityIndicator color={palette.primary} /> : null}

          {phase === 'ready' && membership?.state === 'REJECTED' ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace('/(onboarding)/teacher-link')}
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: palette.primary, borderBottomColor: palette.primaryShadow },
                pressed && styles.buttonPressed,
              ]}>
              <AppText style={[styles.buttonText, { color: palette.primaryForeground }]}>
                TRY A DIFFERENT CODE
              </AppText>
            </Pressable>
          ) : null}

          {phase === 'error' || (phase === 'ready' && !membership) ? (
            <Pressable accessibilityRole="button" onPress={() => void handleRefresh()} style={styles.textButton}>
              <AppText>Check again</AppText>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    alignSelf: 'stretch',
    borderBottomWidth: 4,
    borderRadius: radius.md,
    justifyContent: 'center',
    minHeight: 60,
    paddingHorizontal: spacing.lg,
  },
  buttonPressed: { borderBottomWidth: 0, transform: [{ translateY: 4 }] },
  buttonText: { fontSize: 15, fontWeight: '800', letterSpacing: 0.4 },
  content: { alignItems: 'center', gap: spacing.lg, maxWidth: 520, width: '100%' },
  iconCircle: {
    alignItems: 'center',
    borderRadius: radius.xl,
    height: 88,
    justifyContent: 'center',
    width: 88,
  },
  scrollContent: { alignItems: 'center', flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  textButton: { justifyContent: 'center', minHeight: 44 },
});
