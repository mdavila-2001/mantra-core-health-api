import { jest } from '@jest/globals';
import { JwtService } from '@nestjs/jwt';
import { TelemetryClientErrorsService } from './telemetry-client-errors.service';
import { ERROR_CLASS_CONCEPT_BY_CODE, TELE } from '../../telemetry.concepts';

const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;
const SECRET = 'prueba-secreto-largo-1234567890';
process.env.JWT_SECRET = SECRET;
// Módulo registrado con OTRO secreto (como en producción: se registra antes de cargar el entorno).
const jwt = new JwtService({ secret: 'secreto-del-modulo-distinto-0000' });
const signer = new JwtService({ secret: SECRET });

function build(session: 'ok' | 'inactive' = 'ok') {
  const repo = {
    insertMany: fn(async () => undefined),
    sessionIdOf: fn(async () => 'session-row-1'),
  };
  const sessions = {
    assertActive: fn(async () => {
      if (session === 'inactive') throw new Error('inactiva');
    }),
  };
  const logger = { setContext: fn(), info: fn() };
  const service = new TelemetryClientErrorsService(
    repo as never,
    jwt,
    sessions as never,
    logger as never,
  );
  return { service, repo, sessions };
}
const item = (over: Record<string, unknown> = {}) => ({
  errorClass: 'JS' as const,
  errorType: 'TypeError',
  message: 'boom para ana@x.bo',
  routeTemplate: '/agenda/:citaId',
  appVersion: '1.2.3',
  ...over,
});
const token = (payload: Record<string, unknown> = {}) =>
  signer.sign(
    {
      sub: 'user-1',
      sid: 'sid-1',
      typ: 'access',
      roles: [],
      tenants: ['t1'],
      ...payload,
    },
    { expiresIn: '5m' },
  );

describe('TelemetryClientErrorsService.ingest', () => {
  it('sin token: inserta sin user_id, sesión ni tenant, con el mensaje saneado y la huella del servidor', async () => {
    const { service, repo } = build();
    const res = await service.ingest(
      { errors: [item({ fingerprint: 'elegida-por-el-cliente' })] } as never,
      { headers: {} },
    );
    expect(res).toEqual({ inserted: 1, rejected: 0 });
    const [rows] = repo.insertMany.mock.calls[0] as [any[]];
    expect(rows[0]).toMatchObject({
      userId: null,
      sessionId: null,
      actorTenantId: null,
      sanitizedMessage: 'boom para [correo]',
      routeTemplate: '/agenda/:citaId',
      portalTypeConceptId: TELE.PORTAL_WEB,
      errorClassConceptId: ERROR_CLASS_CONCEPT_BY_CODE.JS,
    });
    expect(rows[0].fingerprint).toMatch(/^[0-9a-f]{16}$/);
    expect(rows[0].fingerprint).not.toBe('elegida-por-el-cliente');
  });

  it('con token válido y sesión activa: user_id, sesión y tenant (único) salen del token', async () => {
    const { service, repo } = build();
    await service.ingest({ errors: [item()] } as never, {
      headers: { authorization: `Bearer ${token()}` },
    });
    expect((repo.insertMany.mock.calls[0] as any)[0][0]).toMatchObject({
      userId: 'user-1',
      sessionId: 'session-row-1',
      actorTenantId: 't1',
    });
  });

  it('X-Tenant-Id sólo cuenta si es una membresía del token; si no, queda sin tenant', async () => {
    const { service, repo } = build();
    const bearer = `Bearer ${token({ tenants: ['t1', 't2'] })}`;
    await service.ingest({ errors: [item()] } as never, {
      headers: { authorization: bearer, 'x-tenant-id': 't2' },
    });
    await service.ingest({ errors: [item()] } as never, {
      headers: { authorization: bearer, 'x-tenant-id': 'ajeno' },
    });
    await service.ingest({ errors: [item()] } as never, {
      headers: { authorization: bearer },
    });
    const tenants = repo.insertMany.mock.calls.map(
      (c: any) => c[0][0].actorTenantId,
    );
    expect(tenants).toEqual(['t2', null, null]);
  });

  it.each([
    ['token manipulado', () => `Bearer ${token()}x`],
    ['token de refresco', () => `Bearer ${token({ typ: 'refresh' })}`],
    [
      'firmado con otro secreto',
      () =>
        `Bearer ${new JwtService({ secret: 'otro-secreto-largo-xxxxxxxxxx' }).sign({ sub: 'u', typ: 'access' })}`,
    ],
    ['cabecera sin Bearer', () => token()],
  ])('%s → se guarda como anónimo, nunca falla', async (_n, header) => {
    const { service, repo } = build();
    await service.ingest({ errors: [item()] } as never, {
      headers: { authorization: header() },
    });
    expect((repo.insertMany.mock.calls[0] as any)[0][0]).toMatchObject({
      userId: null,
      sessionId: null,
      actorTenantId: null,
    });
  });

  it('sesión inactiva → anónimo', async () => {
    const { service, repo } = build('inactive');
    await service.ingest({ errors: [item()] } as never, {
      headers: { authorization: `Bearer ${token()}` },
    });
    expect((repo.insertMany.mock.calls[0] as any)[0][0].userId).toBeNull();
  });

  it('descarta (rejected) lo que no trae una versión de app reconocible', async () => {
    const { service, repo } = build();
    const res = await service.ingest(
      {
        errors: [
          item({ appVersion: 'con espacios' }),
          item({ appVersion: '2.0.0+abc' }),
          item({ appVersion: '   ' }),
        ],
      } as never,
      { headers: {} },
    );
    expect(res).toEqual({ inserted: 1, rejected: 2 });
    expect((repo.insertMany.mock.calls[0] as any)[0]).toHaveLength(1);
  });

  it('una ruta con un dato personal se guarda sin ruta; el error no se pierde', async () => {
    const { service, repo } = build();
    await service.ingest(
      {
        errors: [item({ routeTemplate: '/pacientes/ana.perez@x.bo' })],
      } as never,
      { headers: {} },
    );
    expect(
      (repo.insertMany.mock.calls[0] as any)[0][0].routeTemplate,
    ).toBeNull();
  });

  it('un reloj del cliente a más de 7 días no manda el error a otra ventana', async () => {
    const { service, repo } = build();
    await service.ingest(
      { errors: [item({ occurredAt: '2001-01-01T00:00:00Z' })] } as never,
      { headers: {} },
    );
    const row = (repo.insertMany.mock.calls[0] as any)[0][0];
    expect(row.occurredAt.getTime()).toBe(row.receivedAt.getTime());
  });

  it('request_id con caracteres raros se descarta; uno limpio se conserva (enlace con observability)', async () => {
    const { service, repo } = build();
    await service.ingest(
      {
        errors: [
          item({ requestId: 'a b;c' }),
          item({ requestId: 'req-9f2.a' }),
        ],
      } as never,
      { headers: {} },
    );
    const rows = (repo.insertMany.mock.calls[0] as any)[0];
    expect(rows.map((r: any) => r.requestId)).toEqual([null, 'req-9f2.a']);
  });
});
