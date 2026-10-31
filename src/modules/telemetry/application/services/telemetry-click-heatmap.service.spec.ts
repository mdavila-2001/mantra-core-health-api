import { jest } from '@jest/globals';
import { TELE } from '../../telemetry.concepts';
import type { TelemetryClickHeatmapRepository } from '../../infrastructure/repositories/telemetry-click-heatmap.repository';
import { TelemetryClickHeatmapService } from './telemetry-click-heatmap.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const TENANT = '11111111-1111-4111-8111-111111111111';
const Q = {
  route: '/home',
  from: '2026-10-01T00:00:00Z',
  to: '2026-10-08T00:00:00Z',
};

/** Doble declarado del repositorio (sin Postgres). */
function build(
  over: Partial<
    Record<'totals' | 'cells' | 'elements' | 'sizes', unknown>
  > = {},
) {
  const repo = {
    totals: mockFn(
      async () =>
        over.totals ?? { clicks: 0, positioned: 0, keyboard: 0, repeated: 0 },
    ),
    cells: mockFn(async () => over.cells ?? []),
    elements: mockFn(async () => over.elements ?? []),
    sizes: mockFn(async () => over.sizes ?? []),
    scroll: mockFn(async () => ({ pages: 0, measured: 0, subjects: 0, reached: Array(10).fill(0) })),
    views: mockFn(async () => 0),
  };
  return {
    repo,
    service: new TelemetryClickHeatmapService(
      repo as unknown as TelemetryClickHeatmapRepository,
    ),
  };
}

describe('TelemetryClickHeatmapService (repositorio doblado)', () => {
  it('el centro de cada celda y su proporción salen en 0–1 con 4 decimales', async () => {
    const { service } = build({
      totals: { clicks: 3, positioned: 3, keyboard: 0, repeated: 0 },
      cells: [
        { col: 7, row: 12, clicks: 1 },
        { col: 8, row: 12, clicks: 2 },
      ],
    });
    const res = await service.heatmap(Q, TENANT);
    expect(res.cells).toEqual([
      { column: 7, row: 12, x: 0.375, y: 0.625, clicks: 1, rage: 0, dead: 0, value: 1, share: 0.3333 },
      { column: 8, row: 12, x: 0.425, y: 0.625, clicks: 2, rage: 0, dead: 0, value: 2, share: 0.6667 },
    ]);
  });

  it('con 0 clics posicionados share es null, no 0 ni NaN', async () => {
    const { service } = build({
      totals: { clicks: 2, positioned: 0, keyboard: 2, repeated: 0 },
      cells: [{ col: 0, row: 0, clicks: 1 }],
    });
    const res = await service.heatmap(Q, TENANT);
    expect(res.cells[0].share).toBeNull();
    expect(res.totals.withoutPosition).toBe(0);
  });

  it('withoutPosition nunca es negativo aunque los conteos del repositorio no cuadren', async () => {
    const { service } = build({
      totals: { clicks: 1, positioned: 1, keyboard: 1, repeated: 0 },
    });
    const res = await service.heatmap(Q, TENANT);
    expect(res.totals.withoutPosition).toBe(0);
  });

  it('traduce portal y tamaño al alcance del repositorio y acota al tenant', async () => {
    const { service, repo } = build();
    await service.heatmap(
      { ...Q, portal: 'WEB', screenSize: 'tableta' },
      TENANT,
    );
    expect(repo.totals.mock.calls[0][0]).toMatchObject({
      tenantId: TENANT,
      route: '/home',
      portalConceptId: TELE.PORTAL_WEB,
      screenSize: 'tableta',
    });
    await service.heatmap({ ...Q, portal: 'MOBILE' }, TENANT);
    expect(repo.totals.mock.calls[1][0].portalConceptId).toBe(
      TELE.PORTAL_MOBILE,
    );
  });

  it('ventana inválida → 422 sin consultar', async () => {
    const { service, repo } = build();
    await expect(
      service.heatmap(
        {
          route: '/home',
          from: '2026-10-08T00:00:00Z',
          to: '2026-10-01T00:00:00Z',
        },
        TENANT,
      ),
    ).rejects.toMatchObject({
      status: 422,
      details: { reason: 'EMPTY_WINDOW' },
    });
    expect(repo.totals).not.toHaveBeenCalled();
  });
});
