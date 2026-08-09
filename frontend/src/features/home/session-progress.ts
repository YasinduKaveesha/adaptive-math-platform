// Pure logic for the home screen's progress panel (FE-2b).
//
// WHAT CHANGED AND WHY. The panel used to present five hardcoded lessons — Counting, Number Sense,
// Place Value, Addition, Subtraction — with node 1 labelled "Current Lesson" and the rest "On your
// path". The server exposes no path, no ordering, no per-skill progress and no mastery, so every
// word of that was unbacked: it told a child they were on a journey the backend has no concept of.
//
// The nodes now mean the questions in the current session, which is real and server-reported
// (`opportunities_completed` / `opportunities_total_bound` from GET /b/sessions/{id}/summary) and
// needs no new endpoint. They are positional — question 1, 2, 3 — and carry no skill name, because
// the client cannot know which skill any future question will exercise; selection happens
// server-side, one question at a time.
//
// Nothing here imports react or react-native: the screen keeps the artwork and layout, this keeps
// the derivation, and the derivation is testable under the existing node:test runner.

export type PathNodeState = 'done' | 'current' | 'pending';

export type HomeSessionState =
  | { kind: 'in-progress'; sessionId: string; completed: number; totalBound: number }
  | { kind: 'not-in-progress' };

/**
 * Combine the two reads the home screen makes into the one state the panel renders.
 *
 * DEGRADES TO not-in-progress ON ANY DOUBT, and that is safe rather than lossy: `POST /b/sessions`
 * never 409s on an existing session — it takes an advisory lock, finds any starting-or-active
 * session for the learner and returns it (`b_session_lifecycle.py:185-194`). So a learner shown
 * "Start" when they actually had a session open simply resumes it on tap. This mirrors FE-2a's
 * treatment of the same read on the prep screen.
 *
 * There is deliberately **no "first time" state.** The server cannot distinguish a brand-new learner
 * from a returning one, and a device-local "has played before" flag would be a guess that is wrong
 * after a reinstall and wrong on a second device — it would tell a returning child they are new, or
 * a new child they are returning. One neutral not-in-progress state covers both honestly. A genuine
 * cold-start distinction needs a backend endpoint, which is a separate decision, not a client
 * workaround.
 */
export function combineHomeSessionState(
  session: { session_id: string; state: string } | null,
  summary: { opportunities_completed: number; opportunities_total_bound: number } | null,
): HomeSessionState {
  if (!session || session.state !== 'active') return { kind: 'not-in-progress' };
  if (!summary) return { kind: 'not-in-progress' };
  const { opportunities_completed: completed, opportunities_total_bound: totalBound } = summary;
  if (!Number.isInteger(completed) || !Number.isInteger(totalBound)) return { kind: 'not-in-progress' };
  if (totalBound < 1 || completed < 0) return { kind: 'not-in-progress' };
  return { kind: 'in-progress', sessionId: session.session_id, completed, totalBound };
}

/**
 * The state of each node the panel should draw.
 *
 * The count comes from `opportunities_total_bound`, never from a literal — the per-session
 * opportunity cap is an unapproved engineering placeholder, and there is already a guard test
 * against hardcoding it (see session-advance.test.ts). Five is not assumed anywhere.
 *
 * `availablePositions` is how many node positions the artwork actually has. That is a fact about the
 * illustration, not about the session, which is why it is passed in rather than inferred: if the
 * server ever reports a bound larger than the artwork can hold, the extra questions are simply not
 * drawn — the panel renders what fits instead of overflowing or breaking the layout the artwork
 * defines. A smaller bound draws fewer nodes.
 */
export function derivePathNodeStates(
  state: HomeSessionState,
  availablePositions: number,
): PathNodeState[] {
  const positions = Math.max(0, Math.trunc(availablePositions));
  if (state.kind === 'not-in-progress') {
    // Neutral and unfilled: no node is "current", because nothing is in progress. Notably this is
    // also what a brand-new learner sees, on purpose — see combineHomeSessionState.
    return Array.from({ length: positions }, () => 'pending');
  }
  const count = Math.min(state.totalBound, positions);
  const completed = Math.min(Math.max(state.completed, 0), count);
  return Array.from({ length: count }, (_unused, index) => {
    if (index < completed) return 'done';
    // A session whose completed count has reached the drawn node count has no "current" node left —
    // every node reads done, and the hero still offers Resume so the child can finish it.
    if (index === completed) return 'current';
    return 'pending';
  });
}

/** Label for the node itself. Positional only — no skill name, because the client cannot know it. */
export function pathNodeLabel(index: number, state: PathNodeState): string {
  const ordinal = `Question ${index + 1}`;
  if (state === 'done') return `${ordinal}, answered`;
  if (state === 'current') return `${ordinal}, up next`;
  return `${ordinal}, not started`;
}
