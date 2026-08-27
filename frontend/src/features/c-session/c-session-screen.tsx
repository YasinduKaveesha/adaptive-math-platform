// The C session shell: state wiring and the actual network calls only. Every decision lives in
// c-session-logic.ts, mirroring live-session-screen.tsx / live-session-logic.ts's split for
// Component B.
//
// The loop is create/resume -> nextTask -> planTaskSurface (composing planTask with surface
// resolution) -> mount the resolved surface -> submitAction via handleSubmit. `ordered-value-
// sequence` is the only archetype with a registered surface so far (10a); every other template
// still renders FailClosedFrame, and archetype-surfaces.ts's own table is what 10b...10h extend --
// this file does not change again when they do.
//
// This file does not implement Component B's refresh-on-401 retry (`withToken` in
// live-session-screen.tsx). That is a deliberate simplification, not a hidden gap: the C API client
// has never issued a live request in this project (session creation refuses while seven parameter
// families are unsigned), so there is nothing yet to exercise a refresh against, and adding it
// speculatively would be more than this batch's own loop needs. Recorded in the register entry.
//
// `api` is resolved the same null-safe way Component B's screen resolves it
// (live-session-screen.tsx:87-90): `readPublicConfig()` first, and `createComponentCApi` is called
// only when there is a config to give it OR the development fixture is active (which needs no
// config). Calling `createComponentCApi()` unconditionally with no config, as an earlier draft of
// this file did, throws inside `useMemo` during render whenever neither is true -- a render-time
// throw the component's own failure path can never catch, since it never runs. `api` can therefore
// be `null`, and every function below checks for that before using it.

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ComponentType } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createComponentCApi, getComponentCDevelopmentFixture } from '@/src/api/component-c-api';
import { takeCSessionPrefetch } from '@/src/features/c-session/c-session-prefetch-cache';
import { ApiClientError } from '@/src/api/errors';
import type { CNextTaskResponse, CreateCSessionRequest } from '@/src/api/generated/openapi-types';
import { useAuth } from '@/src/auth/auth-context';
import { AppText } from '@/src/components/app-text';
import { ScreenShell } from '@/src/components/screen-shell';
import { readPublicConfig } from '@/src/config/env';
import { resolveArchetypeSurface, type ArchetypeSurfaceProps } from '@/src/features/c-session/archetype-surfaces';
import { encodeActionPayload } from '@/src/features/c-session/archetypes/encode-action-payload';
import { HIT_SLOP, TOUCH_TARGET_MIN_SIZE } from '@/src/features/c-session/motor-constants';
import {
  classifySessionFailure,
  decideSessionBootstrap,
  planSubmissionOutcome,
  planTaskSurface,
} from '@/src/features/c-session/c-session-logic';
import { AnswerFeedbackPanel } from '@/src/features/c-session/answer-feedback-panel';
import { FailClosedFrame } from '@/src/features/c-session/fail-closed-frame';
import { accentForGameFamily } from '@/src/features/c-session/game-family-accents';
import { NeutralMessageScreen } from '@/src/features/c-session/neutral-message-screen';
import { TechnicalBlockScreen } from '@/src/features/c-session/technical-block-screen';
import {
  recordActionSubmitted,
  recordBackgrounded,
  recordForegrounded,
  recordTaskOffered,
  recordTaskStarted,
  recordTechnicalIssue,
} from '@/src/features/c-session/telemetry';
import { colors, radius, spacing } from '@/src/theme/tokens';

export type CSessionScreenProps = {
  // Not decided or invented by this screen -- see c-session-logic.ts's decideSessionBootstrap
  // doc comment. Optional and, in this batch, ordinarily absent: nothing upstream supplies them
  // yet, so the create path fails closed to the "not ready" screen rather than fabricating either
  // value.
  grade?: number;
  sessionMode?: CreateCSessionRequest['session_mode'];
};

type Phase =
  | { kind: 'loading' }
  // `attempt` and `feedback` extend the existing `task` phase rather than adding a sibling phase,
  // because a retry stays ON this same task instance -- it is not a new task, so it does not
  // belong to a new phase. `feedback === null` renders the archetype surface (today's behaviour,
  // unchanged); `feedback !== null` renders `AnswerFeedbackPanel` INSTEAD OF the surface -- see
  // that file's own header for why that placement, not an overlay, is load-bearing. `attempt`
  // increments only on a "try again" press and is folded into the surface's remount `key` below,
  // so a wrong answer never survives visibly into the next attempt, mirroring `19d4530`'s fix for
  // the same problem across TASKS rather than across attempts on one task.
  | {
      kind: 'task';
      task: CNextTaskResponse;
      Surface: ComponentType<ArchetypeSurfaceProps>;
      attempt: number;
      feedback: { matched: boolean; scaffoldLevel: string } | null;
    }
  | { kind: 'fail-closed'; supportCode: string | null }
  | { kind: 'technical-block'; supportCode: string | null }
  | { kind: 'failure'; supportCode: string | null; copy: { title: string; detail: string } }
  | { kind: 'not-ready' };

/** The panel's warm ground, matching the Play hub's card so a game opens into the same object the
 *  menu showed. Only the colour BEHIND the card changes per family. */
const TASK_PANEL_BACKGROUND = '#fffdf6';

// The screen's own ground, BEHIND the card (2026-08-26 request): a fixed neutral, not the family
// accent -- the accent moved to the card's own border instead (`taskPanel.borderColor`, below), so
// each family is still visually distinguished, just on the card's edge rather than filling the
// whole screen.
const TASK_SCREEN_BACKGROUND = '#F4F4F6';

const FAILURE_COPY: Record<'authentication' | 'network' | 'technical', { title: string; detail: string }> = {
  authentication: { title: 'Sign-in needed', detail: 'Ask a grown-up to help you sign in again.' },
  network: { title: 'No connection', detail: 'Check the internet and try again in a moment.' },
  technical: { title: 'Something went wrong', detail: 'Try again in a little while.' },
};

export function CSessionScreen({ grade, sessionMode }: CSessionScreenProps) {
  const { getAccessToken, me } = useAuth();
  const subject = me?.principal.user_id ?? null;
  const configResult = useMemo(() => readPublicConfig(), []);
  // Null-safe by construction: createComponentCApi() with no config and no active fixture throws
  // (component-c-api.ts:145-147), and calling that inside useMemo during render would crash the
  // component tree rather than route through this screen's own failure path. The fixture check
  // needs no config at all, so it is tried before treating a missing config as fatal.
  const api = useMemo(() => {
    if (configResult.config) return createComponentCApi(configResult.config);
    if (getComponentCDevelopmentFixture()) return createComponentCApi();
    return null;
  }, [configResult.config]);
  const [phase, setPhase] = useState<Phase>({ kind: 'loading' });
  const cSessionIdRef = useRef<string | null>(null);
  const mountedRef = useRef(true);
  const backgroundedRef = useRef(false);

  const goHome = useCallback(() => router.replace('/(learner)/home'), []);

  const routeFailure = useCallback((error: unknown) => {
    if (!mountedRef.current) return;
    const supportCode = error instanceof ApiClientError ? error.requestId ?? null : null;
    const kind = classifySessionFailure(error);
    if (kind === 'network') {
      recordTechnicalIssue(
        error instanceof ApiClientError && error.kind === 'timeout' ? 'timeout' : 'network',
      );
    }
    if (kind === 'technical-block') {
      setPhase({ kind: 'technical-block', supportCode });
      return;
    }
    setPhase({ kind: 'failure', supportCode, copy: FAILURE_COPY[kind] });
  }, []);

  // The half of `loadNextTask` that runs AFTER a task is in hand, regardless of whether it just
  // came off the wire or arrived pre-fetched (see the cache check in `bootstrap()` below) -- split
  // out so neither path can silently diverge on telemetry or fail-closed handling.
  const presentTask = useCallback((task: CNextTaskResponse) => {
    if (!mountedRef.current) return;
    recordTaskOffered();
    // Both fail-closed reasons (unresolvable template; resolved archetype with no registered
    // surface) route to the same phase and support code here -- planTaskSurface keeps them
    // distinguishable in its own return value so a test can prove they stay separate, even
    // though the screen has no reason to render them differently.
    const surfacePlan = planTaskSurface(task, resolveArchetypeSurface);
    if (surfacePlan.kind === 'fail-closed') {
      setPhase({ kind: 'fail-closed', supportCode: task.request_id });
      return;
    }
    recordTaskStarted();
    setPhase({
      kind: 'task',
      task: surfacePlan.task,
      Surface: surfacePlan.Surface,
      attempt: 0,
      feedback: null,
    });
  }, []);

  const loadNextTask = useCallback(
    async (cSessionId: string, accessToken: string) => {
      if (!api) return;
      try {
        const task = await api.nextTask(cSessionId, accessToken);
        presentTask(task);
      } catch (error) {
        routeFailure(error);
      }
    },
    [api, presentTask, routeFailure],
  );

  const handleSubmit = useCallback(
    async (
      cSessionId: string,
      task: CNextTaskResponse,
      accessToken: string,
      values: Record<string, unknown>,
    ) => {
      if (!api) return;
      const payload = encodeActionPayload(task.valid_action_space, values);
      if (payload === null) return;
      try {
        const result = await api.submitAction(
          cSessionId,
          task.c_task_instance_id,
          { action_payload: payload },
          accessToken,
        );
        recordActionSubmitted();
        // Neither branch calls `loadNextTask` directly, even on a matched answer -- advancing is
        // always the child's own "Next" press (see answer-feedback-panel.tsx's header), never
        // automatic. `outcome` only decides what the panel SHOWS; `planSubmissionOutcome` computes
        // nothing about correctness itself, it relays `result.response_matched` and
        // `result.scaffold_level` exactly as the server sent them.
        const outcome = planSubmissionOutcome(result);
        setPhase((prev) =>
          prev.kind === 'task'
            ? { ...prev, feedback: { matched: outcome.kind === 'advance', scaffoldLevel: result.scaffold_level } }
            : prev,
        );
      } catch (error) {
        routeFailure(error);
      }
    },
    [api, routeFailure],
  );

  // Fired by AnswerFeedbackPanel's "Try again" -- clears the panel and bumps `attempt`, which is
  // folded into the surface's remount `key` below so the wrong answer does not survive visibly
  // into the fresh attempt. Stays on the SAME task instance; no network call, since nothing about
  // the task itself changed.
  const retryTask = useCallback(() => {
    setPhase((prev) =>
      prev.kind === 'task' ? { ...prev, feedback: null, attempt: prev.attempt + 1 } : prev,
    );
  }, []);

  // Fired by AnswerFeedbackPanel's "Next" -- the one place a matched answer actually advances the
  // session, mirroring submitFromSurface's own token/session-id handling exactly.
  const advanceToNextTask = useCallback(async () => {
    const cSessionId = cSessionIdRef.current;
    if (!cSessionId) return;
    const accessToken = await getAccessToken();
    if (!accessToken) {
      routeFailure(new ApiClientError('unauthenticated', 'No access token is available.'));
      return;
    }
    await loadNextTask(cSessionId, accessToken);
  }, [getAccessToken, loadNextTask, routeFailure]);

  // The bridge from an archetype surface's own onSubmit (raw per-key values, no session/task
  // plumbing -- see ArchetypeSurfaceProps) to handleSubmit's full signature. Reads cSessionId from
  // the ref and re-fetches a fresh access token per submission rather than closing over a stale one.
  const submitFromSurface = useCallback(
    async (values: Record<string, unknown>) => {
      const cSessionId = cSessionIdRef.current;
      if (!cSessionId || phase.kind !== 'task') return;
      const accessToken = await getAccessToken();
      if (!accessToken) {
        routeFailure(new ApiClientError('unauthenticated', 'No access token is available.'));
        return;
      }
      await handleSubmit(cSessionId, phase.task, accessToken, values);
    },
    [getAccessToken, handleSubmit, phase, routeFailure],
  );

  const bootstrap = useCallback(async () => {
    if (!api) return;
    // A prefetch started on Home's own Play press (requestPlay, adventure-charge-context.tsx) has
    // already settled by the time navigation lands here (that press awaits it before navigating),
    // so this never shows its own 'loading' phase for a request Home already made -- the blur
    // overlay on Home IS the loading state, for the entire wait. A miss (nothing cached: a deep
    // link straight to /c-session, or the prefetch itself resolved 'not ready'/failed) falls
    // through to the full bootstrap below, unchanged.
    if (subject) {
      const prefetch = takeCSessionPrefetch(subject);
      if (prefetch) {
        try {
          const result = await prefetch;
          if (result) {
            cSessionIdRef.current = result.cSessionId;
            presentTask(result.task);
            return;
          }
        } catch {
          // Falls through -- the normal bootstrap below is the real fallback, not a second attempt
          // at whatever failed here.
        }
      }
    }
    setPhase({ kind: 'loading' });
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) throw new ApiClientError('unauthenticated', 'No access token is available.');
      const active = await api.getActiveSession(accessToken);
      const decision = decideSessionBootstrap(active, grade, sessionMode);
      if (decision.action === 'not-ready') {
        if (!mountedRef.current) return;
        setPhase({ kind: 'not-ready' });
        return;
      }
      if (decision.action === 'resume') {
        cSessionIdRef.current = decision.cSessionId;
        await loadNextTask(decision.cSessionId, accessToken);
        return;
      }
      const created = await api.createSession(decision.body, accessToken);
      cSessionIdRef.current = created.c_session_id;
      await loadNextTask(created.c_session_id, accessToken);
    } catch (error) {
      routeFailure(error);
    }
  }, [api, getAccessToken, grade, loadNextTask, presentTask, routeFailure, sessionMode, subject]);

  // Leaving is never conditional on the background `abandonSession` cleanup call succeeding -- a
  // child pressing X wants to leave the task NOW, and stranding them on a "Something went wrong"
  // screen because that cleanup call failed (which, under the development fixture, it always does
  // by design -- 10.0b-i/-fix) is a worse outcome than a session the server cleans up some other
  // way. The call is still attempted, for the real-backend case where it matters, but its result
  // (success or failure) never changes where this takes the child: home, always -- the same
  // destination every other exit path on this screen already uses (`goHome`), landing on the
  // "Your Session" card rather than the hero, via the SAME catch-all Home already relies on for
  // "any way of leaving Home" (learner-home-screen.tsx's own unmount effect). There is no
  // game-hub menu to return to any more -- removed on owner instruction (2026-08-27); Play
  // navigates straight into Component C and X now returns straight to home the same way.
  const leaveSession = useCallback(async () => {
    const cSessionId = cSessionIdRef.current;
    if (cSessionId && api) {
      try {
        const accessToken = await getAccessToken();
        if (accessToken) {
          await api.abandonSession(cSessionId, accessToken);
        }
      } catch {
        // Swallowed on purpose -- see the comment above this function.
      }
    }
    goHome();
  }, [api, getAccessToken, goHome]);

  useEffect(() => {
    mountedRef.current = true;
    if (!api) {
      // No config and no active fixture -- the same "technical" bucket an unconfigured B screen
      // routes to (live-session-screen.tsx:425-427), reached through this screen's own failure
      // path rather than a render-time throw.
      setPhase({ kind: 'failure', supportCode: null, copy: FAILURE_COPY.technical });
    } else {
      void bootstrap();
    }
    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && backgroundedRef.current) {
        backgroundedRef.current = false;
        recordForegrounded();
      } else if (state !== 'active' && !backgroundedRef.current) {
        backgroundedRef.current = true;
        recordBackgrounded();
      }
    });
    return () => subscription.remove();
  }, []);

  if (phase.kind === 'loading') {
    return (
      <ScreenShell centered>
        <ActivityIndicator color={colors.primary} size="large" />
        <AppText align="center" style={styles.muted}>
          Getting your session ready…
        </AppText>
      </ScreenShell>
    );
  }

  if (phase.kind === 'not-ready') {
    return (
      <NeutralMessageScreen
        detail="This session isn't ready yet. Please check back soon."
        onExit={goHome}
        supportCode={null}
        title="Not ready yet"
      />
    );
  }

  if (phase.kind === 'fail-closed') {
    return <FailClosedFrame onExit={goHome} supportCode={phase.supportCode} />;
  }

  if (phase.kind === 'technical-block') {
    return <TechnicalBlockScreen onExit={goHome} supportCode={phase.supportCode} />;
  }

  if (phase.kind === 'failure') {
    return (
      <NeutralMessageScreen
        detail={phase.copy.detail}
        onExit={goHome}
        supportCode={phase.supportCode}
        title={phase.copy.title}
      />
    );
  }

  // phase.kind === 'task'. Renders whichever archetype surface resolveArchetypeSurface produced
  // for this task, per its own ArchetypeSurfaceProps contract (task + onSubmit only -- no exit
  // affordance in that contract, which is why the exit control lives in this wrapper rather than
  // being threaded into the surface itself).
  const { Surface, attempt, feedback, task } = phase;
  // The ground behind the task panel is the accent of the family this task came from, read from
  // the shared table by `game_family_id` -- a required wire field, never a literal here, so Number
  // Path opens on its own blue and every other family on its own colour without this file naming
  // any of them. An unknown id yields a neutral, which is a background choice and not a
  // fail-closed condition; see game-family-accents.ts.
  const accent = accentForGameFamily(task.game_family_id);
  return (
    <SafeAreaView style={[styles.taskSafeArea, { backgroundColor: TASK_SCREEN_BACKGROUND }]}>
      {/* Mirrors the Play hub's own outer shape (game-hub-screen.tsx's `mobileCanvas`): a flex:1,
          alignSelf-centred, maxWidth-500 canvas, stretched by its SafeAreaView ancestor rather than
          centred by it. The hub's SafeAreaView sets no alignItems (default 'stretch'); this one
          previously set `alignItems: 'center'` directly, which on web only shrink-wraps the child's
          CROSS axis but left the panel visibly short of full height in practice -- matching the
          hub's exact two-level shape (stretch, then centre-via-alignSelf one level in) is what the
          hub itself relies on to fill the screen, so the task canvas does the same rather than
          trying a different way to reach the same box. */}
      <View style={styles.taskCanvas}>
        {/* One panel card, the same one the Play hub uses -- radius.lg, 3px surface1 border, the
            0/3/0.14/6 shadow, warm ground -- now holding the whole task: the exit control, the
            prompt, the token row, the keypad and SUBMIT. The surface itself is unchanged in what it
            renders; it simply renders inside the card rather than loose on the screen. */}
        <View style={[styles.taskPanel, { borderColor: accent }]}>
            {/* Floats above the flow rather than taking a row of its own, so the 10% top spacer
                below measures cleanly from the card's own top edge to the question -- not from
                wherever this button's row happened to end. */}
            <View style={styles.taskExitRow}>
              <Pressable
                accessibilityLabel="Leave session"
                accessibilityRole="button"
                hitSlop={HIT_SLOP}
                onPress={() => void leaveSession()}
                style={({ pressed }) => [styles.taskExitButton, pressed && styles.pressed]}>
                <Ionicons color={colors.textSecondary} name="close" size={22} />
              </Pressable>
            </View>
            {/* Fixed shares of the card's own height, not of whatever's left over: 7% above the
                question, 5% below SUBMIT. The middle wrapper is `flex: 1, justifyContent:
                'flex-end'` so the surface's content -- title, tokens, keypad, SUBMIT -- is pinned
                against the bottom spacer rather than top-aligned with a leftover gap drifting in
                after it; any slack the content doesn't use collects above it instead, since the
                bottom gap is the one pinned to an exact percentage right now. Distributing that
                middle space is a separate, later step. */}
            <View style={styles.taskContentSpacerTop} />
            <View style={styles.taskContentMiddle}>
              {/* The `key` is load-bearing, not cosmetic. Every archetype surface holds the child's
                in-progress answer in its own local state (ordered-value-sequence's `entryValues`
                and `order`, and whatever 10b...10h add), and none of that state is derived from the
                task prop. Without a key, React reconciles a new task into the SAME component
                instance -- same type, same position -- so the previous question's already-entered
                answer survives into the next question and can be submitted against it without ever
                being re-entered. Keying on the task instance id makes every new task a new
                instance, which discards that state as a consequence of mounting rather than by any
                explicit reset.

                `c_task_instance_id` is the registry's own per-instance identifier and is a required
                non-null string on CNextTaskResponse. It is deliberately not combined with
                `task_index`: a composite would encode a distrust of the contract without detecting
                its violation, quietly papering over a backend that had issued two tasks under one
                instance id instead of letting that surface as the defect it would be.

                It IS combined with `attempt` (added for retry): a wrong answer may be resubmitted
                on this same instance id without limit, and without `attempt` in the key, a
                "try again" would reconcile into the SAME component instance and the wrong answer
                would still be sitting there, filled in, for the child to resubmit unchanged. That
                is the identical defect this key was first added to prevent (`19d4530`), one level
                down -- across attempts on one task, not across tasks. */}
              {feedback === null ? (
                <Surface
                  key={`${task.c_task_instance_id}:${attempt}`}
                  onSubmit={submitFromSurface}
                  task={task}
                />
              ) : (
                <AnswerFeedbackPanel
                  matched={feedback.matched}
                  onNext={() => void advanceToNextTask()}
                  onTryAgain={retryTask}
                  scaffoldLevel={feedback.scaffoldLevel}
                />
              )}
            </View>
            <View style={styles.taskContentSpacerBottom} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  muted: { color: colors.textSecondary },
  pressed: { opacity: 0.85 },
  taskExitButton: {
    alignItems: 'center',
    backgroundColor: colors.surface1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: TOUCH_TARGET_MIN_SIZE,
    justifyContent: 'center',
    width: TOUCH_TARGET_MIN_SIZE,
  },
  taskCanvas: {
    alignItems: 'center',
    alignSelf: 'center',
    flex: 1,
    justifyContent: 'center',
    maxWidth: 500,
    width: '100%',
  },
  taskExitRow: {
    left: spacing.smPlus,
    position: 'absolute',
    top: spacing.smPlus,
    zIndex: 1,
  },
  // Fixed percentages of the card's own height (not of leftover space): 7% between the card's top
  // and the question, 5% between SUBMIT and the card's bottom.
  taskContentSpacerBottom: { height: '5%' },
  taskContentSpacerTop: { height: '7%' },
  // Fills whatever height is left between the two spacers. The surface's own root now stretches to
  // this height and spaces its children `space-between` (ordered-value-sequence-surface.tsx's
  // `container`), so the question sits right after the 7% top spacer, SUBMIT sits right before the
  // 5% bottom spacer, and any unused slack shows up as extra white space between them instead of
  // pushing either one off its fixed gap.
  taskContentMiddle: { flex: 1 },
  // The card's border and shadow now match learner-home-screen.tsx's own hero card exactly
  // (2026-08-26 request): borderWidth 4, elevation 5, shadowOffset {0,4}, shadowOpacity 0.18,
  // shadowRadius 7 -- learner-home-screen.tsx:418's own `hero` style, values copied rather than
  // imported since that style is private to its own file. `borderColor` is applied inline from the
  // task's own game family (was `colors.surface1` -- a fixed white border -- until this request
  // moved the family's accent from the SCREEN's background, now `TASK_SCREEN_BACKGROUND`, onto the
  // card's own edge instead), so nothing about a specific family is written down here.
  //
  // Sized to 90% of the canvas on both axes and centred by the canvas's own `alignItems` /
  // `justifyContent`, rather than `flex: 1`, so the card reads as a card sitting on the screen's
  // neutral ground, distinguished by its own accent-coloured border -- instead of filling the
  // screen edge to edge.
  taskPanel: {
    backgroundColor: TASK_PANEL_BACKGROUND,
    borderRadius: radius.lg,
    borderWidth: 4,
    elevation: 5,
    height: '90%',
    padding: spacing.smPlus,
    position: 'relative',
    shadowColor: colors.foreground,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 7,
    width: '90%',
  },
  taskSafeArea: { flex: 1 },
});
