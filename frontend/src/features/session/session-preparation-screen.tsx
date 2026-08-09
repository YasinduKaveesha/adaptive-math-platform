import { Ionicons } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { PendingStartSessionCommand, SessionCommandResponse } from '@/src/api/contracts';
import { createComponentBApi, getComponentBDevelopmentFixture } from '@/src/api/component-b-api';
import { ApiClientError } from '@/src/api/errors';
import type { ActiveSessionResponse } from '@/src/api/generated/openapi-types';
import { useAuth } from '@/src/auth/auth-context';
import { AppText } from '@/src/components/app-text';
import { readPublicConfig } from '@/src/config/env';
import { LearnerTabBar } from '@/src/features/navigation/learner-tab-bar';
import {
  clearPendingStartCommand,
  loadPendingStartCommand,
  saveActiveSessionId,
  savePendingStartCommand,
} from '@/src/features/session/session-command-store';
import { colors, radius, spacing, typography } from '@/src/theme/tokens';
import { firstNameOf } from '@/src/utils/display-name';

const brandArtwork = require('../../../assets/images/mathmingo-header.png');
const heroArtwork = require('../../../assets/images/prepare-hero.png');
const heroAspectRatio = 1672 / 941;
const heroBorderWidth = 4;

// No skill is named on this screen, by necessity rather than preference: `skill_id` does not
// exist until a question is selected, and selection is what starts the child's timeout clock
// (timeout_deadline_utc = now + timeout, opportunity_persistence.py). GET /b/sessions/active
// cannot report whether a question is already open, so asking for the skill here would risk
// creating one and starting that clock while the child is still reading this screen. The real
// skill is shown per question on the live session screen, where OpportunityPresentationResponse
// carries skill_id legitimately and for free.
const gradeLabels: Record<'GRADE_2' | 'GRADE_3', string> = {
  GRADE_2: 'Grade 2',
  GRADE_3: 'Grade 3',
};

// GET /api/v1/b/sessions/active is a UX affordance, not a correctness requirement: it exists so
// the child sees "Resume" before tapping, instead of discovering it after. POST /api/v1/b/sessions
// never 409s on an existing session (it takes an advisory lock, finds any starting-or-active
// session for the learner, and returns it with 201 regardless of idempotency key — see
// b_session_lifecycle.py:185-194), so a failed or stale read here is self-correcting: if a session
// actually exists, starting "a new one" anyway just returns it. That is why this check is safe to
// treat as best-effort — any failure (including the fixture, which does not implement this call)
// degrades silently to the Start label rather than a new error phase.
export async function resolveResumableSessionId(
  api: { getActiveSession: (accessToken: string) => Promise<ActiveSessionResponse> },
  accessToken: string,
): Promise<string | null> {
  try {
    const { session } = await api.getActiveSession(accessToken);
    if (session && session.state === 'active') return session.session_id;
    return null;
  } catch {
    return null;
  }
}

type PreparationPhase =
  | 'checking-identity'
  | 'checking-readiness'
  | 'ready'
  | 'starting-session'
  | 'active-session'
  | 'authentication-failure'
  | 'access-denied'
  | 'readiness-failure'
  | 'network-failure'
  | 'technical-failure';

type LearnerView = { displayName: string };

function createStartCommand(): PendingStartSessionCommand {
  return {
    createdAt: new Date().toISOString(),
    endpoint: '/api/v1/b/sessions',
    idempotencyKey: Crypto.randomUUID(),
    kind: 'start_session',
  };
}

function readinessCopy(phase: PreparationPhase) {
  if (phase === 'checking-identity' || phase === 'checking-readiness') {
    return { title: 'Checking session', detail: 'Getting everything ready' };
  }
  if (phase === 'ready' || phase === 'starting-session' || phase === 'active-session') {
    return { title: 'Session ready', detail: 'Everything looks good!' };
  }
  if (phase === 'authentication-failure') {
    return { title: 'Sign-in needed', detail: 'Ask a grown-up for help' };
  }
  if (phase === 'access-denied') {
    return { title: 'Learning pass needed', detail: 'Ask your teacher for help' };
  }
  return { title: 'Almost ready', detail: 'Try again in a moment' };
}

export function SessionPreparationScreen() {
  const { height } = useWindowDimensions();
  const compact = height < 760;
  const { getAccessToken, me, profileName, retryAuthorization, status } = useAuth();
  const configResult = useMemo(() => readPublicConfig(), []);
  const fixture = getComponentBDevelopmentFixture();
  const api = useMemo(
    () =>
      configResult.config || fixture
        ? createComponentBApi(configResult.config ?? undefined)
        : null,
    [configResult.config, fixture],
  );
  const [phase, setPhase] = useState<PreparationPhase>('checking-identity');
  const [learner, setLearner] = useState<LearnerView | null>(null);
  const [resumableSessionId, setResumableSessionId] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const runningRef = useRef(false);

  const navigateToSession = useCallback(async (sessionId: string) => {
    await saveActiveSessionId(sessionId);
    await clearPendingStartCommand();
    if (!mountedRef.current) return;
    setPhase('active-session');
    router.replace({
      pathname: '/(learner)/session/[sessionId]',
      params: { sessionId },
    });
  }, []);

  const openActiveSession = useCallback(
    async (response: SessionCommandResponse) => {
      // A non-'active' state here (completed/abandoned) has nothing to resume into — this is
      // reached only from the start-a-new-session path, never from the resume path below (which
      // only ever targets a session resolveResumableSessionId already confirmed is 'active').
      if (response.state !== 'active') {
        setPhase('technical-failure');
        return;
      }
      await navigateToSession(response.session_id);
    },
    [navigateToSession],
  );

  const checkReadiness = useCallback(async () => {
    if (runningRef.current || !api) return false;
    runningRef.current = true;
    setPhase('checking-readiness');
    try {
      await api.checkReadiness();
      if (!mountedRef.current) return false;
      setPhase('ready');
      // Skip the resume check for the fixture: FE-0d made createFixtureApi.getActiveSession
      // throw by design (the fixture covers the prep screen's readiness/start path only), so
      // calling it here would just be a swallowed error masquerading as "no active session" —
      // an explicit skip keeps that distinction visible instead of hiding a real regression.
      if (!fixture) {
        const accessToken = await getAccessToken();
        if (accessToken && mountedRef.current) {
          const sessionId = await resolveResumableSessionId(api, accessToken);
          if (mountedRef.current) {
            setResumableSessionId(sessionId);
            if (sessionId) await saveActiveSessionId(sessionId);
          }
        }
      }
      return true;
    } catch (error) {
      if (!mountedRef.current) return false;
      if (error instanceof ApiClientError && error.kind === 'forbidden') {
        setPhase('access-denied');
      } else if (
        error instanceof ApiClientError &&
        (error.kind === 'network' || error.kind === 'timeout')
      ) {
        setPhase('network-failure');
      } else if (error instanceof ApiClientError && error.kind === 'unauthenticated') {
        setPhase('authentication-failure');
      } else {
        setPhase('readiness-failure');
      }
      return false;
    } finally {
      runningRef.current = false;
    }
  }, [api, fixture, getAccessToken]);

  const sendStartCommand = useCallback(
    async (command: PendingStartSessionCommand, accessToken: string) => {
      if (!api) return;
      setPhase('starting-session');
      try {
        const response = await api.startSession(command.idempotencyKey, accessToken);
        await openActiveSession(response);
      } catch (error) {
        if (!mountedRef.current) return;
        if (error instanceof ApiClientError && error.kind === 'unauthenticated') {
          const refreshedToken = await getAccessToken(true);
          if (refreshedToken) {
            try {
              const response = await api.startSession(command.idempotencyKey, refreshedToken);
              await openActiveSession(response);
              return;
            } catch (retryError) {
              if (retryError instanceof ApiClientError && retryError.kind === 'forbidden') {
                setPhase('access-denied');
                return;
              }
            }
          }
          setPhase('authentication-failure');
          return;
        }
        if (error instanceof ApiClientError && error.kind === 'forbidden') {
          setPhase('access-denied');
        } else if (
          error instanceof ApiClientError &&
          (error.kind === 'network' || error.kind === 'timeout')
        ) {
          setPhase('network-failure');
        } else {
          setPhase('technical-failure');
        }
      }
    },
    [api, getAccessToken, openActiveSession],
  );

  const startAdventure = useCallback(async () => {
    if (runningRef.current || !api || phase === 'access-denied') return;
    runningRef.current = true;
    try {
      if (phase !== 'ready' && phase !== 'network-failure' && phase !== 'technical-failure') {
        runningRef.current = false;
        if (phase === 'authentication-failure' && !fixture) await retryAuthorization();
        const ready = await checkReadiness();
        if (!ready) return;
        runningRef.current = true;
      }

      if (resumableSessionId) {
        await navigateToSession(resumableSessionId);
        return;
      }

      let accessToken = fixture ? 'development-fixture-token' : await getAccessToken();
      if (!accessToken && !fixture) {
        setPhase('authentication-failure');
        return;
      }
      const pending = await loadPendingStartCommand();
      const command = pending ?? createStartCommand();
      if (!pending) await savePendingStartCommand(command);
      accessToken ??= 'development-fixture-token';
      await sendStartCommand(command, accessToken);
    } finally {
      runningRef.current = false;
    }
  }, [
    api,
    checkReadiness,
    fixture,
    getAccessToken,
    navigateToSession,
    phase,
    resumableSessionId,
    retryAuthorization,
    sendStartCommand,
  ]);

  useEffect(() => {
    mountedRef.current = true;
    if (fixture) {
      // Neutral placeholder, not a person's name. This used to hardcode a real person's first name,
      // which in a fixture run means a child could be addressed as someone else.
      setLearner({ displayName: 'Math Explorer' });
      void checkReadiness();
    } else if (status === 'authorized' && me?.learnerProfile) {
      setLearner({
        displayName: me.learnerProfile.name.trim() || profileName || 'Math Explorer',
      });
      void checkReadiness();
    } else if (status === 'access-denied') {
      setPhase('access-denied');
    } else if (status !== 'checking') {
      setPhase('authentication-failure');
    }
    return () => {
      mountedRef.current = false;
    };
  }, [checkReadiness, fixture, me, profileName, status]);

  const readiness = readinessCopy(phase);
  const busy = phase === 'checking-identity' || phase === 'checking-readiness' || phase === 'starting-session';
  const disabled = busy || phase === 'access-denied' || phase === 'active-session';
  const displayName = firstNameOf(learner?.displayName || profileName || 'Math Explorer');
  // Only an APPROVED membership is shown; a PENDING/REJECTED one is not a classroom the learner
  // is in yet. The fixture path has no membership, so the card simply does not render there.
  const classroom = me?.classroomMembership?.state === 'APPROVED' ? me.classroomMembership : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mobileCanvas}>
        <View style={[styles.header, compact && styles.headerCompact]}>
          <Image
            accessibilityLabel="MathMingo"
            contentFit="contain"
            source={brandArtwork}
            style={[styles.brandArtwork, compact && styles.brandArtworkCompact]}
          />
          <AppText numberOfLines={1} style={[styles.greeting, compact && styles.greetingCompact]}>
            Hi, <AppText style={[styles.greetingName, compact && styles.greetingNameCompact]}>{displayName}!</AppText>
          </AppText>
        </View>

        <View style={[styles.scrollContent, compact && styles.scrollContentCompact]}>
          <View style={styles.hero}>
            <Image
              accessibilityLabel="MathMingo beside a learning path"
              contentFit="cover"
              source={heroArtwork}
              style={styles.heroArtwork}
            />
            <View style={styles.heroCopy}>
              <AppText
                numberOfLines={1}
                style={[styles.heroTitle, compact && styles.heroTitleCompact]}>
                Get{' '}
                <AppText style={[styles.heroReady, compact && styles.heroReadyCompact]}>
                  Ready!
                </AppText>
              </AppText>
              <AppText style={[styles.heroSubtitle, compact && styles.heroSubtitleCompact]}>
                Let&apos;s start your{`\n`}
                <AppText style={[styles.heroSkill, compact && styles.heroSkillCompact]}>
                  maths
                </AppText>{' '}
                adventure
              </AppText>
            </View>
          </View>

          {/* Classroom + grade, both real fields on the learner's own approved membership
              (LearnerMembershipListItem.classroom_name / .grade) — not a lesson or skill claim,
              which this screen cannot make. Rendered only when a membership is actually loaded. */}
          {classroom ? (
            <View style={styles.lessonCard}>
              <View style={styles.lessonColumn}>
                <View style={[styles.lessonIcon, styles.skillIcon]}>
                  <Ionicons color={colors.primaryForeground} name="school" size={compact ? 24 : 28} />
                </View>
                <View>
                  <AppText style={styles.lessonLabel}>{gradeLabels[classroom.grade]}</AppText>
                  <AppText style={styles.lessonValue}>{classroom.classroom_name ?? 'Your classroom'}</AppText>
                </View>
              </View>
            </View>
          ) : null}

          <View style={[styles.preparationCard, compact && styles.preparationCardCompact]}>
            <AppText style={[styles.sectionTitle, compact && styles.sectionTitleCompact]}>
              Let&apos;s get ready!
            </AppText>
            <PreparationItem
              color={colors.accentGreen}
              compact={compact}
              detail={readiness.detail}
              icon={busy ? 'hourglass-outline' : 'checkmark'}
              loading={busy}
              title={readiness.title}
            />
            {/* KEPT, and re-verified rather than assumed. This claim was false when written: only 2
                of the 36 templates carried hint content, so ~94% of the time asking for help
                returned a neutral 409. BE-C1 ported the governed L1/L2/L3 hints from R26-IT-138 §11
                to all 36, and every one of the 108 lookups now resolves through
                `LiveEngineAdapter.get_hint` (checked against the live catalogue for this batch). The
                claim is now true, so it stays.
                A third item used to follow, promising unlimited retries at the learner's own pace. It
                was REMOVED: attempt limits are Gate-B unresolved, so the app cannot promise that.
                Nothing replaces it — the card is flex: 1 and absorbs the space rather than needing
                filler. (Its wording is not quoted here; a grep guard in
                home-session-progress.test.ts enforces its absence.) */}
            <PreparationItem
              color="#ffb000"
              compact={compact}
              detail="Get helpful hints anytime"
              icon="bulb-outline"
              title="Hints available"
            />
          </View>

          <Pressable
            accessibilityHint="Starts or resumes your prepared math session"
            accessibilityRole="button"
            accessibilityState={{ disabled }}
            disabled={disabled}
            onPress={() => void startAdventure()}
            style={({ pressed }) => [
              styles.startButton,
              disabled && styles.startButtonDisabled,
              pressed && styles.startButtonPressed,
            ]}>
            {phase === 'starting-session' ? (
              <ActivityIndicator color={colors.primaryForeground} size="small" />
            ) : (
              <AppText style={styles.startButtonText}>
                {resumableSessionId ? 'Resume Adventure' : 'Start Adventure'}
              </AppText>
            )}
            <Ionicons color={colors.primaryForeground} name="chevron-forward" size={26} />
          </Pressable>
        </View>

        <LearnerTabBar activeHomePressEnabled activeTab="home" />
      </View>
    </SafeAreaView>
  );
}

function PreparationItem({
  color,
  compact = false,
  detail,
  icon,
  loading = false,
  title,
}: {
  color: string;
  compact?: boolean;
  detail: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  loading?: boolean;
  title: string;
}) {
  return (
    <View style={[styles.preparationItem, compact && styles.preparationItemCompact]}>
      <View style={[styles.preparationIcon, compact && styles.preparationIconCompact, { backgroundColor: color }]}>
        {loading ? (
          <ActivityIndicator color={colors.primaryForeground} size="small" />
        ) : (
          <Ionicons color={colors.primaryForeground} name={icon} size={compact ? 19 : 23} />
        )}
      </View>
      <View style={styles.preparationCopy}>
        <AppText style={[styles.preparationTitle, compact && styles.preparationTitleCompact]}>{title}</AppText>
        <AppText style={[styles.preparationDetail, compact && styles.preparationDetailCompact]}>{detail}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  brandArtwork: { aspectRatio: 1916 / 821, height: 68 },
  brandArtworkCompact: { height: 56 },
  greeting: { flexShrink: 1, fontFamily: typography.fonts.body, fontSize: 25, lineHeight: 30, textAlign: 'right' },
  greetingCompact: { fontSize: 21, lineHeight: 25 },
  greetingName: { color: '#26A5FD', fontFamily: typography.fonts.heavy, fontSize: 33.75, lineHeight: 40.5 },
  greetingNameCompact: { fontSize: 28.35, lineHeight: 33.75 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingBottom: spacing.md, paddingHorizontal: spacing.smPlus, paddingTop: 4 },
  headerCompact: { paddingBottom: spacing.sm },
  hero: { aspectRatio: heroAspectRatio, backgroundColor: colors.secondarySoft, borderColor: colors.surface1, borderRadius: radius.lg, borderWidth: heroBorderWidth, overflow: 'hidden', position: 'relative', width: '100%' },
  heroArtwork: { bottom: -heroBorderWidth, left: -heroBorderWidth, position: 'absolute', right: -heroBorderWidth, top: -heroBorderWidth },
  heroCopy: { left: '8%', position: 'absolute', top: '16%', width: '62%' },
  heroReady: { color: '#ffb000', fontFamily: typography.fonts.heavy, fontSize: 42 },
  heroReadyCompact: { fontSize: 33.6 },
  heroSkill: { color: colors.primary, fontFamily: typography.fonts.display, fontSize: 19.95 },
  heroSkillCompact: { fontSize: 16.8 },
  heroSubtitle: { fontFamily: typography.fonts.body, fontSize: 19, lineHeight: 22.41, marginTop: spacing.sm },
  heroSubtitleCompact: { fontSize: 16, lineHeight: 18.26, marginTop: 5 },
  heroTitle: { fontFamily: typography.fonts.display, fontSize: 40, lineHeight: 46 },
  heroTitleCompact: { fontSize: 32, lineHeight: 37 },
  lessonCard: { backgroundColor: colors.surface1, borderColor: colors.border, borderRadius: radius.lg, borderWidth: 1, elevation: 2, flexDirection: 'row', gap: spacing.md, padding: spacing.md, shadowColor: colors.foreground, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3 },
  lessonColumn: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: spacing.smPlus },
  lessonIcon: { alignItems: 'center', borderRadius: radius.pill, height: 52, justifyContent: 'center', width: 52 },
  lessonLabel: { color: colors.textSecondary, fontSize: typography.fontSize.sm, lineHeight: typography.lineHeight.sm },
  lessonValue: { fontFamily: typography.fonts.bold, fontSize: typography.fontSize.lg, lineHeight: typography.lineHeight.lg },
  mobileCanvas: { alignSelf: 'center', backgroundColor: colors.background, flex: 1, maxWidth: 500, width: '100%' },
  preparationCard: { backgroundColor: colors.surface1, borderColor: colors.border, borderRadius: radius.lg, borderWidth: 1, elevation: 2, flex: 1, gap: spacing.sm, padding: spacing.md, shadowColor: colors.foreground, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3 },
  preparationCardCompact: { gap: spacing.xs, padding: spacing.smPlus },
  preparationCopy: { flex: 1, justifyContent: 'center' },
  preparationDetail: { color: colors.textSecondary, fontSize: typography.fontSize.sm, lineHeight: typography.lineHeight.sm },
  preparationDetailCompact: { fontSize: typography.fontSize.xs, lineHeight: typography.lineHeight.xs },
  preparationIcon: { alignItems: 'center', borderRadius: radius.pill, height: 44, justifyContent: 'center', width: 44 },
  preparationIconCompact: { height: 34, width: 34 },
  preparationItem: { alignItems: 'center', borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, flex: 1, flexDirection: 'row', gap: spacing.smPlus, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  preparationItemCompact: { gap: spacing.sm, paddingHorizontal: spacing.smPlus, paddingVertical: 2 },
  preparationTitle: { fontFamily: typography.fonts.bold, fontSize: typography.fontSize.body, lineHeight: typography.lineHeight.body },
  preparationTitleCompact: { fontSize: typography.fontSize.sm, lineHeight: typography.lineHeight.sm },
  safeArea: { backgroundColor: colors.background, flex: 1 },
  scrollContent: { flex: 1, gap: spacing.md, paddingBottom: spacing.lg, paddingHorizontal: spacing.sm },
  scrollContentCompact: { gap: spacing.smPlus },
  sectionTitle: { fontFamily: typography.fonts.display, fontSize: typography.fontSize.subtitle, lineHeight: typography.lineHeight.subtitle },
  sectionTitleCompact: { fontSize: typography.fontSize.lg, lineHeight: typography.lineHeight.lg },
  skillIcon: { backgroundColor: colors.primary },
  startButton: { alignItems: 'center', alignSelf: 'center', backgroundColor: colors.primary, borderColor: colors.surface1, borderRadius: 14.88, borderWidth: 2, elevation: 2, flexDirection: 'row', justifyContent: 'center', marginBottom: spacing.sm, marginTop: 'auto', minHeight: 62, paddingHorizontal: spacing.lg, shadowColor: colors.foreground, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, width: '86%' },
  startButtonDisabled: { opacity: 0.55 },
  startButtonPressed: { opacity: 0.88, transform: [{ translateY: 2 }] },
  startButtonText: { color: colors.primaryForeground, flex: 1, fontFamily: typography.fonts.bold, fontSize: 20, lineHeight: 28, textAlign: 'center' },
});
