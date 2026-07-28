import type { ReadinessResponse } from '@/src/api/generated/openapi-types';

// BE5 step 5 (session-prep/identity wiring against the live API) has not run yet. The four
// types below describe the fixture-only contract session-preparation-screen.tsx and
// auth-context.tsx currently build against; they are NOT yet matched by the live, frozen
// backend contract (backend/contract/openapi.v1.json). The real shapes today are
// `AuthenticatedPrincipal` (just `user_id`/`email`, no `roles`/`learner`/`request_id`) and
// `SessionCommandResponse` (`session_id`/`state`/`runtime_bundle_version`/`created_at_utc`/
// `row_version`, no request body, no `b_session_id`/`resume`/`expires_at`) — see
// src/api/generated/openapi-types.ts. Reconciling these four types to the live shape is BE5
// step 5 work, tracked separately so it can land together with the screen/flow rewrite it forces.
export type MeResponse = {
  user_id: string;
  roles: ('learner' | 'supervisor' | 'operator')[];
  learner: {
    learner_id: string;
    grade: 2 | 3;
    active: boolean;
    display_name?: string;
  } | null;
  request_id: string;
};

export type ApiFieldIssue = { field: string; code: string };

// The live error envelope is `{ schema_version, error: { code, message, request_id, details } }`
// (app/core/errors.py ErrorResponse/ErrorBody) — nested, and without a `retryable` field.
// FastAPI does not auto-register custom-exception-handler responses in the generated OpenAPI, so
// that true shape has no component schema to freeze/reconcile against yet (BEplan §10 step 10
// needs a shared frozen artefact for both sides to check against). Tracked as a follow-up to add
// explicit `responses=` schema annotations on every route; left unchanged for this batch.
export type ApiErrorEnvelope = {
  code: string;
  message: string;
  request_id: string;
  retryable: boolean;
  details?: ApiFieldIssue[];
};

export type SessionState =
  | 'starting'
  | 'active'
  | 'completing'
  | 'completed'
  | 'abandoned'
  | 'expired'
  | 'technical_failed';

// Matches the live `/health/ready` contract exactly (generated from the frozen OpenAPI).
export type HealthReadyResponse = ReadinessResponse;

export type StartSessionRequest = {
  client_timezone: string;
  mobile_app_version: string;
};

export type StartSessionResponse = {
  b_session_id: string;
  session_number: number;
  state: SessionState;
  resume: boolean;
  current_opportunity_id: string | null;
  runtime_bundle_version: string;
  expires_at: string;
  request_id: string;
};

export type PendingStartSessionCommand = {
  kind: 'start_session';
  endpoint: '/api/v1/b/sessions';
  idempotencyKey: string;
  body: StartSessionRequest;
  createdAt: string;
};
