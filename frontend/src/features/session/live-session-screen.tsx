import { Ionicons } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type {
  PendingCompleteOpportunityCommand,
  PendingRequestAssistCommand,
  PendingSubmitResponseCommand,
} from '@/src/api/contracts';
import { createComponentBApi } from '@/src/api/component-b-api';
import { ApiClientError } from '@/src/api/errors';
import type { AttemptResponse } from '@/src/api/generated/openapi-types';
import { useAuth } from '@/src/auth/auth-context';
import { AppText } from '@/src/components/app-text';
import { readPublicConfig } from '@/src/config/env';
import {
  canAdvance,
  canRequestHint,
  classifyAttemptOutcome,
  classifyFailure,
  failureRequestId,
  hintStateFor,
  initialAnswerState,
  isAnswerSurfaceDisabled,
  isDeadlinePassed,
  markHintsUnavailable,
  outcomeView,
  planPresentation,
  recordHint,
  decideAdvance,
  decidePendingAssist,
  decidePendingReplay,
  HINTS_UNAVAILABLE_COPY,
  type AttemptOutcome,
  type HintState,
  type SessionFailure,
  type SessionPlan,
  type SessionProgress,
} from '@/src/features/session/live-session-logic';
import {
  clearActiveSessionId,
  clearPendingCommand,
  loadPendingCommand,
  savePendingCommand,
} from '@/src/features/session/session-command-store';
import { SessionResultsScreen } from '@/src/features/session/session-results-screen';
import { PromptVisual } from '@/src/features/session/prompt-visuals/prompt-visual';
import { resolvePromptVisual } from '@/src/features/session/prompt-visuals/registry';
import { encodeSubmittedValue } from '@/src/features/session/renderers/encode';
import { ChoiceGrid } from '@/src/features/session/renderers/choice-grid';
import { CountSelection } from '@/src/features/session/renderers/count-selection';
import { FreeEntry } from '@/src/features/session/renderers/free-entry';
import type { AnswerState } from '@/src/features/session/renderers/types';
import { colors, radius, spacing, typography } from '@/src/theme/tokens';

// FE-3b: select the question, render it, accept an answer, submit it, show the outcome.
//
// Deliberately absent, each owned by a later batch: the countdown UI (FE-3c), hints (FE-3d),
// advancing to the next question (FE-3e) and results (FE-3f). After an attempt is recorded the
// child sees the outcome and the existing "Back to home" affordance. There is no next-question
// button here on purpose — inventing one would front-run FE-3e's completion call.

type RenderPlan = Extract<SessionPlan, { kind: 'render' }>;

type Phase =
  | { kind: 'loading' }
  | { kind: 'question'; plan: RenderPlan }
  // Reached when the server reports the session bound is met. FE-3f owns the real results screen;
  // this batch only needs to arrive here cleanly and stop, rather than dead-ending on a blank
  // question surface.
  | { kind: 'completed'; progress: SessionProgress }
  | { kind: 'unrenderable'; requestId: string }
  | { kind: 'failure'; failure: SessionFailure; requestId: string | null };

const failureCopy: Record<SessionFailure, { title: string; detail: string }> = {
  authentication: { title: 'Sign-in needed', detail: 'Ask a grown-up to help you sign in again.' },
  conflict: { title: 'One moment', detail: "Something changed — let's take another look." },
  network: { title: 'No connection', detail: 'Check the internet and try again in a moment.' },
  technical: { title: 'Something went wrong', detail: 'Try again in a little while.' },
};

export function LiveSessionScreen({ sessionId }: { sessionId: string }) {
  const { getAccessToken } = useAuth();
  const configResult = useMemo(() => readPublicConfig(), []);
  const api = useMemo(
    () => (configResult.config ? createComponentBApi(configResult.config) : null),
    [configResult.config],
  );

  const [phase, setPhase] = useState<Phase>({ kind: 'loading' });
  const [answer, setAnswer] = useState<AnswerState | null>(null);
  const [outcome, setOutcome] = useState<AttemptOutcome | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [hints, setHints] = useState<HintState | null>(null);
  const [requestingHint, setRequestingHint] = useState(false);
  // Server-reported progress. Null until the first advance, because POST /opportunities does not
  // report it — showing nothing is more honest than seeding a client-side guess.
  const [progress, setProgress] = useState<SessionProgress | null>(null);
  const [advancing, setAdvancing] = useState(false);
  const mountedRef = useRef(true);
  const runningRef = useRef(false);
  // client_elapsed_ms is telemetry only and is never read for correctness (server timestamps are
  // authoritative). Measured from the moment the question surface becomes answerable — which is
  // also reset when the child chooses to try again — to the submit tap.
  const shownAtRef = useRef<number>(Date.now());

  /**
   * Runs an authenticated call, refreshing the token once on an `unauthenticated` failure. The
   * refresh is a retry of the *same* call with the *same* arguments — for submits that means the
   * same idempotency key and the same body, so a retry can never record a second attempt.
   */
  const withToken = useCallback(
    async <T,>(call: (accessToken: string) => Promise<T>): Promise<T> => {
      const accessToken = await getAccessToken();
      if (!accessToken) throw new ApiClientError('unauthenticated', 'No access token is available.');
      try {
        return await call(accessToken);
      } catch (error) {
        if (!(error instanceof ApiClientError) || error.kind !== 'unauthenticated') throw error;
        const refreshed = await getAccessToken(true);
        if (!refreshed) throw error;
        return await call(refreshed);
      }
    },
    [getAccessToken],
  );

  const applyAttempt = useCallback(async (attempt: AttemptResponse) => {
    // The attempt is recorded server-side; the local recovery record has done its job.
    await clearPendingCommand();
    if (!mountedRef.current) return;
    setOutcome(classifyAttemptOutcome(attempt));
  }, []);

  /**
   * Mount (and post-409 resync) path.
   *
   * POST /opportunities takes no idempotency key and no body by design: it re-issues the session's
   * already-open question rather than minting a new one, which is exactly what makes it the
   * crash-recovery entry point. Calling it after a relaunch returns the same item_opportunity_id.
   */
  const presentOpportunity = useCallback(async () => {
    if (!api || runningRef.current) return;
    runningRef.current = true;
    setPhase({ kind: 'loading' });
    setOutcome(null);
    setSubmitting(false);
    try {
      const presentation = await withToken((token) => api.selectOpportunity(sessionId, token));
      if (!mountedRef.current) return;
      const plan = planPresentation(presentation, presentation.request_id);
      if (plan.kind !== 'render') {
        setPhase({ kind: 'unrenderable', requestId: plan.requestId });
        return;
      }
      setAnswer(initialAnswerState(plan.spec));
      // Hint state is scoped to the opportunity, so a re-presentation of the *same* question (the
      // crash-recovery path) keeps hints the child has already been given, while a genuinely new
      // question starts from scratch. FE-3e advancing the loop in place needs no change here.
      setHints((current) => hintStateFor(current, plan.itemOpportunityId));
      setRequestingHint(false);
      shownAtRef.current = Date.now();
      setPhase({ kind: 'question', plan });

      // Offline-recovery replay. A saved submit for *this* opportunity is resent verbatim — same
      // key, same body — so the server returns the original attempt instead of recording a second
      // one. A saved submit for a different opportunity belongs to a question that has already
      // moved on, so it is discarded rather than sent.
      const decision = decidePendingReplay(await loadPendingCommand(), sessionId, plan.itemOpportunityId);
      if (decision.action === 'discard') {
        await clearPendingCommand();
        return;
      }
      if (decision.action === 'replay') {
        await sendSubmit(decision.command);
      }
    } catch (error) {
      if (!mountedRef.current) return;
      setPhase({
        kind: 'failure',
        failure: classifyFailure(error),
        requestId: failureRequestId(error),
      });
    } finally {
      runningRef.current = false;
    }
    // sendSubmit is declared below and is stable for the same reasons `api`/`withToken` are; the
    // mutual reference is broken with a ref-free forward declaration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, sessionId, withToken]);

  const sendSubmit = useCallback(
    async (command: PendingSubmitResponseCommand) => {
      if (!api) return;
      setSubmitting(true);
      try {
        const attempt = await withToken((token) =>
          api.submitResponse(
            command.sessionId,
            command.itemOpportunityId,
            command.idempotencyKey,
            command.body,
            token,
          ),
        );
        await applyAttempt(attempt);
      } catch (error) {
        if (!mountedRef.current) return;
        const failure = classifyFailure(error);
        if (failure === 'conflict') {
          // 409 means the server's view of this opportunity has moved on. Re-ask it what to show
          // and render whatever comes back — never a client-side rule about what "should" have
          // happened.
          await clearPendingCommand();
          if (mountedRef.current) await presentOpportunity();
          return;
        }
        // Anything else leaves the pending command persisted on purpose: it is the record that
        // lets the next mount replay this exact key and body instead of losing the attempt.
        setPhase({ kind: 'failure', failure, requestId: failureRequestId(error) });
      } finally {
        if (mountedRef.current) setSubmitting(false);
      }
    },
    [api, applyAttempt, presentOpportunity, withToken],
  );

  const submitAnswer = useCallback(async () => {
    if (phase.kind !== 'question' || !answer || submitting) return;
    const submittedValue = encodeSubmittedValue(phase.plan.spec, answer);
    // Unreachable via the button (it is disabled in exactly this case); kept because "no
    // submittable value" must never become "send something anyway".
    if (submittedValue === null) return;

    const command: PendingSubmitResponseCommand = {
      body: {
        client_elapsed_ms: Math.max(0, Date.now() - shownAtRef.current),
        submitted_value: submittedValue,
      },
      createdAt: new Date().toISOString(),
      endpoint: '/api/v1/b/sessions/{sessionId}/opportunities/{itemOpportunityId}/responses',
      idempotencyKey: Crypto.randomUUID(),
      itemOpportunityId: phase.plan.itemOpportunityId,
      kind: 'submit_response',
      sessionId,
    };
    // Persisted *before* the request, never after: if the response is lost, the key and the exact
    // body survive. The server fingerprints the body into the idempotency record, so a replay must
    // resend the saved body — one reconstructed later would fail the fingerprint check, and
    // client_elapsed_ms is unrecoverable after a relaunch.
    await savePendingCommand(command);
    await sendSubmit(command);
  }, [answer, phase, sendSubmit, sessionId, submitting]);

  /**
   * Ask for the next hint. The client never requests or sends a level — the server derives it from
   * its own count of prior hint events, under the opportunity row lock, strictly L1 → L2 → L3.
   *
   * A 409 is the ordinary outcome (only 2 of 36 templates carry hint content) and is handled as a
   * normal, neutral end state rather than an error: the control closes for this opportunity and
   * the child gets forward-pointing copy. No attempt is made to work out *which* 409 it was; the
   * server maps "no content", "blank content", "checksum mismatch" and "already at L3" to one
   * indistinguishable ConflictError on purpose, so nothing can leak the answer through the error
   * path.
   *
   * Nothing here touches the answer surface. Asking for help never blocks answering, and a hint is
   * never a mastery/BKT observation, so it costs the child nothing.
   */
  const requestHint = useCallback(async () => {
    if (!api || phase.kind !== 'question' || requestingHint) return;
    const scoped = hintStateFor(hints, phase.plan.itemOpportunityId);
    if (!canRequestHint(scoped)) return;

    // Reuse a persisted key for this same opportunity if one survived. If a previous request
    // succeeded but its response was lost (network drop, app kill), a *fresh* key would make the
    // server count that first event and escalate — the child would silently never see L1, the
    // gentlest hint. Replaying the saved key returns the original level and content instead.
    const pending = decidePendingAssist(
      await loadPendingCommand(),
      sessionId,
      phase.plan.itemOpportunityId,
    );
    const command: PendingRequestAssistCommand =
      pending.action === 'reuse'
        ? pending.command
        : {
            createdAt: new Date().toISOString(),
            endpoint: '/api/v1/b/sessions/{sessionId}/opportunities/{itemOpportunityId}/assists',
            idempotencyKey: Crypto.randomUUID(),
            itemOpportunityId: phase.plan.itemOpportunityId,
            kind: 'request_assist',
            sessionId,
          };

    setRequestingHint(true);
    try {
      // Persisted before the request, never after — that ordering is the whole protection.
      if (pending.action !== 'reuse') await savePendingCommand(command);
      const hint = await withToken((token) =>
        api.requestAssist(
          command.sessionId,
          command.itemOpportunityId,
          command.idempotencyKey,
          token,
        ),
      );
      await clearPendingCommand();
      if (!mountedRef.current) return;
      setHints((current) => recordHint(hintStateFor(current, hint.item_opportunity_id), hint));
    } catch (error) {
      const failure = classifyFailure(error);
      if (failure === 'conflict') {
        // The normal case. The key has done its job; there is nothing left to replay.
        await clearPendingCommand();
        if (!mountedRef.current) return;
        setHints((current) =>
          markHintsUnavailable(hintStateFor(current, command.itemOpportunityId)),
        );
        return;
      }
      // Any other failure deliberately changes no state: the key stays persisted so the next tap
      // replays it rather than escalating, and the control stays available so the child may simply
      // try again. It is not promoted to the full-screen failure phase either — losing the question
      // because a hint request failed would be a far worse outcome than not getting the hint.
    } finally {
      if (mountedRef.current) setRequestingHint(false);
    }
  }, [api, hints, phase, requestingHint, sessionId, withToken]);

  /**
   * Move to the next question.
   *
   * The advance response carries the next presentation inline, so it is rendered directly — no
   * second POST /opportunities. The idempotency fingerprint is `{session_id,
   * item_opportunity_id}`, so a replay of the same key returns the original advance: no
   * double-close and no skipped question. That is why the key is persisted before the request and
   * cleared only on success — a lost response retried with a *fresh* key would risk closing an
   * opportunity twice.
   */
  const advance = useCallback(async () => {
    if (!api || phase.kind !== 'question' || advancing) return;
    // Advancing requires at least one recorded attempt (session_completion.py:321-325); the
    // control is gated on an outcome being on screen, so this is belt-and-braces.
    if (!canAdvance(outcome !== null)) return;

    const command: PendingCompleteOpportunityCommand = {
      createdAt: new Date().toISOString(),
      endpoint: '/api/v1/b/sessions/{sessionId}/opportunities/{itemOpportunityId}/complete',
      idempotencyKey: Crypto.randomUUID(),
      itemOpportunityId: phase.plan.itemOpportunityId,
      kind: 'complete_opportunity',
      sessionId,
    };

    setAdvancing(true);
    try {
      // Overwrites the shared pending slot, which is correct here: any command still sitting in it
      // belongs to the question being left behind (FE-3d's assist key, for instance), and a stale
      // command must never survive into the next question.
      await savePendingCommand(command);
      const response = await withToken((token) =>
        api.completeOpportunity(
          command.sessionId,
          command.itemOpportunityId,
          command.idempotencyKey,
          token,
        ),
      );
      await clearPendingCommand();
      if (!mountedRef.current) return;

      const decision = decideAdvance(response);
      if (decision.kind === 'drift') {
        // Neither a next question nor a finished session. Re-ask rather than guess.
        await presentOpportunity();
        return;
      }
      setProgress(decision.progress);
      if (decision.kind === 'completed') {
        setPhase({ kind: 'completed', progress: decision.progress });
        return;
      }
      if (decision.plan.kind !== 'render') {
        setPhase({ kind: 'unrenderable', requestId: decision.plan.requestId });
        return;
      }
      // Everything scoped to the question being left goes with it: the answer, the outcome, the
      // hints (keyed on item_opportunity_id since FE-3d, so this is a re-key rather than a manual
      // clear) and the elapsed-time reference behind client_elapsed_ms.
      setAnswer(initialAnswerState(decision.plan.spec));
      setOutcome(null);
      setHints(hintStateFor(null, decision.plan.itemOpportunityId));
      setRequestingHint(false);
      shownAtRef.current = Date.now();
      setPhase({ kind: 'question', plan: decision.plan });
    } catch (error) {
      if (!mountedRef.current) return;
      const failure = classifyFailure(error);
      if (failure === 'conflict') {
        // Almost certainly "no attempt recorded yet" or a state that has already moved on. Re-ask
        // POST /opportunities and render whatever the server returns — never a client-side rule
        // about what should have happened.
        await clearPendingCommand();
        if (mountedRef.current) await presentOpportunity();
        return;
      }
      setPhase({ kind: 'failure', failure, requestId: failureRequestId(error) });
    } finally {
      if (mountedRef.current) setAdvancing(false);
    }
  }, [advancing, api, outcome, phase, presentOpportunity, sessionId, withToken]);

  const tryAgain = useCallback(() => {
    if (phase.kind !== 'question') return;
    setOutcome(null);
    setAnswer(initialAnswerState(phase.plan.spec));
    shownAtRef.current = Date.now();
  }, [phase]);

  useEffect(() => {
    mountedRef.current = true;
    if (!api) {
      setPhase({ kind: 'failure', failure: 'technical', requestId: null });
    } else {
      void presentOpportunity();
    }
    return () => {
      mountedRef.current = false;
    };
  }, [api, presentOpportunity]);

  const goHome = useCallback(() => router.replace('/(learner)/home'), []);

  /**
   * Leaving a finished session. The stored active-session id has done its job; leaving it behind
   * would let a later launch offer "Resume" and then try to resume a session the server has already
   * completed. Results are not persisted and are not deep-linkable — deliberately, since the app
   * keeps no learner-facing record of performance — so once this screen is left there is nothing to
   * return to, and the child lands on preparation and starts fresh.
   */
  const exitSession = useCallback(async () => {
    await clearActiveSessionId();
    goHome();
  }, [goHome]);

  if (phase.kind === 'loading') {
    return (
      <SessionFrame>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
          <AppText align="center" style={styles.muted}>
            Getting your question ready…
          </AppText>
        </View>
      </SessionFrame>
    );
  }

  if (phase.kind === 'completed') {
    // The progress numbers come straight from the completion response — GET /summary is not called
    // (see component-b-api.ts's note on getSessionSummary). See SessionResultsScreen for why this
    // surface carries counts and nothing evaluative.
    return <SessionResultsScreen onExit={() => void exitSession()} progress={phase.progress} />;
  }

  if (phase.kind === 'unrenderable' || phase.kind === 'failure') {
    // The fail-closed screen. Neutral, child-appropriate, one way forward, and a support code a
    // grown-up can quote. Never a free-text box: a text input shown against a question whose
    // answer surface could not be resolved lets a child submit something the item cannot accept
    // and then be told they were wrong.
    const copy =
      phase.kind === 'unrenderable'
        ? { title: "This one isn't ready", detail: "Let's head back and try again soon." }
        : failureCopy[phase.failure];
    const supportCode = phase.requestId;
    return (
      <SessionFrame>
        <View style={styles.centered}>
          <View style={styles.iconCircle}>
            <Ionicons color={colors.primary} name="alert-circle-outline" size={44} />
          </View>
          <AppText align="center" variant="title">
            {copy.title}
          </AppText>
          <AppText align="center" style={styles.muted}>
            {copy.detail}
          </AppText>
          {supportCode ? (
            <AppText align="center" style={styles.supportCode}>
              Support code: {supportCode}
            </AppText>
          ) : null}
          <PrimaryButton label="BACK TO HOME" onPress={goHome} />
        </View>
      </SessionFrame>
    );
  }

  const { plan } = phase;
  const encoded = answer ? encodeSubmittedValue(plan.spec, answer) : null;
  const view = outcome ? outcomeView(outcome) : null;
  // The deadline is read, and then deliberately does not gate anything (see
  // isAnswerSurfaceDisabled for the soft-lock reasoning). There is no countdown and no "time is
  // running out" warning: a ticking clock in front of a seven-year-old is an anxiety device, and
  // it would be counting down to something the client cannot enforce anyway. The child answers,
  // the server rules TIMEOUT, and the neutral outcome copy tells them.
  const answeringDisabled = isAnswerSurfaceDisabled({
    deadlinePassed: isDeadlinePassed(plan.timeoutDeadlineUtc, Date.now()),
    hasOutcome: outcome !== null,
    submitting,
  });
  // Submit is unavailable precisely when there is nothing submittable: no selection yet, a blank
  // expanded_form, an unset count. That mirrors the server's own min_length=1, so the disabled
  // state prevents a guaranteed 422 — it is not a correctness judgement about the answer. It is
  // never unavailable because time has run out; that submit is what records the TIMEOUT.
  const canSubmit = encoded !== null && !answeringDisabled;
  const hintView = hintStateFor(hints, plan.itemOpportunityId);
  // Resolved from payload keys, never from item_template_id or representation_type — see the
  // registry for why both of those would be wrong. `selectable-pool` is an answer surface rather
  // than an illustration, so it is routed into CountSelection below instead of being drawn here.
  const promptVisual = resolvePromptVisual(plan.promptPayload);
  const passiveVisual = promptVisual?.kind === 'selectable-pool' ? null : promptVisual;
  const poolSize = promptVisual?.kind === 'selectable-pool' ? promptVisual.poolSize : undefined;

  return (
    <SessionFrame>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <View style={styles.skillPill}>
            <Ionicons color={colors.primaryShadow} name="sparkles" size={16} />
            <AppText style={styles.skillText}>{plan.skillLabel || 'Maths'}</AppText>
          </View>
          {/* Straight from the server's own numbers — never a client-side counter, and never a
              client-side bound. Absent until the first advance reports them. */}
          {progress ? (
            <AppText style={styles.progressText}>
              {`${progress.completed} of ${progress.totalBound}`}
            </AppText>
          ) : null}
        </View>

        <View style={styles.promptCard}>
          <AppText style={styles.stem}>{plan.stem}</AppText>
          {/* FE-3g — the concrete representation the question refers to. `prompt` carries content
              keys beyond `stem`, and rendering only the stem left 7 of 14 Grade 2 templates
              unanswerable. `null` means this payload has no visual, which renders stem-only exactly
              as before. The visual presents the quantity the server sent and nothing else: no
              counting, no comparing, no checking the child. */}
          {passiveVisual ? (
            <View style={styles.visual}>
              <PromptVisual spec={passiveVisual} />
            </View>
          ) : null}
        </View>

        {answer?.kind === 'choice' && plan.spec.kind === 'choice' ? (
          <ChoiceGrid
            disabled={answeringDisabled}
            onChange={setAnswer}
            spec={plan.spec}
            state={answer}
          />
        ) : null}
        {answer?.kind === 'free-entry' && plan.spec.kind === 'free-entry' ? (
          <FreeEntry
            disabled={answeringDisabled}
            onChange={setAnswer}
            spec={plan.spec}
            state={answer}
          />
        ) : null}
        {answer?.kind === 'count-selection' && plan.spec.kind === 'count-selection' ? (
          <CountSelection
            disabled={answeringDisabled}
            // Remount per question so the pool's local selection state cannot survive an advance.
            // (The surface also clears itself when the answer is reseeded, which is what "Try again"
            // does without changing the opportunity — both paths matter.)
            key={plan.itemOpportunityId}
            onChange={setAnswer}
            poolSize={poolSize}
            spec={plan.spec}
            state={answer}
          />
        ) : null}

        {/* Hints sit below the answer surface and never gate it: the child can answer at any
            point, with or without asking for help. Every hint the child has been given stays on
            screen — L2 elaborates on L1, so replacing would take away the scaffold. */}
        {hintView.received.map((hint) => (
          <View key={hint.hint_level} style={styles.hintCard}>
            <View style={styles.hintHeader}>
              <Ionicons color={colors.accentBlue} name="bulb" size={18} />
              <AppText style={styles.hintLevel}>Hint {hint.hint_level}</AppText>
            </View>
            <AppText>{hint.content}</AppText>
          </View>
        ))}

        {canRequestHint(hintView) ? (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: requestingHint }}
            disabled={requestingHint}
            onPress={() => void requestHint()}
            style={({ pressed }) => [styles.hintButton, pressed && styles.pressed]}>
            {requestingHint ? (
              <ActivityIndicator color={colors.accentBlue} size="small" />
            ) : (
              <>
                <Ionicons color={colors.accentBlue} name="bulb-outline" size={20} />
                <AppText style={styles.hintButtonText}>
                  {hintView.received.length > 0 ? 'ANOTHER HINT' : 'I NEED A HINT'}
                </AppText>
              </>
            )}
          </Pressable>
        ) : (
          <AppText style={styles.hintClosed}>{HINTS_UNAVAILABLE_COPY}</AppText>
        )}

        {view ? (
          <View
            style={[
              styles.outcomeCard,
              outcome === 'correct' && styles.outcomeCorrect,
              outcome === 'incorrect' && styles.outcomeIncorrect,
            ]}>
            <AppText style={styles.outcomeTitle}>{view.title}</AppText>
            <AppText style={styles.muted}>{view.detail}</AppText>
          </View>
        ) : null}

        {/* Once an attempt is on record the child can always move on, including after a wrong
            answer — trying again is offered, never required. */}
        {view?.canTryAgain ? <PrimaryButton label="TRY AGAIN" onPress={tryAgain} /> : null}
        {view ? (
          <PrimaryButton
            busy={advancing}
            label="NEXT QUESTION"
            onPress={() => void advance()}
            variant={view.canTryAgain ? 'secondary' : 'primary'}
          />
        ) : null}
        {!view ? (
          <PrimaryButton
            busy={submitting}
            disabled={!canSubmit}
            label="CHECK MY ANSWER"
            onPress={() => void submitAnswer()}
          />
        ) : null}
      </ScrollView>
    </SessionFrame>
  );
}

function SessionFrame({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.canvas}>{children}</View>
    </SafeAreaView>
  );
}

function PrimaryButton({
  busy = false,
  disabled = false,
  label,
  onPress,
  variant = 'primary',
}: {
  busy?: boolean;
  disabled?: boolean;
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
}) {
  const secondary = variant === 'secondary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.buttonSecondary,
        (disabled || busy) && styles.buttonDisabled,
        pressed && !disabled && !busy && styles.pressed,
      ]}>
      {busy ? (
        <ActivityIndicator color={secondary ? colors.primary : colors.primaryForeground} size="small" />
      ) : (
        <AppText style={[styles.buttonText, secondary && styles.buttonTextSecondary]}>{label}</AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: colors.primary,
    borderColor: colors.surface1,
    borderRadius: radius.md,
    borderWidth: 2,
    justifyContent: 'center',
    minHeight: 62,
    paddingHorizontal: spacing.lg,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonSecondary: { backgroundColor: colors.surface1, borderColor: colors.primary },
  buttonTextSecondary: { color: colors.primary },
  buttonText: {
    color: colors.primaryForeground,
    fontFamily: typography.fonts.bold,
    fontSize: 17,
    letterSpacing: typography.letterSpacing.button,
  },
  canvas: { alignSelf: 'center', backgroundColor: colors.background, flex: 1, maxWidth: 500, width: '100%' },
  centered: { alignItems: 'center', flex: 1, gap: spacing.md, justifyContent: 'center', padding: spacing.lg },
  hintButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.secondarySoft,
    borderColor: colors.secondary,
    borderRadius: radius.pill,
    borderWidth: 2,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  hintButtonText: {
    color: colors.secondaryForeground,
    fontFamily: typography.fonts.bold,
    fontSize: typography.fontSize.sm,
    letterSpacing: typography.letterSpacing.button,
  },
  hintCard: {
    backgroundColor: colors.secondarySoft,
    borderColor: colors.secondary,
    borderRadius: radius.md,
    borderWidth: 2,
    gap: spacing.xs,
    padding: spacing.smPlus,
  },
  hintClosed: { color: colors.textSecondary },
  hintHeader: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  hintLevel: {
    color: colors.secondaryForeground,
    fontFamily: typography.fonts.bold,
    fontSize: typography.fontSize.sm,
    letterSpacing: typography.letterSpacing.label,
  },
  headerRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  iconCircle: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.xl,
    height: 88,
    justifyContent: 'center',
    width: 88,
  },
  muted: { color: colors.textSecondary },
  outcomeCard: {
    backgroundColor: colors.surface2,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 2,
    gap: spacing.xs,
    padding: spacing.md,
  },
  outcomeCorrect: { backgroundColor: '#e9f8f1', borderColor: colors.success },
  outcomeIncorrect: { backgroundColor: colors.secondarySoft, borderColor: colors.secondary },
  outcomeTitle: {
    fontFamily: typography.fonts.display,
    fontSize: typography.fontSize.subtitle,
    lineHeight: typography.lineHeight.subtitle,
  },
  pressed: { opacity: 0.85 },
  progressText: {
    color: colors.textSecondary,
    fontFamily: typography.fonts.bold,
    fontSize: typography.fontSize.sm,
  },
  promptCard: {
    backgroundColor: colors.surface1,
    borderBottomColor: colors.borderStrong,
    borderBottomWidth: 3,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 2,
    padding: spacing.md,
  },
  safeArea: { backgroundColor: colors.background, flex: 1 },
  scroll: { gap: spacing.md, padding: spacing.md, paddingBottom: spacing.xl },
  skillPill: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.smPlus,
    paddingVertical: spacing.xs,
  },
  skillText: {
    color: colors.primaryShadow,
    fontFamily: typography.fonts.bold,
    fontSize: typography.fontSize.sm,
    letterSpacing: typography.letterSpacing.label,
  },
  stem: {
    fontFamily: typography.fonts.display,
    fontSize: typography.fontSize.subtitle,
    lineHeight: typography.lineHeight.subtitle,
    maxWidth: '100%',
  },
  supportCode: { color: colors.textMuted, fontSize: typography.fontSize.xs },
  visual: { marginTop: spacing.md },
});
