import { jest } from '@jest/globals';
import type { EntityManager } from '@mikro-orm/postgresql';
import { resolveWindow } from '../../domain/analytics-window';
import {
  TelemetryClickHeatmapRepository,
  type HeatmapScope,
} from './telemetry-click-heatmap.repository';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const TENANT = '11111111-1111-4111-8111-111111111111';
const scope = (over: Partial<HeatmapScope> = {}): HeatmapScope => ({
  tenantId: TENANT,
  route: "/patients/:id'; DROP TABLE x;--",
  window: resolveWindow({
    from: '2026-10-01T00:00:00Z',
    to: '2026-10-08T00:00:00Z',
  }),
  ...over,
});

/**
 * Sin Postgres no se ejecuta el SQL (queda BLOQUEADO para base real). Aquí se
 * fija lo verificable: tenant, ruta, ventana y tamaño viajan como parámetros
 * (jamás en el texto), en el orden en que aparecen los `?`.
 */
describe('TelemetryClickHeatmapRepository (SQL capturado, base doblada)', () => {
  const execute = mockFn(async () => []);
  const repo = new TelemetryClickHeatmapRepository({
    getConnection: () => ({ execute }),
  } as unknown as EntityManager);

  beforeEach(() => execute.mockClear());

  it.each(['totals', 'cells', 'elements', 'sizes'] as const)(
    '%s: la ruta hostil y el tenant no están en el texto y los ? cuadran con los parámetros',
    async (method) => {
      await repo[method](scope({ screenSize: 'movil' }));
      const [sql, params] = execute.mock.calls[0] as [string, unknown[]];
      expect(sql).not.toContain('DROP TABLE');
      expect(sql).not.toContain(TENANT);
      expect(sql).not.toContain('movil');
      expect(sql.match(/\?/g)?.length).toBe(params.length);
      expect(params.slice(0, 3)).toEqual([
        'clic',
        "/patients/:id'; DROP TABLE x;--",
        TENANT,
      ]);
      expect(sql).toMatch(/e\.tenant_id = \?/);
      expect(sql).toMatch(/e\.occurred_at >= \? AND e\.occurred_at < \?/);
    },
  );

  it('el desglose por tamaño no se filtra por tamaño; los demás sí', async () => {
    await repo.sizes(scope({ screenSize: 'movil' }));
    expect(execute.mock.calls[0][1]).not.toContain('movil');
    execute.mockClear();
    await repo.cells(scope({ screenSize: 'movil' }));
    expect(execute.mock.calls[0][1]).toContain('movil');
  });

  it('el portal se añade como parámetro antes que el tamaño', async () => {
    await repo.cells(
      scope({ portalConceptId: 'portal-1', screenSize: 'tableta' }),
    );
    const params = execute.mock.calls[0][1] as unknown[];
    expect(params.slice(-2)).toEqual(['portal-1', 'tableta']);
  });

  it('un clic de teclado nunca entra a las celdas', async () => {
    await repo.cells(scope());
    const sql = execute.mock.calls[0][0] as string;
    expect(sql).toContain('NOT keyboard');
    expect(sql).toContain('FROM positioned');
  });

  it('vacío: totals devuelve ceros, no undefined', async () => {
    await expect(repo.totals(scope())).resolves.toEqual({
      clicks: 0,
      positioned: 0,
      keyboard: 0,
      repeated: 0,
    });
  });
});
