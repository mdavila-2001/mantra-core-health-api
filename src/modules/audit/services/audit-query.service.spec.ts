import { jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { CONCEPTS } from '../../../common/constants/concepts';
import { encodeKeysetCursor } from '../../../common/pagination/keyset-cursor';
import type {
  RouteMetadataService,
  RouteSecurity,
} from '../../../observability/route-index/route-metadata.service';
import { AUD } from '../audit.concepts';
import type { AuditQueryRepository } from '../repositories/audit-query.repository';
import { AuditQueryService } from './audit-query.service';

// Fábrica de mocks con tipos sueltos: el contrato que se prueba es el del servicio, no el de jest.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const AHORA = new Date('2026-10-24T12:00:00.000Z');
const USUARIO = '00000000-0000-4000-8000-000000000001';

const ruta = (
  method: string,
  template: string,
  auditedAction: string | null,
): RouteSecurity => ({
  method,
  template,
  controller: 'C',
  handler: 'h',
  roles: null,
  isPublic: false,
  auditedAction,
  notAudited: false,
});

const RUTAS = [
  ruta(
    'PUT',
    '/admin/catalog/objects/:id/annotation',
    'CATALOG_ANNOTATION_SAVED',
  ),
  ruta(
    'PUT',
    '/admin/catalog/columns/:id/annotation',
    'CATALOG_ANNOTATION_SAVED',
  ),
  ruta(
    'POST',
    '/admin/catalog/annotations/:id/review',
    'CATALOG_ANNOTATION_REVIEWED',
  ),
  ruta('POST', '/audit/events', null),
];

function armar() {
  const repo: Record<string, any> = {
    auditLog: mockFn(async () => []),
    dataAccess: mockFn(async () => []),
  };
  const mapa = new Map<string, RouteSecurity[]>();
  for (const r of RUTAS)
    if (r.auditedAction)
      mapa.set(r.auditedAction, [...(mapa.get(r.auditedAction) ?? []), r]);
  const routes = { routesByAuditedAction: () => mapa };
  const em = { fork: () => em };
  const service = new AuditQueryService(
    em as never,
    repo as unknown as AuditQueryRepository,
    routes as unknown as RouteMetadataService,
  );
  return { service, repo };
}

const fila = (extra: Record<string, unknown> = {}) => ({
  id: 'a1',
  user_id: USUARIO,
  tenant_id: null,
  action: 'HTTP POST /audit/events',
  entity: 'audit',
  entity_id: null,
  outcome_concept_id: CONCEPTS.OUTCOME_SUCCESS,
  ip: '10.0.0.1',
  recorded_at: '2026-10-24T11:00:00.000000Z',
  ...extra,
});

describe('AuditQueryService.log', () => {
  it('sin rango mira los últimos 30 días', async () => {
    const { service, repo } = armar();
    await service.log({}, AHORA);
    const filtro = repo.auditLog.mock.calls[0][1];
    expect(filtro.from.toISOString()).toBe('2026-09-24T12:00:00.000Z');
    expect(filtro.to).toBeUndefined();
    expect(filtro.matcher).toBeUndefined();
  });

  it('traduce el resultado a su concepto y pasa actor, tenant, acción y entidad', async () => {
    const { service, repo } = armar();
    await service.log(
      {
        result: 'FAILURE',
        userId: USUARIO,
        tenantId: 't-1',
        action: 'X_DONE',
        entity: 'x',
        from: '2026-10-01T00:00:00.000Z',
        to: '2026-10-02T00:00:00.000Z',
      },
      AHORA,
    );
    expect(repo.auditLog.mock.calls[0][1]).toMatchObject({
      outcomeConceptId: CONCEPTS.OUTCOME_FAILURE,
      userId: USUARIO,
      tenantId: 't-1',
      action: 'X_DONE',
      entity: 'x',
    });
  });

  it('un rango invertido es un error del cliente', async () => {
    const { service } = armar();
    await expect(
      service.log(
        { from: '2026-10-02T00:00:00.000Z', to: '2026-10-01T00:00:00.000Z' },
        AHORA,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('deriva verbo y ruta de una acción HTTP', async () => {
    const { service, repo } = armar();
    repo.auditLog.mockResolvedValueOnce([fila()]);
    const r = await service.log({}, AHORA);
    expect(r.items[0]).toMatchObject({
      method: 'POST',
      route: '/audit/events',
      result: 'SUCCESS',
      healthRisk: 'LOW',
    });
  });

  it('deriva verbo y ruta de una acción de negocio con el mapa de rutas', async () => {
    const { service, repo } = armar();
    repo.auditLog.mockResolvedValueOnce([
      fila({
        action: 'CATALOG_ANNOTATION_REVIEWED',
        entity: 'catalog_annotation',
      }),
    ]);
    const r = await service.log({}, AHORA);
    expect(r.items[0]).toMatchObject({
      method: 'POST',
      route: '/admin/catalog/annotations/:id/review',
    });
  });

  it('si una acción sella varias rutas, informa el verbo y deja la ruta en null', () => {
    const { service } = armar();
    expect(service.routeOfAction('CATALOG_ANNOTATION_SAVED')).toEqual({
      method: 'PUT',
      route: null,
    });
  });

  it('una acción que ningún mapa conoce no inventa ruta', async () => {
    const { service, repo } = armar();
    repo.auditLog.mockResolvedValueOnce([
      fila({ action: 'LEGACY_THING_DONE' }),
    ]);
    const r = await service.log({}, AHORA);
    expect(r.items[0]).toMatchObject({ method: null, route: null });
  });

  it('un resultado desconocido no se disfraza de éxito', async () => {
    const { service, repo } = armar();
    repo.auditLog.mockResolvedValueOnce([fila({ outcome_concept_id: 'otro' })]);
    expect((await service.log({}, AHORA)).items[0].result).toBe('UNKNOWN');
  });

  describe('filtro por verbo y ruta', () => {
    it('por verbo: prefijo de las derivadas y las de negocio de ese verbo', async () => {
      const { service, repo } = armar();
      await service.log({ method: 'PUT' }, AHORA);
      expect(repo.auditLog.mock.calls[0][1].matcher).toEqual({
        exact: ['CATALOG_ANNOTATION_SAVED'],
        prefixes: ['HTTP PUT '],
      });
    });

    it('por ruta: la acción derivada exacta de cada verbo y las de negocio de esa ruta', async () => {
      const { service, repo } = armar();
      await service.log(
        { route: '/admin/catalog/annotations/:id/review' },
        AHORA,
      );
      const { exact, prefixes } = repo.auditLog.mock.calls[0][1].matcher;
      expect(prefixes).toEqual([]);
      expect(exact).toContain(
        'HTTP POST /admin/catalog/annotations/:id/review',
      );
      expect(exact).toContain('CATALOG_ANNOTATION_REVIEWED');
      expect(exact).not.toContain('CATALOG_ANNOTATION_SAVED');
    });

    it('verbo y ruta juntos acotan ambos', async () => {
      const { service, repo } = armar();
      await service.log(
        { route: '/admin/catalog/annotations/:id/review', method: 'PUT' },
        AHORA,
      );
      const { exact } = repo.auditLog.mock.calls[0][1].matcher;
      expect(exact).toEqual(['HTTP PUT /admin/catalog/annotations/:id/review']);
    });
  });

  describe('paginación', () => {
    it('pide un elemento de más y emite cursor si hay otra página', async () => {
      const { service, repo } = armar();
      repo.auditLog.mockResolvedValueOnce([
        fila({ id: 'a3' }),
        fila({ id: 'a2' }),
        fila({ id: 'a1' }),
      ]);
      const r = await service.log({ limit: 2 }, AHORA);
      expect(repo.auditLog.mock.calls[0][1].limit).toBe(2);
      expect(r.items.map((i) => i.id)).toEqual(['a3', 'a2']);
      expect(r.nextCursor).toBe(
        encodeKeysetCursor({ t: '2026-10-24T11:00:00.000000Z', i: 'a2' }),
      );
    });

    it('sin otra página no hay cursor', async () => {
      const { service, repo } = armar();
      repo.auditLog.mockResolvedValueOnce([fila()]);
      expect((await service.log({ limit: 2 }, AHORA)).nextCursor).toBeNull();
    });

    it('un cursor ajeno es un error del cliente', async () => {
      const { service } = armar();
      await expect(
        service.log({ cursor: encodeKeysetCursor({ x: 1 }) }, AHORA),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('el cursor llega al repositorio como (fecha, id)', async () => {
      const { service, repo } = armar();
      await service.log(
        {
          cursor: encodeKeysetCursor({
            t: '2026-10-24T10:00:00.000000Z',
            i: 'a9',
          }),
        },
        AHORA,
      );
      expect(repo.auditLog.mock.calls[0][1].cursor).toEqual({
        t: '2026-10-24T10:00:00.000000Z',
        i: 'a9',
      });
    });
  });
});

describe('AuditQueryService.dataAccess', () => {
  const acceso = (extra: Record<string, unknown> = {}) => ({
    id: 'd1',
    user_id: USUARIO,
    tenant_id: null,
    patient_profile_id: 'p-1',
    action_concept_id: AUD.ACTION_READ,
    resource_type: 'PATIENT_PROFILE',
    resource_id: null,
    purpose: 'TREATMENT',
    recorded_at: '2026-10-24T11:00:00.000000Z',
    ...extra,
  });

  it('traduce la operación a su concepto y filtra por paciente y recurso', async () => {
    const { service, repo } = armar();
    await service.dataAccess(
      { operation: 'EXPORT', patientProfileId: 'p-1', resourceType: 'X' },
      AHORA,
    );
    expect(repo.dataAccess.mock.calls[0][1]).toMatchObject({
      actionConceptId: AUD.ACTION_EXPORT,
      patientProfileId: 'p-1',
      resourceType: 'X',
    });
  });

  it('una lectura de un paciente es MEDIUM y una exportación, CRITICAL', async () => {
    const { service, repo } = armar();
    repo.dataAccess.mockResolvedValueOnce([
      acceso(),
      acceso({ id: 'd2', action_concept_id: AUD.ACTION_EXPORT }),
    ]);
    const r = await service.dataAccess({}, AHORA);
    expect(r.items.map((i) => [i.operation, i.healthRisk])).toEqual([
      ['READ', 'MEDIUM'],
      ['EXPORT', 'CRITICAL'],
    ]);
  });

  it('leer la bitácora (sin paciente) es LOW', async () => {
    const { service, repo } = armar();
    repo.dataAccess.mockResolvedValueOnce([
      acceso({
        patient_profile_id: null,
        resource_type: 'AUDIT_LOG',
        purpose: 'SECURITY_OVERSIGHT',
      }),
    ]);
    expect((await service.dataAccess({}, AHORA)).items[0].healthRisk).toBe(
      'LOW',
    );
  });
});
