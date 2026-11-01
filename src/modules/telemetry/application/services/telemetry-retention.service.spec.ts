import { jest } from '@jest/globals';
import { TelemetryRetentionService } from './telemetry-retention.service';

const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;
const NOW = new Date('2026-10-31T12:00:00.000Z');
const DAY = 86_400_000;

/** Base doblada con estado mínimo: eventos con su `received_at` por propósito. */
function build(
  events: Array<{ id: string; purposeId: string; at: Date }>,
  purposes: any[],
) {
  const live = [...events];
  const statements: string[] = [];
  const exec = fn(async (sql: string, params: unknown[] = []) => {
    statements.push(sql.replace(/\s+/g, ' ').trim().slice(0, 60));
    if (sql.includes('FROM telemetry.tracking_purpose_definitions'))
      return purposes;
    if (sql.includes('SELECT e.id FROM telemetry.user_activity_events')) {
      const [purposeId, cutoff, limit] = params as [string, Date, number];
      return live
        .filter((e) => e.purposeId === purposeId && e.at < cutoff)
        .sort((a, b) => +a.at - +b.at)
        .slice(0, limit)
        .map((e) => ({ id: e.id }));
    }
    if (sql.includes('DELETE FROM telemetry.user_activity_event_properties'))
      return [{ n: (params as unknown[]).length * 2 }];
    if (sql.includes('DELETE FROM telemetry.user_activity_events')) {
      for (const id of params as string[])
        live.splice(
          live.findIndex((e) => e.id === id),
          1,
        );
      return [{ n: (params as unknown[]).length }];
    }
    if (sql.includes('DELETE FROM telemetry.client_error_events'))
      return [{ n: 0 }];
    return [];
  });
  const conn = { execute: exec };
  const em = {
    getConnection: () => conn,
    transactional: async (cb: any) => cb({ execute: exec }),
  };
  const logger = { setContext: fn(), info: fn() };
  return {
    service: new TelemetryRetentionService(em as never, logger as never),
    live,
    statements,
  };
}

describe('TelemetryRetentionService.purge (fechas límite)', () => {
  const purposes = [
    { id: 'p90', purpose_code: 'PLATFORM_USAGE_AGGREGATE', days: 90 },
    { id: 'pnull', purpose_code: 'PORTAL_UX_HEATMAP', days: null },
  ];
  const events = [
    { id: 'old', purposeId: 'p90', at: new Date(NOW.getTime() - 91 * DAY) },
    {
      id: 'edge-out',
      purposeId: 'p90',
      at: new Date(NOW.getTime() - 90 * DAY - 1_000),
    },
    {
      id: 'edge-in',
      purposeId: 'p90',
      at: new Date(NOW.getTime() - 90 * DAY + 1_000),
    },
    { id: 'fresh', purposeId: 'p90', at: new Date(NOW.getTime() - DAY) },
    {
      id: 'no-policy',
      purposeId: 'pnull',
      at: new Date(NOW.getTime() - 400 * DAY),
    },
  ];

  it('borra lo vencido por 1 s, conserva lo que está 1 s dentro y lo de propósitos sin retención', async () => {
    const { service, live } = build(events, purposes);
    const res = await service.purge({ now: NOW });
    expect(res.purposes).toHaveLength(1);
    expect(res.purposes[0]).toMatchObject({
      purposeCode: 'PLATFORM_USAGE_AGGREGATE',
      retentionDays: 90,
      events: 2,
    });
    expect(live.map((e) => e.id).sort()).toEqual([
      'edge-in',
      'fresh',
      'no-policy',
    ]);
    expect(res.withoutRetention).toEqual(['PORTAL_UX_HEATMAP']);
    expect(res.purposes[0].properties).toBe(4);
  });

  it('es idempotente: la segunda corrida con el mismo corte no borra nada', async () => {
    const { service } = build(events, purposes);
    await service.purge({ now: NOW });
    const again = await service.purge({ now: NOW });
    expect(again.totalEvents).toBe(0);
    expect(again.totalProperties).toBe(0);
  });

  it('batch limitado: con lote 1 y 1 lote por corrida deja el resto y lo declara (more)', async () => {
    const { service, live } = build(events, purposes);
    const first = await service.purge({
      now: NOW,
      batchSize: 1,
      maxBatches: 1,
    });
    expect(first.purposes[0]).toMatchObject({
      events: 1,
      batches: 1,
      more: true,
    });
    expect(live.map((e) => e.id)).toContain('edge-out');
    const second = await service.purge({
      now: NOW,
      batchSize: 1,
      maxBatches: 5,
    });
    expect(second.purposes[0].events).toBe(1);
    expect(second.purposes[0].more).toBe(false);
  });

  it('antes de borrar eventos suelta las referencias (journeys, vitales, conversiones) y borra propiedades primero', async () => {
    const { service, statements } = build(events, purposes);
    await service.purge({ now: NOW });
    const order = statements.filter((s) => /UPDATE|WITH d AS \(DELETE/.test(s));
    const iProps = statements.findIndex((s) =>
      s.includes('user_activity_event_properties'),
    );
    const iEvents = statements.findIndex((s) =>
      s.includes('DELETE FROM telemetry.user_activity_events'),
    );
    expect(order.length).toBeGreaterThan(0);
    expect(
      statements.some((s) =>
        s.includes('UPDATE telemetry.session_journeys SET entry_event_id'),
      ),
    ).toBe(true);
    expect(iProps).toBeLessThan(iEvents);
  });
});
