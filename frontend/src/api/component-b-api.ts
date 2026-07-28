import type { HealthReadyResponse, StartSessionRequest, StartSessionResponse } from '@/src/api/contracts';
import { requestJson } from '@/src/api/client';
import { ApiClientError } from '@/src/api/errors';
import { isHealthReadyResponse, isStartSessionResponse } from '@/src/api/runtime-validation';
import type { PublicConfig } from '@/src/config/env';

type ComponentBApi = {
  checkReadiness: () => Promise<HealthReadyResponse>;
  startSession: (request: StartSessionRequest, idempotencyKey: string, accessToken: string) => Promise<StartSessionResponse>;
};

const fixtureFailures = new Set<string>();

function getDevelopmentFixture(): string | null {
  if (process.env.EXPO_PUBLIC_APP_ENV !== 'development') return null;
  const fixture = process.env.EXPO_PUBLIC_COMPONENT_B_DEV_FIXTURE?.trim();
  return fixture || null;
}

async function fixtureDelay() {
  await new Promise((resolve) => setTimeout(resolve, 650));
}

function createFixtureApi(fixture: string): ComponentBApi {
  return {
    async checkReadiness() {
      await fixtureDelay();
      if (fixture === 'readiness-failure') {
        throw new ApiClientError('unavailable', 'Development readiness fixture is unavailable.', 503, 'dev-ready-503');
      }
      return {
        status: 'ready',
        stage: 'infrastructure',
        request_id: 'dev-ready-ok',
        checks: {
          api_process: 'ok',
          database_connection: 'ok',
          generator: 'not_checked',
          catalogue: 'not_checked',
          runtime_bundle: 'not_checked',
          migrations: 'not_checked',
          authentication: 'not_checked',
        },
      };
    },
    async startSession(_request, idempotencyKey) {
      await fixtureDelay();
      if (fixture === 'network-failure-once' && !fixtureFailures.has(idempotencyKey)) {
        fixtureFailures.add(idempotencyKey);
        throw new ApiClientError('network', 'Development fixture dropped the response.');
      }
      if (fixture === 'access-denied') {
        throw new ApiClientError('forbidden', 'Development access fixture denied the request.', 403, 'dev-forbidden');
      }
      const resume = fixture === 'resume';
      return {
        b_session_id: resume ? 'dev-session-resume-opaque' : 'dev-session-new-opaque',
        current_opportunity_id: resume ? 'dev-opportunity-opaque' : null,
        expires_at: '2026-07-22T12:00:00Z',
        request_id: resume ? 'dev-resume-ok' : 'dev-start-ok',
        resume,
        runtime_bundle_version: 'development-fixture-only',
        session_number: resume ? 4 : 1,
        state: fixture === 'starting-response' ? 'starting' : 'active',
      };
    },
  };
}

export function createComponentBApi(config?: PublicConfig): ComponentBApi {
  const fixture = getDevelopmentFixture();
  if (fixture) return createFixtureApi(fixture);
  if (!config) {
    throw new ApiClientError('unavailable', 'The Component B API is not configured.');
  }

  return {
    checkReadiness: () => requestJson(config, { method: 'GET', path: '/health/ready', validate: isHealthReadyResponse }),
    // Not yet BE5-step-5 wired: the live POST /api/v1/b/sessions takes no request body and
    // returns SessionCommandResponse, not this fixture-shaped StartSessionResponse — see the
    // note on StartSessionResponse in contracts.ts.
    startSession: (body, idempotencyKey, accessToken) =>
      requestJson(config, {
        accessToken,
        body,
        idempotencyKey,
        method: 'POST',
        path: '/api/v1/b/sessions',
        validate: isStartSessionResponse,
      }),
  };
}

export function getComponentBDevelopmentFixture() {
  return getDevelopmentFixture();
}
