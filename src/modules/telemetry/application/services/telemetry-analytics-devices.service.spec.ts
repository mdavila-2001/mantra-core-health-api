import { jest } from '@jest/globals';
import { DomainException } from '../../../../common';
import { TelemetryAnalyticsService } from './telemetry-analytics.service';

/**
 * Doble declarado del repositorio: devuelve las filas que cada prueba le da.
 * Prueba la lógica del servicio (ventana, mapeo, orden, etiquetas, notMeasured);
 * NO prueba el SQL ni el tenant en base (ver `telemetry-analytics.repository.devices.spec.ts`
 * y, para Postgres real, `test/integration`, BLOQUEADO sin base).
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const WINDOW = {
  from: '2026-10-01T00:00:00.000Z',
  to: '2026-10-08T00:00:00.000Z',
};
const TENANT = 'tenant-a';

const EMPTY = {
  totals: {
    contexts: 0,
    bots: 0,
    bot_unknown: 0,
    last_context_at: null,
  },
  byDeviceType: [],
  byOsFamily: [],
  byBrowserFamily: [],
  byAppVersion: [],
};

function build(result: unknown = EMPTY) {
  const repo = { devices: mockFn().mockResolvedValue(result) };
  return { service: new TelemetryAnalyticsService(repo as any), repo };
}

describe('TelemetryAnalyticsService.devices', () => {
  describe('Correcto', () => {
    it('arma el contrato: ventana, totales, cuatro desgloses y lastContextAt ISO', async () => {
      const { service } = build({
        totals: {
          contexts: 7,
          bots: 2,
          bot_unknown: 0,
          last_context_at: new Date('2026-10-07T12:30:00.000Z'),
        },
        byDeviceType: [
          { code: 'MOBILE', label: 'Mobile', contexts: 5 },
          { code: 'DESKTOP', label: 'Desktop', contexts: 2 },
        ],
        byOsFamily: [{ code: 'ANDROID', label: 'Android', contexts: 7 }],
        byBrowserFamily: [{ code: 'CHROME', label: 'Chrome', contexts: 7 }],
        byAppVersion: [{ code: '2.4.1', label: '2.4.1', contexts: 7 }],
      });

      const out = await service.devices(
        { ...WINDOW, portal: 'MOBILE' },
        TENANT,
      );

      expect(out).toEqual({
        window: {
          from: WINDOW.from,
          to: WINDOW.to,
          interval: 'day',
          timezone: 'UTC',
          portal: 'MOBILE',
        },
        totals: { contexts: 7, bots: 2 },
        byDeviceType: [
          { code: 'MOBILE', label: 'Mobile', contexts: 5 },
          { code: 'DESKTOP', label: 'Desktop', contexts: 2 },
        ],
        byOsFamily: [{ code: 'ANDROID', label: 'Android', contexts: 7 }],
        byBrowserFamily: [{ code: 'CHROME', label: 'Chrome', contexts: 7 }],
        byAppVersion: [{ code: '2.4.1', label: '2.4.1', contexts: 7 }],
        lastContextAt: '2026-10-07T12:30:00.000Z',
        notMeasured: expect.any(Array),
      });
    });

    it('pasa al repositorio el tenant, la ventana y el concepto de portal', async () => {
      const { service, repo } = build();

      await service.devices({ ...WINDOW, portal: 'WEB' }, TENANT);

      const scope = repo.devices.mock.calls[0][0];
      expect(scope.tenantId).toBe(TENANT);
      expect(scope.window.from.toISOString()).toBe(WINDOW.from);
      expect(scope.window.to.toISOString()).toBe(WINDOW.to);
      expect(typeof scope.portalConceptId).toBe('string');
    });

    it('sin portal no filtra por portal y la ventana lo informa como null', async () => {
      const { service, repo } = build();

      const out = await service.devices(WINDOW, TENANT);

      expect(repo.devices.mock.calls[0][0].portalConceptId).toBeUndefined();
      expect(out.window.portal).toBeNull();
    });

    it('declara en notMeasured el consentimiento, los dispositivos únicos y los contextos sin sesión', async () => {
      const { service } = build();

      const out = await service.devices(WINDOW, TENANT);

      expect(out.notMeasured.map((m) => m.metric)).toEqual([
        'trackingConsent',
        'uniqueDevices',
        'contextsWithoutSession',
      ]);
      for (const m of out.notMeasured)
        expect(m.reason.length).toBeGreaterThan(20);
    });
  });

  describe('Límite', () => {
    it('sin datos: listas vacías, contexts 0, bots 0 y lastContextAt null (no es error)', async () => {
      const { service } = build({ ...EMPTY, totals: undefined });

      const out = await service.devices(WINDOW, TENANT);

      expect(out.totals).toEqual({ contexts: 0, bots: 0 });
      expect(out.byDeviceType).toEqual([]);
      expect(out.byOsFamily).toEqual([]);
      expect(out.byBrowserFamily).toEqual([]);
      expect(out.byAppVersion).toEqual([]);
      expect(out.lastContextAt).toBeNull();
    });

    it('sólo bots: totals.bots los cuenta y los desgloses quedan vacíos', async () => {
      const { service } = build({
        ...EMPTY,
        totals: { contexts: 0, bots: 4, bot_unknown: 0, last_context_at: null },
      });

      const out = await service.devices(WINDOW, TENANT);

      expect(out.totals).toEqual({ contexts: 0, bots: 4 });
      expect(out.byDeviceType).toEqual([]);
    });

    it('un código sin concepto resoluble conserva label = code; nunca inventa etiqueta', async () => {
      const { service } = build({
        ...EMPTY,
        byDeviceType: [
          {
            code: '0f8e7d6c-aaaa-bbbb-cccc-111122223333',
            label: '',
            contexts: 3,
          },
          { code: 'UNSPECIFIED', label: 'UNSPECIFIED', contexts: 1 },
        ],
      });

      const out = await service.devices(WINDOW, TENANT);

      for (const row of out.byDeviceType) expect(row.label).toBe(row.code);
    });

    it('is_bot desconocido se declara en notMeasured con su conteo', async () => {
      const { service } = build({
        ...EMPTY,
        totals: { contexts: 5, bots: 0, bot_unknown: 3, last_context_at: null },
      });

      const out = await service.devices(WINDOW, TENANT);

      const entry = out.notMeasured.find(
        (m) => m.metric === 'botClassification',
      );
      expect(entry?.reason).toContain('3 contexto(s)');
    });

    it('orden determinista: contexts desc y, en empate, code asc, aunque el repositorio lo entregue desordenado', async () => {
      const rows = [
        { code: 'b', label: 'b', contexts: 2 },
        { code: 'z', label: 'z', contexts: 9 },
        { code: 'a', label: 'a', contexts: 2 },
        { code: 'UNSPECIFIED', label: 'UNSPECIFIED', contexts: 2 },
      ];
      const { service } = build({ ...EMPTY, byAppVersion: rows });
      const { service: reversed } = build({
        ...EMPTY,
        byAppVersion: [...rows].reverse(),
      });

      const a = await service.devices(WINDOW, TENANT);
      const b = await reversed.devices(WINDOW, TENANT);

      expect(a.byAppVersion.map((r) => r.code)).toEqual([
        'z',
        'UNSPECIFIED',
        'a',
        'b',
      ]);
      expect(b.byAppVersion).toEqual(a.byAppVersion);
    });
  });

  describe('Inválido', () => {
    it.each([
      [
        'from posterior a to',
        { from: WINDOW.to, to: WINDOW.from },
        'EMPTY_WINDOW',
      ],
      [
        'ventana de más de 92 días',
        { from: '2026-01-01T00:00:00Z', to: '2026-10-01T00:00:00Z' },
        'WINDOW_TOO_LARGE',
      ],
      [
        'fecha no válida',
        { from: 'no-es-fecha', to: WINDOW.to },
        'INVALID_DATE',
      ],
    ])(
      '%s → 422 VALIDATION_FAILED con reason y sin consultar',
      async (_n, q, reason) => {
        const { service, repo } = build();

        const error = await service.devices(q, TENANT).catch((e) => e);

        expect(error).toBeInstanceOf(DomainException);
        expect(error.getStatus()).toBe(422);
        expect(error.code).toBe('VALIDATION_FAILED');
        expect(error.details).toEqual({ reason });
        expect(repo.devices).not.toHaveBeenCalled();
      },
    );

    it('la respuesta no contiene identificadores de sesión, sujeto ni hashes', async () => {
      const { service } = build({
        ...EMPTY,
        totals: { contexts: 1, bots: 0, bot_unknown: 0, last_context_at: null },
        byDeviceType: [
          {
            code: 'DESKTOP',
            label: 'Desktop',
            contexts: 1,
            // Campos que un repositorio descuidado podría filtrar:
            session_id: 'sid-secreto',
            analytics_subject_id: 'sub-secreto',
          },
        ],
      });

      const out = await service.devices(WINDOW, TENANT);

      const json = JSON.stringify(out);
      expect(json).not.toContain('secreto');
      expect(Object.keys(out.byDeviceType[0]).sort()).toEqual([
        'code',
        'contexts',
        'label',
      ]);
    });
  });
});
