/** First whitespace-separated token of a full name, for greeting copy only — never sent to the
 * backend or used to identify a learner. Falls through unchanged for an already-single-word or
 * empty input. */
export function firstNameOf(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return trimmed;
  return trimmed.split(/\s+/)[0];
}
