import { runWithTenant } from '../../../common';
import {
  DEFAULT_PLATFORM_MIN_SAMPLE,
  platformMinSampleFloor,
  previousWindow,
  resolveAnalyticsScope,
  windowOrThrow,
} from './analytics-scope';

const user = (roles: string[], extra: Record<string, unknown> = {}) =>
  ({ id: 'u', roles, tenantIds: [], ...extra }) as never;
const ROUTE_ROLES = [
  'PLATFORM_ADMIN',
  'SECURITY_ADMIN',
  'DATA_PLATFORM_ADMIN',
  'MARKETING_MANAGER',
  'DPO',
];

describe('resolveAnalyticsScope (X-5, autorización negativa)', () => {
  it('con tenant en el contexto: alcance de organización, sin minSample', () => {
    const scope = runWithTenant('t1', () =>
      resolveAnalyticsScope(user(['SECURITY_ADMIN']), ROUTE_ROLES),
    );
    expect(scope).toEqual({ tenantId: 't1', platform: false });
  });

  it.each(['PLATFORM_ADMIN', 'DATA_PLATFORM_ADMIN', 'SUPERADMIN'])(
    '%s global sin tenant: alcance plataforma con el piso de minSample',
    (role) => {
      expect(resolveAnalyticsScope(user([role]), ROUTE_ROLES)).toEqual({
        platform: true,
        minSample: DEFAULT_PLATFORM_MIN_SAMPLE,
      });
    },
  );

  it.each(['SECURITY_ADMIN', 'MARKETING_MANAGER', 'DPO', 'USER'])(
    '%s sin tenant NO obtiene alcance plataforma: 412 TENANT_REQUIRED',
    (role) => {
      expect(() => resolveAnalyticsScope(user([role]), ROUTE_ROLES)).toThrow(
        expect.objectContaining({ details: { reason: 'TENANT_REQUIRED' } }),
      );
    },
  );

  it('sin usuario: 412, nunca plataforma', () => {
    expect(() => resolveAnalyticsScope(undefined, ROUTE_ROLES)).toThrow(
      expect.objectContaining({ details: { reason: 'TENANT_REQUIRED' } }),
    );
  });

  it('un PLATFORM_ADMIN sólo acotado a un tenant (scopedRoles) no es de plataforma', () => {
    const scoped = user(['PLATFORM_ADMIN'], {
      scopedRoles: { t1: ['PLATFORM_ADMIN'] },
    });
    expect(() => resolveAnalyticsScope(scoped, ROUTE_ROLES)).toThrow(
      expect.objectContaining({ details: { reason: 'TENANT_REQUIRED' } }),
    );
  });

  it('un rol de plataforma que la ruta no acepta no abre el alcance plataforma', () => {
    expect(() =>
      resolveAnalyticsScope(user(['GOVERNANCE_ADMIN']), ROUTE_ROLES),
    ).toThrow(
      expect.objectContaining({ details: { reason: 'TENANT_REQUIRED' } }),
    );
  });

  it('minSample de la consulta sólo sube el umbral', () => {
    expect(
      resolveAnalyticsScope(user(['PLATFORM_ADMIN']), ROUTE_ROLES, 1),
    ).toMatchObject({ minSample: 5 });
    expect(
      resolveAnalyticsScope(user(['PLATFORM_ADMIN']), ROUTE_ROLES, 12),
    ).toMatchObject({ minSample: 12 });
    expect(
      resolveAnalyticsScope(user(['PLATFORM_ADMIN']), ROUTE_ROLES, 99999),
    ).toMatchObject({ minSample: 1000 });
  });

  it('TELEMETRY_PLATFORM_MIN_SAMPLE fija el piso (entero ≥ 1); un valor roto vuelve a 5', () => {
    expect(
      platformMinSampleFloor({ TELEMETRY_PLATFORM_MIN_SAMPLE: '1' } as never),
    ).toBe(1);
    expect(
      platformMinSampleFloor({ TELEMETRY_PLATFORM_MIN_SAMPLE: '0' } as never),
    ).toBe(5);
    expect(
      platformMinSampleFloor({ TELEMETRY_PLATFORM_MIN_SAMPLE: 'x' } as never),
    ).toBe(5);
    expect(platformMinSampleFloor({} as never)).toBe(5);
  });
});

describe('ventanas', () => {
  it('la ventana anterior tiene la misma duración y termina donde empieza la actual', () => {
    const w = windowOrThrow({
      from: '2026-10-08T00:00:00Z',
      to: '2026-10-10T00:00:00Z',
    });
    const p = previousWindow(w);
    expect(p.to.toISOString()).toBe('2026-10-08T00:00:00.000Z');
    expect(p.from.toISOString()).toBe('2026-10-06T00:00:00.000Z');
  });
  it('ventana vacía → 422 con reason', () => {
    expect(() =>
      windowOrThrow({
        from: '2026-10-10T00:00:00Z',
        to: '2026-10-08T00:00:00Z',
      }),
    ).toThrow(expect.objectContaining({ details: { reason: 'EMPTY_WINDOW' } }));
  });
});
