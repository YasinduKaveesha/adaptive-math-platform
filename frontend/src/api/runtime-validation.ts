import type {
  ApiErrorEnvelope,
  AuthenticatedPrincipal,
  HealthReadyResponse,
  InviteResolveResponse,
  InviteTokenRequest,
  LearnerMembershipListItem,
  LearnerMembershipListResponse,
  LearnerProfileResponse,
  MembershipRequestResponse,
  PendingCompleteOpportunityCommand,
  PendingRequestAssistCommand,
  PendingSessionCommand,
  PendingStartSessionCommand,
  PendingSubmitResponseCommand,
  ProfileCreateRequest,
  SessionCommandResponse,
} from '@/src/api/contracts';
import type {
  ActiveSessionResponse,
  AttemptResponse,
  HintRequestResponse,
  OpportunityAdvanceResponse,
  OpportunityPresentationFields,
  OpportunityPresentationResponse,
  SessionFields,
  SessionStandingResponse,
} from '@/src/api/generated/openapi-types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isApiErrorEnvelope(value: unknown): value is ApiErrorEnvelope {
  if (!isRecord(value)) return false;
  if (!isNonEmptyString(value.schema_version)) return false;
  if (!isRecord(value.error)) return false;

  const { error } = value;

  const detailsAreValid =
    error.details === undefined ||
    isRecord(error.details) ||
    (Array.isArray(error.details) && error.details.every(isRecord));

  return (
    isNonEmptyString(error.code) &&
    isNonEmptyString(error.message) &&
    isNonEmptyString(error.request_id) &&
    detailsAreValid
  );
}

export function isAuthenticatedPrincipal(value: unknown): value is AuthenticatedPrincipal {
  if (!isRecord(value)) return false;
  return (
    isNonEmptyString(value.user_id) &&
    (value.email === undefined || value.email === null || typeof value.email === 'string')
  );
}

export function isLearnerProfileResponse(value: unknown): value is LearnerProfileResponse {
  if (!isRecord(value)) return false;
  return (
    isNonEmptyString(value.learner_id) &&
    isNonEmptyString(value.user_id) &&
    isNonEmptyString(value.name) &&
    (value.email === null || typeof value.email === 'string') &&
    value.profile_type === 'LEARNER' &&
    isNonEmptyString(value.created_at_utc) &&
    isNonEmptyString(value.request_id)
  );
}

export function isProfileCreateRequest(value: unknown): value is ProfileCreateRequest {
  return isRecord(value) && isNonEmptyString(value.name);
}

export function isInviteTokenRequest(value: unknown): value is InviteTokenRequest {
  return isRecord(value) && isNonEmptyString(value.invite_token);
}

const classroomGrades = new Set(['GRADE_2', 'GRADE_3']);
const membershipStates = new Set(['PENDING', 'APPROVED', 'REJECTED']);

export function isInviteResolveResponse(value: unknown): value is InviteResolveResponse {
  if (!isRecord(value)) return false;
  return (
    isNonEmptyString(value.invite_resolution_id) &&
    (value.classroom_name === null || typeof value.classroom_name === 'string') &&
    typeof value.grade === 'string' &&
    classroomGrades.has(value.grade) &&
    isNonEmptyString(value.request_id)
  );
}

export function isMembershipRequestResponse(value: unknown): value is MembershipRequestResponse {
  if (!isRecord(value)) return false;
  return (
    isNonEmptyString(value.classroom_membership_id) &&
    isNonEmptyString(value.classroom_id) &&
    (value.classroom_name === null || typeof value.classroom_name === 'string') &&
    typeof value.grade === 'string' &&
    classroomGrades.has(value.grade) &&
    typeof value.state === 'string' &&
    membershipStates.has(value.state) &&
    isNonEmptyString(value.requested_at_utc) &&
    isNonEmptyString(value.request_id)
  );
}

function isLearnerMembershipListItem(value: unknown): value is LearnerMembershipListItem {
  if (!isRecord(value)) return false;
  return (
    isNonEmptyString(value.membership_id) &&
    isNonEmptyString(value.classroom_id) &&
    (value.classroom_name === null || typeof value.classroom_name === 'string') &&
    typeof value.grade === 'string' &&
    classroomGrades.has(value.grade) &&
    typeof value.state === 'string' &&
    membershipStates.has(value.state) &&
    isNonEmptyString(value.requested_at_utc) &&
    (value.decided_at_utc === null || typeof value.decided_at_utc === 'string')
  );
}

export function isLearnerMembershipListResponse(
  value: unknown,
): value is LearnerMembershipListResponse {
  return (
    isRecord(value) &&
    Array.isArray(value.memberships) &&
    value.memberships.every(isLearnerMembershipListItem) &&
    isNonEmptyString(value.request_id)
  );
}

const sessionCommandStates = new Set(['active', 'completed', 'abandoned']);

export function isHealthReadyResponse(value: unknown): value is HealthReadyResponse {
  const checksAreValid =
    isRecord(value) &&
    isRecord(value.checks) &&
    Object.values(value.checks).every((entry) => typeof entry === 'string');

  return (
    isRecord(value) &&
    value.status === 'ready' &&
    value.stage === 'infrastructure' &&
    isNonEmptyString(value.request_id) &&
    checksAreValid
  );
}

export function isSessionCommandResponse(value: unknown): value is SessionCommandResponse {
  return (
    isRecord(value) &&
    isNonEmptyString(value.session_id) &&
    typeof value.state === 'string' &&
    sessionCommandStates.has(value.state) &&
    isNonEmptyString(value.runtime_bundle_version) &&
    isNonEmptyString(value.created_at_utc) &&
    Number.isInteger(value.row_version) &&
    isNonEmptyString(value.request_id)
  );
}

function isFiniteNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

export function isPendingStartSessionCommand(value: unknown): value is PendingStartSessionCommand {
  if (!isRecord(value)) return false;
  return (
    value.kind === 'start_session' &&
    value.endpoint === '/api/v1/b/sessions' &&
    isNonEmptyString(value.idempotencyKey) &&
    isNonEmptyString(value.createdAt)
  );
}

export function isPendingSubmitResponseCommand(
  value: unknown,
): value is PendingSubmitResponseCommand {
  if (!isRecord(value)) return false;
  if (
    value.kind !== 'submit_response' ||
    value.endpoint !== '/api/v1/b/sessions/{sessionId}/opportunities/{itemOpportunityId}/responses'
  ) {
    return false;
  }
  if (!isRecord(value.body)) return false;
  return (
    isNonEmptyString(value.sessionId) &&
    isNonEmptyString(value.itemOpportunityId) &&
    typeof value.body.submitted_value === 'string' &&
    isFiniteNonNegativeNumber(value.body.client_elapsed_ms) &&
    isNonEmptyString(value.idempotencyKey) &&
    isNonEmptyString(value.createdAt)
  );
}

export function isPendingRequestAssistCommand(
  value: unknown,
): value is PendingRequestAssistCommand {
  if (!isRecord(value)) return false;
  return (
    value.kind === 'request_assist' &&
    value.endpoint === '/api/v1/b/sessions/{sessionId}/opportunities/{itemOpportunityId}/assists' &&
    isNonEmptyString(value.sessionId) &&
    isNonEmptyString(value.itemOpportunityId) &&
    isNonEmptyString(value.idempotencyKey) &&
    isNonEmptyString(value.createdAt)
  );
}

export function isPendingCompleteOpportunityCommand(
  value: unknown,
): value is PendingCompleteOpportunityCommand {
  if (!isRecord(value)) return false;
  return (
    value.kind === 'complete_opportunity' &&
    value.endpoint === '/api/v1/b/sessions/{sessionId}/opportunities/{itemOpportunityId}/complete' &&
    isNonEmptyString(value.sessionId) &&
    isNonEmptyString(value.itemOpportunityId) &&
    isNonEmptyString(value.idempotencyKey) &&
    isNonEmptyString(value.createdAt)
  );
}

export function isPendingSessionCommand(value: unknown): value is PendingSessionCommand {
  if (!isRecord(value) || !Object.prototype.hasOwnProperty.call(value, 'kind')) return false;
  switch (value.kind) {
    case 'start_session':
      return isPendingStartSessionCommand(value);
    case 'submit_response':
      return isPendingSubmitResponseCommand(value);
    case 'request_assist':
      return isPendingRequestAssistCommand(value);
    case 'complete_opportunity':
      return isPendingCompleteOpportunityCommand(value);
    default:
      return false;
  }
}

function isSessionFields(value: unknown): value is SessionFields {
  if (!isRecord(value)) return false;
  return (
    isNonEmptyString(value.session_id) &&
    typeof value.state === 'string' &&
    sessionCommandStates.has(value.state) &&
    isNonEmptyString(value.runtime_bundle_version) &&
    isNonEmptyString(value.created_at_utc) &&
    Number.isInteger(value.row_version)
  );
}

export function isActiveSessionResponse(value: unknown): value is ActiveSessionResponse {
  if (!isRecord(value)) return false;
  if (!isNonEmptyString(value.request_id)) return false;
  if (value.session === null) return true;
  return isSessionFields(value.session);
}

function isParsableDateString(value: unknown): value is string {
  return isNonEmptyString(value) && !Number.isNaN(Date.parse(value));
}

// Deliberately does not validate `response_format` against a hardcoded list of known formats —
// the renderer registry (Batch 8) owns that. A second list here would just be a second place for
// the set of known formats to drift out of sync with the registry's own list.
export function isOpportunityPresentationFields(
  value: unknown,
): value is OpportunityPresentationFields {
  if (!isRecord(value)) return false;
  if (!isRecord(value.prompt) || !isNonEmptyString(value.prompt.stem)) return false;
  return (
    isNonEmptyString(value.item_opportunity_id) &&
    isNonEmptyString(value.item_instance_id) &&
    isNonEmptyString(value.skill_id) &&
    typeof value.grade === 'number' &&
    isNonEmptyString(value.difficulty_level) &&
    isNonEmptyString(value.representation_type) &&
    isNonEmptyString(value.response_format) &&
    Array.isArray(value.presented_choices) &&
    value.presented_choices.every((choice) => typeof choice === 'string') &&
    isNonEmptyString(value.presentation_token) &&
    isParsableDateString(value.server_timeout_deadline_utc)
  );
}

export function isOpportunityPresentationResponse(
  value: unknown,
): value is OpportunityPresentationResponse {
  if (!isRecord(value)) return false;
  const fieldsValid = isOpportunityPresentationFields(value);
  return fieldsValid && isNonEmptyString(value.request_id);
}

export function isAttemptResponse(value: unknown): value is AttemptResponse {
  if (!isRecord(value)) return false;
  if (!isNonEmptyString(value.item_opportunity_id)) return false;
  if (!Number.isInteger(value.attempt_index)) return false;
  if (value.event_kind !== 'RESPONSE' && value.event_kind !== 'TIMEOUT') return false;
  // Cross-field invariant, enforced in both directions: a TIMEOUT never carries a match verdict
  // (the learner never answered) and a RESPONSE always does. Anything else — a RESPONSE with a
  // null match, or a TIMEOUT with a boolean — is drift the client must not silently pick a side
  // on; failing closed here means the client never has to guess which field to trust.
  if (value.event_kind === 'TIMEOUT' && value.response_matched !== null) return false;
  if (value.event_kind === 'RESPONSE' && typeof value.response_matched !== 'boolean') return false;
  return isNonEmptyString(value.server_submitted_at_utc) && isNonEmptyString(value.request_id);
}

export function isHintRequestResponse(value: unknown): value is HintRequestResponse {
  if (!isRecord(value)) return false;
  return (
    isNonEmptyString(value.item_opportunity_id) &&
    Number.isInteger(value.hint_level) &&
    isNonEmptyString(value.content) &&
    isNonEmptyString(value.content_id) &&
    isNonEmptyString(value.catalogue_version) &&
    isNonEmptyString(value.catalogue_checksum) &&
    isNonEmptyString(value.request_id)
  );
}

const opportunityAdvanceStates = new Set(['active', 'completed']);

export function isOpportunityAdvanceResponse(
  value: unknown,
): value is OpportunityAdvanceResponse {
  if (!isRecord(value)) return false;
  if (!isNonEmptyString(value.item_opportunity_id)) return false;
  if (typeof value.session_state !== 'string' || !opportunityAdvanceStates.has(value.session_state)) {
    return false;
  }
  if (!Number.isInteger(value.opportunities_completed)) return false;
  if (!Number.isInteger(value.opportunities_total_bound)) return false;
  if (value.next_opportunity !== null && !isOpportunityPresentationFields(value.next_opportunity)) {
    return false;
  }
  return isNonEmptyString(value.request_id);
}

export function isSessionStandingResponse(value: unknown): value is SessionStandingResponse {
  if (!isRecord(value)) return false;
  return (
    isNonEmptyString(value.session_id) &&
    typeof value.session_state === 'string' &&
    opportunityAdvanceStates.has(value.session_state) &&
    Number.isInteger(value.opportunities_completed) &&
    Number.isInteger(value.opportunities_total_bound) &&
    isNonEmptyString(value.request_id)
  );
}
