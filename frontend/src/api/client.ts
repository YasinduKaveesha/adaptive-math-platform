import type { ApiErrorEnvelope, AuthenticatedPrincipal, AuthorizedLearner } from '@/src/api/contracts';
import { ApiClientError } from '@/src/api/errors';
import { listLearnerClassrooms } from '@/src/api/learner-onboarding-api';
import { pickMembership } from '@/src/api/membership-selection';
import {
  isApiErrorEnvelope,
  isAuthenticatedPrincipal,
  isLearnerProfileResponse,
} from '@/src/api/runtime-validation';
import type { PublicConfig } from '@/src/config/env';

const REQUEST_TIMEOUT_MS = 10_000;
const SAFE_GET_RETRY_DELAY_MS = 300;

export type RefreshAccessToken = () => Promise<string | null>;

type ApiRequestOptions<T> = {
  accessToken?: string;
  body?: unknown;
  idempotencyKey?: string;
  method: 'GET' | 'POST';
  path: string;
  validate: (value: unknown) => value is T;
};

async function wait(milliseconds: number) {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function mapHttpError(status: number, envelope?: ApiErrorEnvelope) {
  const requestId = envelope?.error.request_id;
  if (status === 401) return new ApiClientError('unauthenticated', 'The session is no longer valid.', status, requestId, envelope);
  if (status === 403) return new ApiClientError('forbidden', 'This account is not approved for learner access.', status, requestId, envelope);
  if (status === 400 || status === 422) return new ApiClientError('invalid-request', 'The request could not be accepted.', status, requestId, envelope);
  if (status === 409 || status === 412) return new ApiClientError('conflict', 'The session state changed.', status, requestId, envelope);
  if (status === 429) return new ApiClientError('rate-limited', 'Please wait before trying again.', status, requestId, envelope);
  if (status === 503) return new ApiClientError('unavailable', 'Learning is temporarily unavailable.', status, requestId, envelope);
  return new ApiClientError('server', 'The server could not complete the request.', status, requestId, envelope);
}

export async function requestJson<T>(
  config: PublicConfig,
  options: ApiRequestOptions<T>,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response: Response;

  try {
    response = await fetch(`${config.apiBaseUrl}${options.path}`, {
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      headers: {
        Accept: 'application/json',
        ...(options.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : {}),
        ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(options.idempotencyKey ? { 'Idempotency-Key': options.idempotencyKey } : {}),
        'X-Mobile-App-Version': '1.0.0',
      },
      method: options.method,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiClientError('timeout', 'The server took too long to respond.');
    }
    throw new ApiClientError('network', 'The server could not be reached.');
  } finally {
    clearTimeout(timeout);
  }

  const headerRequestId = response.headers.get('x-request-id') ?? undefined;
  let body: unknown;
  try {
    body = JSON.parse(await response.text()) as unknown;
  } catch {
    throw new ApiClientError('invalid-response', 'The server returned an unsupported response.', response.status, headerRequestId);
  }

  if (!response.ok) {
    const envelope = isApiErrorEnvelope(body) ? body : undefined;
    const error = mapHttpError(response.status, envelope);
    if (!error.requestId && headerRequestId) {
      throw new ApiClientError(error.kind, error.message, error.status, headerRequestId, error.envelope);
    }
    throw error;
  }

  if (!options.validate(body)) {
    throw new ApiClientError('invalid-response', 'The server returned an unsupported response.', response.status, headerRequestId);
  }
  return body;
}

async function requestMeOnce(config: PublicConfig, accessToken: string) {
  return requestJson(config, {
    accessToken,
    method: 'GET',
    path: '/api/v1/me',
    validate: isAuthenticatedPrincipal,
  });
}

async function requestLearnerProfileOnce(config: PublicConfig, accessToken: string) {
  return requestJson(config, {
    accessToken,
    method: 'GET',
    path: '/api/v1/learner/profile',
    validate: isLearnerProfileResponse,
  });
}

async function fetchPrincipal(
  config: PublicConfig,
  accessToken: string,
  refreshAccessToken: RefreshAccessToken,
): Promise<{ principal: AuthenticatedPrincipal; accessToken: string }> {
  try {
    return { accessToken, principal: await requestMeOnce(config, accessToken) };
  } catch (error) {
    if (!(error instanceof ApiClientError)) throw error;
    if (error.kind === 'unauthenticated') {
      const refreshedAccessToken = await refreshAccessToken();
      if (!refreshedAccessToken) throw error;
      return { accessToken: refreshedAccessToken, principal: await requestMeOnce(config, refreshedAccessToken) };
    }
    if (error.kind === 'network' || error.kind === 'timeout' || (error.kind === 'server' && (error.status ?? 0) >= 500)) {
      await wait(SAFE_GET_RETRY_DELAY_MS);
      return { accessToken, principal: await requestMeOnce(config, accessToken) };
    }
    throw error;
  }
}

async function getLearnerProfileOrNull(config: PublicConfig, accessToken: string) {
  try {
    return await requestLearnerProfileOnce(config, accessToken);
  } catch (error) {
    if (!(error instanceof ApiClientError)) throw error;
    // A clean 404 means "no learner profile yet" -> onboarding. Anything else (network,
    // 5xx, unexpected 4xx) fails closed as unavailable rather than guessing at onboarding.
    if (error.status === 404) return null;
    if (error.kind === 'unauthenticated' || error.kind === 'forbidden') throw error;
    throw new ApiClientError(
      'unavailable',
      'We could not verify the learner profile.',
      error.status,
      error.requestId,
      error.envelope,
    );
  }
}

async function getClassroomMembershipOrNull(config: PublicConfig, accessToken: string) {
  try {
    const response = await listLearnerClassrooms(config, accessToken);
    // An empty list is a legitimate "no membership requested yet" state, not an error.
    return pickMembership(response.memberships);
  } catch (error) {
    if (!(error instanceof ApiClientError)) throw error;
    if (error.kind === 'unauthenticated' || error.kind === 'forbidden') throw error;
    throw new ApiClientError(
      'unavailable',
      'We could not verify the classroom membership.',
      error.status,
      error.requestId,
      error.envelope,
    );
  }
}

export async function getAuthorizedLearner(
  config: PublicConfig,
  accessToken: string,
  refreshAccessToken: RefreshAccessToken,
): Promise<AuthorizedLearner> {
  const { accessToken: verifiedAccessToken, principal } = await fetchPrincipal(
    config,
    accessToken,
    refreshAccessToken,
  );

  const learnerProfile = await getLearnerProfileOrNull(config, verifiedAccessToken);
  if (!learnerProfile) return { classroomMembership: null, learnerProfile: null, principal };

  const classroomMembership = await getClassroomMembershipOrNull(config, verifiedAccessToken);
  return { classroomMembership, learnerProfile, principal };
}
