import { router } from 'expo-router';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from '@/src/auth/auth-context';
import { putCSessionPrefetch } from '@/src/features/c-session/c-session-prefetch-cache';
import { prefetchCSessionBootstrap } from '@/src/features/c-session/c-session-prefetch';
import {
  ADVENTURE_CHARGE_MAX_LEVEL,
  awardAdventureCharge,
  getAdventureChargeLevel,
} from '@/src/utils/adventure-charge';

const PILL_VISIBLE_MS = 2600;

/** `LearnerMembershipListItem.grade` is already fetched everywhere `me.classroomMembership` is
 * (the same live GET the header/onboarding already rely on) -- no new backend call. Component C's
 * route (`c-session.tsx`) wants the plain number `CreateCSessionRequest` itself uses. */
function numericGrade(grade: 'GRADE_2' | 'GRADE_3' | undefined): number | undefined {
  if (grade === 'GRADE_2') return 2;
  if (grade === 'GRADE_3') return 3;
  return undefined;
}

type AdventureChargeContextValue = {
  level: number;
  maxLevel: number;
  pillVisible: boolean;
  /** True from the moment Play is pressed (at full charge) until navigation actually happens or
   * the attempt fails. Home renders its full-screen blur+spinner overlay while this is true. */
  preparingPlay: boolean;
  /** Play's own press handler: navigates only at maxLevel, otherwise shows the pill instead. */
  requestPlay: () => void;
  /** Called once from the session screen when a Component B session genuinely completes. */
  awardForSession: (sessionId: string) => void;
};

const AdventureChargeContext = createContext<AdventureChargeContextValue | null>(null);

/** Wraps the (learner) route group so the header (which shows the gauge and the pill) and the
 * tab bar (whose Play button triggers the pill) can share one charge state without prop-drilling
 * it through every screen that renders both. */
export function AdventureChargeProvider({ children }: { children: React.ReactNode }) {
  const { getAccessToken, me } = useAuth();
  const subject = me?.principal.user_id ?? null;
  const grade = numericGrade(me?.classroomMembership?.grade);
  const [level, setLevel] = useState(0);
  const [pillVisible, setPillVisible] = useState(false);
  const [preparingPlay, setPreparingPlay] = useState(false);
  const pillTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!subject) {
      setLevel(0);
      return;
    }
    let cancelled = false;
    void getAdventureChargeLevel(subject).then((value) => {
      if (!cancelled) setLevel(value);
    });
    return () => {
      cancelled = true;
    };
  }, [subject]);

  useEffect(
    () => () => {
      if (pillTimerRef.current) clearTimeout(pillTimerRef.current);
    },
    [],
  );

  const awardForSession = useCallback(
    (sessionId: string) => {
      if (!subject) return;
      void awardAdventureCharge(subject, sessionId).then(setLevel);
    },
    [subject],
  );

  const requestPlay = useCallback(() => {
    if (level >= ADVENTURE_CHARGE_MAX_LEVEL) {
      // Straight into a real Component C session -- no game-hub family menu (removed on owner
      // instruction, 2026-08-27). `grade` is the learner's own, real classroom grade (never
      // invented here); no family/template is passed at all, so c-session.tsx's own adaptive
      // selection (BKT) is what picks it, exactly as Component C was built to -- the frontend was
      // never meant to choose a family. If grade is somehow unavailable (it should always be
      // present once Play is reachable at all, since that already requires an APPROVED classroom
      // membership), do nothing rather than sending the child into c-session.tsx's dead-end "not
      // ready" screen -- Home, which is where this press already happened, is still exactly right.
      if (grade === undefined) return;
      // Prefetch while Home's own blur+spinner overlay covers the wait -- navigation happens only
      // AFTER the prefetch settles, so the overlay covers the entire real wait, not just an
      // instant. c-session.tsx never shows its own separate loading screen for this first task;
      // see c-session-prefetch-cache.ts for why this is safe (unlike the Component B attempt
      // reverted earlier today). Best-effort either way: a failed prefetch still navigates, just
      // into c-session.tsx's own normal bootstrap-and-loading path, exactly as if none of this
      // existed.
      setPreparingPlay(true);
      const prefetch = prefetchCSessionBootstrap(grade, getAccessToken);
      if (subject) putCSessionPrefetch(subject, prefetch);
      void prefetch.catch(() => null).finally(() => {
        router.replace({ params: { grade: String(grade), sessionMode: 'c_only' }, pathname: '/(learner)/c-session' });
        setPreparingPlay(false);
      });
      return;
    }
    setPillVisible(true);
    if (pillTimerRef.current) clearTimeout(pillTimerRef.current);
    pillTimerRef.current = setTimeout(() => setPillVisible(false), PILL_VISIBLE_MS);
  }, [getAccessToken, grade, level, subject]);

  const value = useMemo<AdventureChargeContextValue>(
    () => ({
      level,
      maxLevel: ADVENTURE_CHARGE_MAX_LEVEL,
      pillVisible,
      preparingPlay,
      requestPlay,
      awardForSession,
    }),
    [awardForSession, level, pillVisible, preparingPlay, requestPlay],
  );

  return <AdventureChargeContext.Provider value={value}>{children}</AdventureChargeContext.Provider>;
}

export function useAdventureCharge(): AdventureChargeContextValue {
  const value = useContext(AdventureChargeContext);
  if (!value) throw new Error('useAdventureCharge must be used within an AdventureChargeProvider');
  return value;
}
