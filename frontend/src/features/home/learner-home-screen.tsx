import { useEffect, useMemo, useRef, useState } from 'react';

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  type ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { createComponentBApi } from '@/src/api/component-b-api';
import { useAuth } from '@/src/auth/auth-context';
import { AppText } from '@/src/components/app-text';
import { readPublicConfig } from '@/src/config/env';
import { useAdventureCharge } from '@/src/features/navigation/adventure-charge-context';
import {
  combineHomeSessionState,
  derivePathNodeStates,
  pathNodeLabel,
  type HomeSessionState,
  type PathNodeState,
} from '@/src/features/home/session-progress';
import {
  LearnerHeaderBar,
  LEARNER_HEADER_HEIGHT,
  LEARNER_HEADER_HEIGHT_COMPACT,
} from '@/src/features/navigation/learner-header-bar';
import { LearnerTabBar } from '@/src/features/navigation/learner-tab-bar';
import { colors, radius, spacing, typography } from '@/src/theme/tokens';
import { firstNameOf } from '@/src/utils/display-name';

const heroArtwork = require('../../../assets/images/hero-section.png');
const learningPathArtwork = require('../../../assets/images/learning-path.png');
const heroAspectRatio = 1672 / 941;
const heroBorderWidth = 4;
/** Fraction of the hero's scrollable distance past which a settled gesture snaps to the path instead of back to the hero. */
const heroSnapThreshold = 0.3;

/**
 * Module-scoped, not persisted: resets on app relaunch (new JS runtime), stays
 * true across navigations within the same app session once the learner scrolls
 * past the hero once.
 */
let heroDismissedThisAppSession = false;

// Node POSITIONS ONLY — where the artwork's path markers sit, and the colour each one is painted.
// These are facts about the illustration, not about the session, and their count is a property of
// the artwork rather than a session length: `PATH_NODE_POSITIONS.length` is passed to
// `derivePathNodeStates` as the number of positions available to draw into, and the number of nodes
// actually drawn comes from the server's `opportunities_total_bound`. No session length is assumed
// or hardcoded here.
//
// What used to be here — a skill-label table plus per-node skill ids and lesson-status subtitles — is
// gone. The server has no path, no ordering and no per-skill progress, so those labels asserted a
// structure the backend does not have. See session-progress.ts for the reframe. (The exact removed
// strings are deliberately not quoted anywhere in this file: home-session-progress.test.ts greps for
// them bluntly, and a guard with exemptions is a guard nobody trusts.)
const PATH_NODE_POSITIONS = [
  { color: colors.primary, left: '5%', top: '14%' },
  { color: colors.accentBlue, left: '20%', top: '27.5%' },
  { color: colors.accentGreen, left: '9%', top: '41%' },
  { color: '#ffb51f', left: '19%', top: '54.5%' },
  { color: '#9a64df', left: '20%', top: '68%' },
] as const;

const nodeSubtitles: Record<PathNodeState, string> = {
  current: 'Up next',
  done: 'Answered',
  pending: 'Not started',
};

/** Shared learner landing page; Component B owns the lesson path and preparation entry points. */
export function LearnerHomeScreen() {
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const compact = height < 760;
  const { getAccessToken, me, profileName } = useAuth();
  const { preparingPlay } = useAdventureCharge();
  // The personal-name fallback that used to sit at the end of this chain is gone: it was a real
  // person's name, so a child whose profile had not loaded yet was greeted as someone else.
  // 'Math Explorer' is the same neutral placeholder the prep screen uses. (The removed name is not
  // quoted here — a grep guard enforces its absence.)
  const displayName = firstNameOf(me?.learnerProfile?.name.trim() || profileName || 'Math Explorer');
  const configResult = useMemo(() => readPublicConfig(), []);
  const api = useMemo(
    () => (configResult.config ? createComponentBApi(configResult.config) : null),
    [configResult.config],
  );
  const [sessionState, setSessionState] = useState<HomeSessionState>({ kind: 'not-in-progress' });
  const mountedRef = useRef(true);

  // Two best-effort reads. Neither may block the screen: any failure degrades to not-in-progress,
  // which is self-correcting because POST /b/sessions returns an existing session anyway (see
  // combineHomeSessionState). The home screen must never show a child an error where their path was.
  useEffect(() => {
    mountedRef.current = true;
    const load = async () => {
      if (!api) return;
      try {
        const accessToken = await getAccessToken();
        if (!accessToken) return;
        const { session } = await api.getActiveSession(accessToken);
        if (!session || session.state !== 'active') return;
        const summary = await api.getSessionSummary(session.session_id, accessToken);
        if (!mountedRef.current) return;
        setSessionState(combineHomeSessionState(session, summary));
      } catch {
        // Deliberately silent: the neutral not-in-progress state is already on screen.
      }
    };
    void load();
    return () => {
      mountedRef.current = false;
    };
  }, [api, getAccessToken]);

  // Once this screen has been visited and left AT ALL — the Play tab (LearnerTabBar's Play button,
  // which this screen has no other hook into and which now goes straight into a Component C
  // session, no game-hub menu in between), the hero button, a scroll-dismiss, anything — a later
  // return should open straight at the session card, never back at the hero. `openBLearning` and
  // handleGestureSettle's snap branch already set the same module flag for their own specific paths
  // (and keep doing so, since dismissTriggeredRef and showContinuationFade still need to react
  // within THIS mount); this cleanup-only effect is the catch-all that covers every OTHER way of
  // leaving (including Component C's own X button, c-session-screen.tsx's `leaveSession`), so no
  // future exit path can reintroduce "hero shows again after all" as a gap.
  useEffect(() => {
    return () => {
      heroDismissedThisAppSession = true;
    };
  }, []);

  const inProgress = sessionState.kind === 'in-progress';
  const nodeStates = derivePathNodeStates(sessionState, PATH_NODE_POSITIONS.length);
  // Always through preparation: the prep screen performs its own resume check (and, as of the
  // prefetch change in session-preparation-screen.tsx, fetches the first question there too, so
  // the session screen it navigates to never shows its own loading phase) — both the hero button
  // and the "Your Session" card's own current-question control below go through it, on owner
  // instruction (2026-08-27) overriding this comment's own prior "jump straight into the session"
  // reasoning, which is no longer what either button does.
  const openBLearning = () => {
    // Treated the same as scrolling past the hero (see handleGestureSettle's own dismiss branch):
    // once the child has used the hero's own call-to-action, a later return to this screen should
    // open straight at the session card rather than showing the hero again from the top.
    heroDismissedThisAppSession = true;
    router.push('/(learner)/prepare');
  };
  const resumeCurrentQuestion = () => {
    if (sessionState.kind !== 'in-progress') return;
    router.push('/(learner)/prepare');
  };
  const scrollRef = useRef<ScrollView>(null);
  const dismissTriggeredRef = useRef(heroDismissedThisAppSession);
  const snapInFlightRef = useRef(false);
  // Whether THIS mount should open already scrolled past the hero, straight to the session/path
  // card — true once the hero has been "used" once in this app session (scrolled past, see
  // handleGestureSettle, OR the hero's own CTA button pressed, see openBLearning). This decides
  // only where the ScrollView starts; it must NEVER disable scrolling itself — that used to be
  // `scrollEnabled={false}` after the first dismiss, which permanently locked the child out of
  // scrolling back up to see the hero again for the rest of the app session. Read once via
  // `useRef`, not `useState`: a later change to the module-level flag (from a scroll on THIS
  // mount) must not retroactively move where THIS mount started.
  const startScrolledToPath = useRef(heroDismissedThisAppSession).current;
  // Guards `scrollToEnd` so it only ever fires once per mount, the moment the content is first
  // measured — never again after that, even though `onContentSizeChange`/`onLayout` can keep
  // firing (e.g. from font/image loads settling in). Without this guard, any later re-fire would
  // yank the child back down to the bottom even after they had deliberately scrolled up to look
  // at the hero again, which is exactly the "can't scroll up" bug this whole change fixes.
  const initialScrollAppliedRef = useRef(false);
  const [showContinuationFade, setShowContinuationFade] = useState(
    () => !heroDismissedThisAppSession,
  );
  const scrollY = useRef(new Animated.Value(0)).current;
  const introOpacity = scrollY.interpolate({
    extrapolate: 'clamp',
    inputRange: [0, 150],
    outputRange: [1, 0],
  });
  const introLift = scrollY.interpolate({
    extrapolate: 'clamp',
    inputRange: [0, 150],
    outputRange: [0, -36],
  });
  const continuationFadeOpacity = scrollY.interpolate({
    extrapolate: 'clamp',
    inputRange: [0, 10],
    outputRange: [1, 0],
  });
  const usableHeight = height - insets.top - insets.bottom;
  const fixedHeaderHeight = compact ? LEARNER_HEADER_HEIGHT_COMPACT : LEARNER_HEADER_HEIGHT;
  const fixedNavHeight = (compact ? 61 : 73) + 11.75;
  const [measuredViewportHeight, setMeasuredViewportHeight] = useState(0);
  // The "buttons glitch on returning to home" report: this screen fully remounts every time it's
  // navigated back to (goHome/goToGameHub elsewhere use router.replace, and expo-router mounts a
  // fresh instance rather than reusing one). On that fresh mount, `measuredViewportHeight` starts
  // at 0 for one frame, so `pathPanelWidth` (below) is computed from a rough fallback estimate
  // instead of the ScrollView's real measured height — the path-stage buttons render once at that
  // wrong position/size, then visibly snap to the correct one the instant `onLayout` reports the
  // real height. `layoutReady` hides the ScrollView (via opacity, not by skipping layout — it
  // still needs to be measured) until that first real `onLayout` has landed, so the correction
  // happens off-screen instead of as a visible jump.
  const [layoutReady, setLayoutReady] = useState(false);
  const pathViewportHeight =
    measuredViewportHeight || Math.max(0, usableHeight - fixedHeaderHeight - fixedNavHeight);
  // The header already supplies the visible gap above the panel (its own
  // paddingBottom), so the panel only needs a matching paddingBottom of its
  // own to keep the gap below it equal — no separate paddingTop here.
  const dashboardBottomPadding = compact ? 3 : spacing.md;
  const pathPanelWidth = Math.min(
    Math.min(width, 500) - spacing.md,
    Math.max(0, pathViewportHeight - dashboardBottomPadding) * (941 / 1672),
  );

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: Platform.OS !== 'web' },
  );

  /**
   * Runs only once the learner's gesture has fully settled (drag released with
   * no momentum, or momentum has finished) — never while the scroll is still
   * actively moving, so it never fights the finger or native inertia. Whatever
   * fraction of the hero was scrolled past, this snaps to whichever of the two
   * end states (hero visible, or learning path pinned) it was closer to.
   */
  const handleGestureSettle = (nativeEvent: {
    contentOffset: { y: number };
    contentSize: { height: number };
    layoutMeasurement: { height: number };
  }) => {
    if (dismissTriggeredRef.current || snapInFlightRef.current) return;
    const maxOffset = Math.max(0, nativeEvent.contentSize.height - nativeEvent.layoutMeasurement.height);
    const offsetY = nativeEvent.contentOffset.y;
    if (maxOffset <= 0 || offsetY <= 0 || offsetY >= maxOffset) return;

    snapInFlightRef.current = true;
    const snapToPath = offsetY >= maxOffset * heroSnapThreshold;
    if (snapToPath) {
      dismissTriggeredRef.current = true;
      heroDismissedThisAppSession = true;
      setShowContinuationFade(false);
      scrollRef.current?.scrollTo({ y: maxOffset, animated: true });
      // Deliberately NOT `setScrollEnabled(false)` (that state no longer exists — see
      // `startScrolledToPath`'s own comment): scrolling stays available for the rest of this
      // mount, so the child can freely scroll back up to see the hero again. Only the one-time
      // auto-snap-to-nearest-end decision above is single-shot (`dismissTriggeredRef`), not the
      // ability to scroll at all.
    } else {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
    setTimeout(() => {
      snapInFlightRef.current = false;
    }, 400);
  };

  const pathPanelContent = (
    <View
      style={[
        styles.dashboardSection,
        { minHeight: pathViewportHeight, paddingBottom: dashboardBottomPadding },
      ]}>
      <View style={[styles.pathPanel, { width: pathPanelWidth }]}>
          <Image
            // The artwork is unchanged; only its description is, since it no longer stands for five
            // lessons — nothing in the backend has lessons.
            accessibilityLabel="A winding path leading to a treasure chest"
            contentFit="cover"
            source={learningPathArtwork}
            style={styles.learningPathArtwork}
          />
          <View style={styles.pathHeading}>
            <Ionicons color={colors.accentGreen} name="map" size={compact ? 22.5 : 27} />
            <AppText style={[styles.pathHeadingText, compact && styles.pathHeadingTextCompact]}>
              {inProgress ? 'Your Session' : 'Ready to Play'}
            </AppText>
          </View>
          {nodeStates.map((nodeState, index) => {
            const node = PATH_NODE_POSITIONS[index];
            const isCurrent = nodeState === 'current';
            const stageContent = (
              <>
              <View
                style={[
                  styles.pathStageNumber,
                  { backgroundColor: node.color },
                  isCurrent && styles.pathStageNumberActive,
                ]}>
                <AppText style={[styles.pathStageNumberText, compact && styles.pathStageNumberTextCompact]}>
                  {index + 1}
                </AppText>
              </View>
              <View style={[styles.pathStageCard, isCurrent && styles.pathStageCardActive]}>
                <View style={styles.pathStageCopy}>
                  <AppText style={[styles.pathStageTitle, compact && styles.pathStageTitleCompact]}>
                    {`Question ${index + 1}`}
                  </AppText>
                  <View style={styles.pathStageProgress}>
                    {/* A star marks a question actually answered. It used to appear on every
                        not-current node, i.e. on questions that had not happened yet. */}
                    {nodeState === 'done' && (
                      <Ionicons color="#ffb51f" name="star" size={compact ? 11.5 : 13.8} />
                    )}
                    <AppText
                      style={[
                        styles.pathStageSubtitle,
                        compact && styles.pathStageSubtitleCompact,
                        isCurrent && styles.pathStageSubtitleActive,
                        isCurrent && compact && styles.pathStageSubtitleActiveCompact,
                        isCurrent && { color: node.color },
                      ]}>
                      {nodeSubtitles[nodeState]}
                    </AppText>
                  </View>
                </View>
                <Ionicons
                  color={isCurrent ? colors.primary : node.color}
                  name={
                    isCurrent ? 'play' : nodeState === 'done' ? 'checkmark-circle' : 'ellipse-outline'
                  }
                  size={isCurrent ? (compact ? 22.4 : 27.2) : compact ? 17.6 : 20.8}
                />
              </View>
              </>
            );

            if (isCurrent) {
              return (
                <Pressable
                  accessibilityHint={
                    inProgress ? 'Opens your current question' : 'Opens session preparation'
                  }
                  accessibilityLabel={pathNodeLabel(index, nodeState)}
                  accessibilityRole="button"
                  key={index}
                  onPress={resumeCurrentQuestion}
                  style={({ pressed }) => [
                    styles.pathStage,
                    { left: node.left, top: node.top },
                    pressed && styles.pathStagePressed,
                  ]}>
                  {stageContent}
                </Pressable>
              );
            }

            return (
              <View
                accessibilityLabel={pathNodeLabel(index, nodeState)}
                accessible
                key={index}
                style={[styles.pathStage, { left: node.left, top: node.top }]}>
                {stageContent}
              </View>
            );
          })}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mobileCanvas}>
        <LearnerHeaderBar compact={compact} displayName={displayName} />

        <Animated.ScrollView
          bounces
          contentContainerStyle={styles.scrollContent}
          onContentSizeChange={() => {
            // One-shot — see initialScrollAppliedRef's own comment. This can fire again later
            // (image/font loads settling in) without re-triggering the jump.
            if (startScrolledToPath && !initialScrollAppliedRef.current) {
              initialScrollAppliedRef.current = true;
              scrollRef.current?.scrollToEnd({ animated: false });
            }
          }}
          onLayout={(event) => {
            setMeasuredViewportHeight(event.nativeEvent.layout.height);
            if (startScrolledToPath && !initialScrollAppliedRef.current) {
              initialScrollAppliedRef.current = true;
              scrollRef.current?.scrollToEnd({ animated: false });
              // The imperative scroll doesn't necessarily apply in this same frame (react-native-
              // web in particular can lag a frame or two behind scrollToEnd's call) — revealing at
              // the exact same instant risks one visible frame of the hero before the jump to the
              // path view. This short delay gives it room to land before the reveal.
              setTimeout(() => {
                if (mountedRef.current) setLayoutReady(true);
              }, 50);
            } else {
              setLayoutReady(true);
            }
          }}
          onMomentumScrollEnd={(event) => handleGestureSettle(event.nativeEvent)}
          onScroll={handleScroll}
          onScrollEndDrag={(event) => {
            // iOS only: when a drag ends with no fling, no deceleration follows,
            // so onMomentumScrollEnd never fires — settle immediately in that
            // case. Android always fires onMomentumScrollEnd on its own.
            if (Platform.OS !== 'ios') return;
            const velocity = event.nativeEvent.velocity;
            const speed = velocity ? Math.hypot(velocity.x, velocity.y) : 0;
            if (speed < 0.05) handleGestureSettle(event.nativeEvent);
          }}
          ref={scrollRef}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          style={[styles.scrollView, !layoutReady && styles.scrollViewHidden]}>
          <Animated.View
            style={[
              styles.heroSection,
              compact && styles.sectionCompact,
              { opacity: introOpacity, transform: [{ translateY: introLift }] },
            ]}>
            <View style={styles.hero}>
              <Image
                accessibilityLabel="MathMingo adventure landscape"
                contentFit="cover"
                source={heroArtwork}
                style={styles.heroArtwork}
              />
              <View style={styles.heroCopy}>
                <AppText style={[styles.heroTitle, compact && styles.heroTitleCompact]}>
                  Let&apos;s make math
                </AppText>
                <View style={styles.heroAdventureLine}>
                  <AppText style={[styles.heroTitle, styles.heroAdventureLead, compact && styles.heroTitleCompact]}>
                    an
                  </AppText>
                  <AppText style={[styles.heroAdventure, compact && styles.heroAdventureCompact]}>
                    adventure!
                  </AppText>
                </View>
              </View>
              <Pressable
                accessibilityHint="Opens session preparation"
                accessibilityRole="button"
                onPress={openBLearning}
                style={({ pressed }) => [
                  styles.heroButton,
                  compact && styles.heroButtonCompact,
                  pressed && styles.buttonPressed,
                ]}>
                <AppText style={[styles.heroButtonText, compact && styles.heroButtonTextCompact]}>
                  {inProgress ? 'Resume Adventure' : 'Start Adventure'}
                </AppText>
                <Ionicons color={colors.primaryForeground} name="chevron-forward" size={compact ? 18.6 : 22.32} />
              </Pressable>
            </View>
          </Animated.View>

          {pathPanelContent}
        </Animated.ScrollView>

        {showContinuationFade && (
          <Animated.View
            style={[
              styles.scrollContinuationFade,
              { bottom: fixedNavHeight, opacity: continuationFadeOpacity },
            ]}
          >
            <View style={styles.scrollContinuationFade1} />
            <View style={styles.scrollContinuationFade2} />
            <View style={styles.scrollContinuationFade3} />
            <View style={styles.scrollContinuationFade4} />
            <View style={styles.scrollContinuationFade5} />
            <View style={styles.scrollContinuationFade6} />
            <View style={styles.scrollContinuationFade7} />
          </Animated.View>
        )}
        <LearnerTabBar activeTab="home" playEnabled />

        {preparingPlay ? (
          <View pointerEvents="none" style={styles.preparingOverlay}>
            <BlurView intensity={40} style={styles.preparingOverlay} tint="light" />
            <ActivityIndicator color={colors.primary} size="large" style={styles.preparingSpinner} />
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  preparingOverlay: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  preparingSpinner: { transform: [{ scale: 2 }] },
  buttonPressed: { borderBottomWidth: 0, transform: [{ translateY: 3 }] },
  dashboardSection: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm, paddingTop: 0, width: '100%' },
  dots: { flexDirection: 'row', gap: 2, marginTop: 2 },
  hero: { aspectRatio: heroAspectRatio, backgroundColor: colors.secondarySoft, borderColor: colors.surface1, borderRadius: radius.lg, borderWidth: heroBorderWidth, elevation: 5, overflow: 'hidden', padding: spacing.smPlus, position: 'relative', shadowColor: colors.foreground, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 7, width: '100%' },
  heroArtwork: { bottom: -heroBorderWidth, left: -heroBorderWidth, position: 'absolute', right: -heroBorderWidth, top: -heroBorderWidth },
  heroAdventure: { color: '#FEC632', fontFamily: typography.fonts.display, fontSize: 34.32, lineHeight: 39.6 },
  heroAdventureCompact: { fontSize: 29.04, lineHeight: 35.2 },
  heroAdventureLead: { marginRight: 5 },
  heroAdventureLine: { alignItems: 'baseline', flexDirection: 'row' },
  heroButton: { alignItems: 'center', backgroundColor: colors.primary, borderColor: colors.surface1, borderRadius: 14.88, borderWidth: 2, bottom: spacing.smPlus, elevation: 4, flexDirection: 'row', gap: 4.96, justifyContent: 'center', left: spacing.smPlus, minHeight: 49.6, paddingHorizontal: 14.88, position: 'absolute', shadowColor: colors.primaryShadow, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 4, zIndex: 2 },
  heroButtonCompact: { bottom: spacing.sm, left: spacing.sm, minHeight: 44.64, paddingHorizontal: 12.4 },
  heroButtonText: { color: colors.primaryForeground, fontFamily: typography.fonts.bold, fontSize: 13.64, lineHeight: 22.32, textAlign: 'center' },
  heroButtonTextCompact: { fontSize: 12.4, lineHeight: 19.84 },
  heroCopy: { gap: 2, maxWidth: '62%', zIndex: 2 },
  heroSection: { paddingBottom: 5, paddingHorizontal: spacing.sm },
  heroTitle: { fontFamily: typography.fonts.display, fontSize: 23.94, lineHeight: 27.72 },
  heroTitleCompact: { fontSize: 20.16, lineHeight: 24.36 },
  inactiveDot: { backgroundColor: colors.surface3, borderRadius: radius.pill, height: 4, width: 4 },
  learningPathArtwork: { ...StyleSheet.absoluteFillObject, height: '100%', width: '100%' },
  missionCopy: { flex: 1, gap: 2 },
  missionLabel: { fontFamily: typography.fonts.bold, fontSize: 9, lineHeight: 12 },
  missionLabelCompact: { fontSize: 7, lineHeight: 9 },
  missionPanel: { flex: 0.37 },
  missionRow: { alignItems: 'center', backgroundColor: '#fff9df', borderColor: '#f6e9aa', borderRadius: radius.sm, borderWidth: 1, flex: 1, flexDirection: 'row', gap: 3, minHeight: 0, paddingHorizontal: 5 },
  missionRowCompact: { paddingHorizontal: 3 },
  missionTrack: { backgroundColor: colors.surface3, borderRadius: radius.pill, height: 4 },
  missionValue: { color: colors.textSecondary, fontSize: 8 },
  mobileCanvas: { alignSelf: 'center', backgroundColor: colors.background, flex: 1, maxWidth: 500, width: '100%' },
  panel: { backgroundColor: colors.surface1, borderBottomColor: colors.borderStrong, borderBottomWidth: 2, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, gap: 4, minHeight: 0, padding: 6 },
  panelHeading: { alignItems: 'center', flexDirection: 'row', gap: 3, minHeight: 18 },
  panelTitle: { flex: 1, fontFamily: typography.fonts.display, fontSize: 11, lineHeight: 14 },
  panelTitleCompact: { fontSize: 9, lineHeight: 11 },
  pathHeading: { alignItems: 'center', flexDirection: 'row', gap: 4, left: '6%', position: 'absolute', top: '3%' },
  pathHeadingText: { fontFamily: typography.fonts.heavy, fontSize: 18, lineHeight: 22.5 },
  pathHeadingTextCompact: { fontSize: 15, lineHeight: 18 },
  pathPanel: { alignSelf: 'center', aspectRatio: 941 / 1672, borderColor: colors.surface1, borderRadius: radius.lg, borderWidth: 3, elevation: 4, maxWidth: '100%', overflow: 'hidden', position: 'relative', shadowColor: colors.foreground, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.14, shadowRadius: 6 },
  pathStage: { alignItems: 'center', flexDirection: 'row', height: '11.5%', position: 'absolute', right: '3%' },
  pathStageCard: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.96)', borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, elevation: 2, flex: 1, flexDirection: 'row', height: '78%', justifyContent: 'space-between', marginLeft: -8, paddingLeft: 12, paddingRight: 7, shadowColor: colors.foreground, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3 },
  pathStageCardActive: { borderColor: colors.primarySoft },
  pathStageCopy: { flex: 1, gap: 4, justifyContent: 'center' },
  pathStageNumber: { alignItems: 'center', aspectRatio: 1, borderColor: colors.surface1, borderRadius: radius.pill, borderWidth: 3, elevation: 4, height: '80%', justifyContent: 'center', shadowColor: colors.foreground, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.18, shadowRadius: 4, zIndex: 2 },
  pathStageNumberActive: { borderColor: colors.accentYellow },
  pathStageNumberText: { color: colors.primaryForeground, fontFamily: typography.fonts.display, fontSize: 18, lineHeight: 22 },
  pathStageNumberTextCompact: { fontSize: 15, lineHeight: 18 },
  pathStageProgress: { alignItems: 'center', flexDirection: 'row', gap: 2 },
  pathStagePressed: { opacity: 0.86, transform: [{ scale: 0.985 }] },
  pathStageSubtitle: { color: colors.textSecondary, fontFamily: typography.fonts.body, fontSize: 9.2, lineHeight: 11.5 },
  pathStageSubtitleActive: { color: colors.primary, fontSize: 13.8, lineHeight: 16.5 },
  pathStageSubtitleActiveCompact: { fontSize: 11.5, lineHeight: 13.8 },
  pathStageSubtitleCompact: { fontSize: 8.05, lineHeight: 10.35 },
  pathStageTitle: { fontFamily: typography.fonts.heavy, fontSize: 15, lineHeight: 18 },
  pathStageTitleCompact: { fontSize: 12, lineHeight: 15 },
  progressPanel: { flex: 0.63 },
  safeArea: { backgroundColor: colors.background, flex: 1 },
  scrollContent: {},
  scrollContinuationFade: { height: 27, left: spacing.sm, pointerEvents: 'none', position: 'absolute', right: spacing.sm, zIndex: 9 },
  scrollContinuationFade1: { backgroundColor: 'rgba(244,244,246,0.06)', flex: 1 },
  scrollContinuationFade2: { backgroundColor: 'rgba(244,244,246,0.14)', flex: 1 },
  scrollContinuationFade3: { backgroundColor: 'rgba(244,244,246,0.24)', flex: 1 },
  scrollContinuationFade4: { backgroundColor: 'rgba(244,244,246,0.36)', flex: 1 },
  scrollContinuationFade5: { backgroundColor: 'rgba(244,244,246,0.5)', flex: 1 },
  scrollContinuationFade6: { backgroundColor: 'rgba(244,244,246,0.66)', flex: 1 },
  scrollContinuationFade7: { backgroundColor: 'rgba(244,244,246,0.82)', flex: 1 },
  scrollView: { flex: 1 },
  // Opacity, not `display: 'none'`: it must still lay out and fire `onLayout`/`onContentSizeChange`
  // while hidden, or `layoutReady` would never flip to true — see the state's own comment.
  scrollViewHidden: { opacity: 0 },
  sectionCompact: { paddingBottom: 3 },
  sideColumn: { flex: 0.94, gap: 6, minHeight: 0 },
  stageArtwork: { alignItems: 'center', aspectRatio: 1, borderRadius: radius.pill, justifyContent: 'center', width: 30 },
  stageArtworkCompact: { width: 24 },
  stageCard: { alignItems: 'center', borderRadius: radius.sm, flex: 1, flexDirection: 'row', gap: 4, minHeight: 0, paddingHorizontal: 4 },
  stageCopy: { flex: 1 },
  stageDescription: { color: colors.textSecondary, fontSize: 7, lineHeight: 9 },
  stageDescriptionCompact: { fontSize: 6, lineHeight: 7 },
  stageList: { flex: 1, gap: 3, minHeight: 0 },
  stageTitle: { fontFamily: typography.fonts.bold, fontSize: 9, lineHeight: 11 },
  stageTitleCompact: { fontSize: 7, lineHeight: 9 },
  statCard: { alignItems: 'center', backgroundColor: colors.surface1, borderBottomColor: colors.borderStrong, borderBottomWidth: 2, borderColor: colors.border, borderRadius: radius.sm, borderWidth: 1, justifyContent: 'center', minWidth: 38, paddingHorizontal: 3, paddingVertical: 2 },
  statCardCompact: { minWidth: 32, paddingHorizontal: 2, paddingVertical: 1 },
  statLabel: { color: colors.textSecondary, fontSize: 6, lineHeight: 8 },
  statLabelCompact: { fontSize: 5, lineHeight: 6 },
  stats: { alignSelf: 'stretch', flexDirection: 'row', gap: 3 },
  statValue: { fontFamily: typography.fonts.bold, fontSize: 10, lineHeight: 12 },
  statValueCompact: { fontSize: 8, lineHeight: 9 },
});
