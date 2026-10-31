import { jest } from '@jest/globals';
import { TelemetryErrorsAnalyticsService } from './telemetry-errors-analytics.service';
import { canSeeCorrelation } from '../../presentation/controllers/telemetry-errors-analytics.controller';

const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;
const Q = { from: '2026-10-01T00:00:00Z', to: '2026-10-08T00:00:00Z' };
const ACTOR = { tenantId: 't1', platform: false } as const;

function build() {
  const repo = {
    partsRegistry: fn(async () => []),
    totals: fn(async () => ({ events: 2, suppressed: 0, fingerprints: 1, sessions: 1, users: 1, anonymous: 0 })),
    byRoute: fn(async () => []),
    byClass: fn(async () => []),
    byHttpStatus: fn(async () => []),
    byApiRoute: fn(async () => [{ method: 'GET', route: '/x', errors: 2, last_request_id: 'req-SECRETO-1' }]),
    series: fn(async () => []),
    s9Shown: fn(async () => 0),
    fingerprints: fn(async () => [{ fingerprint: 'fp1', error_type: 'E', class_concept_id: 'c', sanitized_message: 'm', count: 2, first_seen: new Date(), last_seen: new Date(), last_request_id: 'req-SECRETO-2', versions: ['1'], users: 1 }]),
    countsFor: fn(async () => new Map()),
    routesOfFingerprints: fn(async () => []),
    versions: fn(async () => []),
    byHttp: fn(async () => []),
    recentRequestIds: fn(async () => [{ request_id: 'req-SECRETO-3', received_at: new Date(), http_status: 500 }]),
  };
  const parts = { usageByRoute: fn(async () => []) };
  return new TelemetryErrorsAnalyticsService(repo as never, parts as never);
}

describe('request_id sólo para roles RAW (paridad de las tres rutas)', () => {
  it('canSeeCorrelation: RAW y SUPERADMIN sí; marketing y otros no', () => {
    for (const role of ['PLATFORM_ADMIN', 'SECURITY_ADMIN', 'DPO', 'SUPERADMIN']) {
      expect(canSeeCorrelation({ roles: [role] } as never)).toBe(true);
    }
    for (const role of ['MARKETING_MANAGER', 'DATA_PLATFORM_ADMIN', 'USER']) {
      expect(canSeeCorrelation({ roles: [role] } as never)).toBe(false);
    }
  });

  it('sin rol RAW: errors, fingerprints y fingerprint/:fp devuelven null en todo request_id', async () => {
    const svc = build();
    const a = JSON.stringify(await svc.errors(Q, ACTOR, false));
    const b = JSON.stringify(await svc.fingerprints(Q, ACTOR, false));
    const c = JSON.stringify(await svc.fingerprint('fp1', Q, ACTOR, false));
    for (const body of [a, b, c]) expect(body).not.toMatch(/SECRETO/);
    expect(JSON.parse(a).byApiRoute[0].lastRequestId).toBeNull();
    expect(JSON.parse(b).fingerprints[0].lastRequestId).toBeNull();
    expect(JSON.parse(c).recentRequestIds).toBeNull();
  });

  it('con rol RAW: las tres rutas los muestran', async () => {
    const svc = build();
    expect((await svc.errors(Q, ACTOR, true)).byApiRoute[0].lastRequestId).toBe('req-SECRETO-1');
    expect((await svc.fingerprints(Q, ACTOR, true)).fingerprints[0].lastRequestId).toBe('req-SECRETO-2');
    expect((await svc.fingerprint('fp1', Q, ACTOR, true)).recentRequestIds?.[0].requestId).toBe('req-SECRETO-3');
  });
});
