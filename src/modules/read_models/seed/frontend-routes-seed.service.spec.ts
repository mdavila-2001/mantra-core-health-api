import { jest } from '@jest/globals';
// Alias con tipado laxo: evita el 'never' que @jest/globals infiere para jest.fn() en ESM.
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;
import { CONCEPTS } from '../../../common/constants/concepts';
import { FrontendRoutes, PortalSurfaces } from '../entities';
import { RM } from '../read_models.concepts';
import bundled from './partes.seed.json';
import {
  FrontendRoutesSeedService,
  validateParts,
  type PartSeedEntry,
} from './frontend-routes-seed.service';

/** `EntityManager` doblado con estado: lo creado lo encuentran las lecturas siguientes. */
function build() {
  const surfaces: Record<string, any>[] = [];
  const routes: Record<string, any>[] = [];
  const em = {
    findOne: fn(
      async (_e: unknown, where: { portalCode: string }) =>
        surfaces.find((s) => s.portalCode === where.portalCode) ?? null,
    ),
    find: fn(async (_e: unknown, where: { portalSurfaceId: string }) =>
      routes.filter((r) => r.portalSurfaceId === where.portalSurfaceId),
    ),
    create: fn((entity: unknown, data: Record<string, any>) => {
      (entity === PortalSurfaces ? surfaces : routes).push(data);
      expect([PortalSurfaces, FrontendRoutes]).toContain(entity);
      return data;
    }),
    flush: fn(async () => undefined),
  };
  const logger = { setContext: fn(), info: fn(), warn: fn() };
  const service = new FrontendRoutesSeedService(
    { em: { fork: () => em } } as never,
    logger as never,
  );
  return { service, surfaces, routes };
}

const parts = bundled as PartSeedEntry[];

describe('FrontendRoutesSeedService (H2.S1.M2)', () => {
  it('el fixture trae al menos 30 rutas reales, las cuatro superficies y códigos únicos', () => {
    expect(parts.length).toBeGreaterThanOrEqual(30);
    expect(new Set(parts.map((p) => p.portal))).toEqual(
      new Set(['WEB', 'MOBILE', 'WEB_PUBLICO', 'INSIGHTS']),
    );
    expect(() => validateParts(parts)).not.toThrow();
    expect(
      parts.find((p) => p.routePattern === '/administration/web-analytics'),
    ).toMatchObject({ group: 'Administración', module: 'M28 telemetry' });
  });

  it('1.ª corrida inserta todo; 2.ª corrida = 0 inserciones y 0 cambios', async () => {
    const { service, surfaces, routes } = build();
    const first = await service.run();
    expect(first).toEqual({
      surfaces: 4,
      routes: parts.length,
      updated: 0,
      deprecated: 0,
    });
    expect(surfaces).toHaveLength(4);
    expect(routes).toHaveLength(parts.length);
    expect(
      routes.every((r) => r.statusConceptId === CONCEPTS.STATE_ACTIVE),
    ).toBe(true);
    const second = await service.run();
    expect(second).toEqual({
      surfaces: 0,
      routes: 0,
      updated: 0,
      deprecated: 0,
    });
    expect(routes).toHaveLength(parts.length);
  });

  it('un cambio de título actualiza una sola fila; una ruta ausente pasa a DEPRECATED y vuelve a ACTIVE si reaparece', async () => {
    const { service, routes } = build();
    await service.run();
    const changed = parts.map((p, i) =>
      i === 0 ? { ...p, pageTitle: `${p.pageTitle} (nuevo)` } : p,
    );
    const dropped = changed.slice(0, -1);
    expect(await service.run(dropped)).toEqual({
      surfaces: 0,
      routes: 0,
      updated: 1,
      deprecated: 1,
    });
    expect(
      routes.filter((r) => r.statusConceptId === RM.ROUTE_DEPRECATED),
    ).toHaveLength(1);
    expect(await service.run(dropped)).toEqual({
      surfaces: 0,
      routes: 0,
      updated: 0,
      deprecated: 0,
    });
    expect(await service.run(changed)).toEqual({
      surfaces: 0,
      routes: 0,
      updated: 1,
      deprecated: 0,
    });
  });

  it('rechaza un archivo con códigos duplicados o patrones sin barra, sin sembrar nada', async () => {
    const { service, routes } = build();
    expect(() => validateParts([parts[0], parts[0]])).toThrow(/duplicado/);
    await expect(
      service.run([{ ...parts[0], routePattern: 'sin-barra' }]),
    ).rejects.toThrow(/empezar con/);
    await expect(
      service.run([{ ...parts[0], portal: 'X' as never }]),
    ).rejects.toThrow(/portal desconocido/);
    expect(routes).toHaveLength(0);
  });
});
