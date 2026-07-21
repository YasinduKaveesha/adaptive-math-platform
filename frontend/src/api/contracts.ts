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

export type HealthReadyResponse = {
  status: 'ready';
  request_id?: string;
};

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
