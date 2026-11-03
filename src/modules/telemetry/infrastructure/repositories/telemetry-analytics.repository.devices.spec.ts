import { jest } from '@jest/globals';
import { TelemetryAnalyticsRepository } from './telemetry-analytics.repository';

/**
 * El SQL de `devices` contra un `EntityManager` doble que sólo captura
 * `execute(sql, params)`. Comprueba la forma de la consulta (parametrizada,
 * tenant y ventana como parámetros, bots fuera de los desgloses, orden y
 * límite). NO ejecuta el SQL: la agregación real contra Postgres queda
 * BLOQUEADA aquí (no hay base) y se verifica en `test/integration`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const TENANT = 'f3b0c442-98fc-4e1b-8a4a-5c2d6e7f8091';
const PORTAL = '9a8b7c6d-0000-4000-8000-000000000001';
const SCOPE = {
  tenantId: TENANT,
  window: {
    from: new Date('2026-10-01T00:00:00.000Z'),
    to: new Date('2026-10-08T00:00:00.000Z'),
    interval: 'day' as const,
    timezone: 'UTC' as const,
  },
  portalConceptId: PORTAL,
};

function build() {
  const execute = mockFn().mockResolvedValue([]);
  const em = { getConnection: () => ({ execute }) };
  return {
    repo: new TelemetryAnalyticsRepository(em as any),
    calls: () => execute.mock.calls as [string, unknown[], string][],
  };
}

describe('TelemetryAnalyticsRepository.devices (forma del SQL, sin base)', () => {
  it('lanza 5 consultas de lectura: totales y los cuatro desgloses', async () => {
    const d = build();

    await d.repo.devices(SCOPE);

    expect(d.calls()).toHaveLength(5);
    for (const [sql, , mode] of d.calls()) {
      expect(sql).toContain('FROM telemetry.client_contexts cc');
      expect(sql).not.toMatch(/\b(insert|update|delete|truncate)\b/i);
      expect(mode).toBe('all');
    }
  });

  it('tenant, ventana y portal viajan como parámetros, nunca dentro del texto SQL', async () => {
    const d = build();

    await d.repo.devices(SCOPE);

    for (const [sql, params] of d.calls()) {
      expect(sql).not.toContain(TENANT);
      expect(sql).not.toContain(PORTAL);
      expect(sql).not.toContain('2026-10');
      expect(params).toEqual(
        expect.arrayContaining([
          SCOPE.window.from,
          SCOPE.window.to,
          PORTAL,
          TENANT,
        ]),
      );
      // un `?` por parámetro: nada concatenado
      expect((sql.match(/\?/g) ?? []).length).toBe(params.length);
    }
  });

  it('acota al tenant por la sesión del contexto', async () => {
    const d = build();

    await d.repo.devices(SCOPE);

    for (const [sql] of d.calls()) {
      expect(sql).toContain('te.tenant_id = ?');
      expect(sql).toContain('xe.tenant_id IS DISTINCT FROM ?');
    }
  });

  it('los bots quedan fuera de los cuatro desgloses y se cuentan aparte en los totales', async () => {
    const d = build();

    await d.repo.devices(SCOPE);

    const [totals, ...breakdowns] = d.calls().map(([sql]) => sql);
    expect(totals).toContain('count(*) FILTER (WHERE cc.is_bot)::int AS bots');
    expect(totals).toContain('count(*) FILTER (WHERE cc.is_bot IS NOT TRUE)');
    expect(breakdowns).toHaveLength(4);
    for (const sql of breakdowns)
      expect(sql).toContain('cc.is_bot IS NOT TRUE');
  });

  it('cada desglose resuelve el concepto en el catálogo, ordena (contexts desc, code asc) y limita', async () => {
    const d = build();

    await d.repo.devices(SCOPE);

    const [, device, os, browser, version] = d.calls();
    expect(device[0]).toContain('cc.device_type_concept_id');
    expect(os[0]).toContain('cc.os_family_concept_id');
    expect(browser[0]).toContain('cc.browser_family_concept_id');
    for (const [sql] of [device, os, browser]) {
      expect(sql).toContain('LEFT JOIN terminology.catalog_concepts k');
    }
    expect(version[0]).toContain('cc.app_version');
    for (const [sql, params] of [device, os, browser, version]) {
      expect(sql).toMatch(
        /ORDER BY contexts DESC, code COLLATE "C" ASC\s+LIMIT \?/,
      );
      expect(params[params.length - 1]).toBe(50);
    }
  });

  it('no selecciona identificadores de sesión, sujeto ni hashes en la salida', async () => {
    const d = build();

    await d.repo.devices(SCOPE);

    for (const [sql] of d.calls()) {
      const outer = sql.split('FROM telemetry.client_contexts')[0];
      expect(outer).not.toMatch(
        /session_id|analytics_subject_id|ip_prefix_hash|user_agent_hash/,
      );
    }
  });

  it('sin portal no añade el filtro de portal', async () => {
    const d = build();

    await d.repo.devices({ ...SCOPE, portalConceptId: undefined });

    for (const [sql, params] of d.calls()) {
      expect(sql).not.toContain('portal_type_concept_id');
      expect(params).not.toContain(PORTAL);
    }
  });
});
