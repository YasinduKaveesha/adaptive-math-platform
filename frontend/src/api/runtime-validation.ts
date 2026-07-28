import type {
  ApiErrorEnvelope,
  HealthReadyResponse,
  MeResponse,
  PendingStartSessionCommand,
  StartSessionResponse,
} from '@/src/api/contracts';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isApiErrorEnvelope(value: unknown): value is ApiErrorEnvelope {
  if (!isRecord(value)) return false;

  const detailsAreValid =
    value.details === undefined ||
    (Array.isArray(value.details) &&
      value.details.every(
        (issue) =>
          isRecord(issue) && isNonEmptyString(issue.field) && isNonEmptyString(issue.code),
      ));

  return (
    isNonEmptyString(value.code) &&
    isNonEmptyString(value.message) &&
    isNonEmptyString(value.request_id) &&
    typeof value.retryable === 'boolean' &&
    detailsAreValid
  );
}

export function isMeResponse(value: unknown): value is MeResponse {
  if (!isRecord(value)) return false;

  const validRoles = new Set(['learner', 'supervisor', 'operator']);
  const rolesAreValid =
    Array.isArray(value.roles) &&
    value.roles.every((role) => typeof role === 'string' && validRoles.has(role));

  const learner = value.learner;
  const learnerIsValid =
    learner === null ||
    (isRecord(learner) &&
      isNonEmptyString(learner.learner_id) &&
      (learner.grade === 2 || learner.grade === 3) &&
      typeof learner.active === 'boolean' &&
      (learner.display_name === undefined || typeof learner.display_name === 'string'));

  return (
    isNonEmptyString(value.user_id) &&
    rolesAreValid &&
    learnerIsValid &&
    isNonEmptyString(value.request_id)
  );
}

const sessionStates = new Set([
  'starting',
  'active',
  'completing',
  'completed',
  'abandoned',
  'expired',
  'technical_failed',
]);

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

export function isStartSessionResponse(value: unknown): value is StartSessionResponse {
  return (
    isRecord(value) &&
    isNonEmptyString(value.b_session_id) &&
    Number.isInteger(value.session_number) &&
    (value.session_number as number) > 0 &&
    typeof value.state === 'string' &&
    sessionStates.has(value.state) &&
    typeof value.resume === 'boolean' &&
    (value.current_opportunity_id === null || isNonEmptyString(value.current_opportunity_id)) &&
    isNonEmptyString(value.runtime_bundle_version) &&
    isNonEmptyString(value.expires_at) &&
    !Number.isNaN(Date.parse(value.expires_at)) &&
    isNonEmptyString(value.request_id)
  );
}

export function isPendingStartSessionCommand(value: unknown): value is PendingStartSessionCommand {
  if (!isRecord(value) || !isRecord(value.body)) return false;
  return (
    value.kind === 'start_session' &&
    value.endpoint === '/api/v1/b/sessions' &&
    isNonEmptyString(value.idempotencyKey) &&
    isNonEmptyString(value.createdAt) &&
    isNonEmptyString(value.body.client_timezone) &&
    isNonEmptyString(value.body.mobile_app_version)
  );
}
