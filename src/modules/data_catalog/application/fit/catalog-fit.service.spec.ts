import { jest } from '@jest/globals';
import { CatalogFitService } from './catalog-fit.service';
import { FitCheckRegistry } from './fit-check.registry';
import { FitResultsStore } from './fit-results.store';
import type { FitRun } from './fit-results.store';
import {
  FIT_HISTORY_SIZE,
  FIT_RESULT_TTL_MS,
  FIT_RUN_RETENTION_MS,
  FIT_STALE_AFTER_MS,
} from './fit.constants';
import { NOW, baseInputs } from './fit.fixtures';

// Fábrica de mocks con tipos sueltos: el contrato que se prueba es el del servicio, no el de jest.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

function armar(
  collect = mockFn(async (now: Date) => ({ ...baseInputs(), now })),
) {
  let ahora = NOW;
  const store = new FitResultsStore();
  const service = new CatalogFitService(
    { collect } as never,
    new FitCheckRegistry(),
    store,
    () => ahora,
  );
  return {
    service,
    collect,
    store,
    avanzar: (ms: number) => {
      ahora = new Date(ahora.getTime() + ms);
    },
  };
}

describe('CatalogFitService', () => {
  it('sin corridas: SIN_RESULTADO / NUNCA_EJECUTADA, sin informe y con la retención declarada', async () => {
    const { service } = armar();
    const v = await service.latest();
    expect(v).toMatchObject({
      state: 'SIN_RESULTADO',
      noResultReason: 'NUNCA_EJECUTADA',
      report: null,
      ageSeconds: null,
      history: [],
    });
    expect(v.retention).toMatchObject({
      kind: 'MEMORIA_DEL_PROCESO',
      ttlSeconds: FIT_RESULT_TTL_MS / 1000,
      historySize: FIT_HISTORY_SIZE,
    });
  });

  it('request acepta sin esperar (EN_CURSO) y al terminar el último resultado queda VIGENTE', async () => {
    const { service } = armar();
    const { run, created } = service.request('MANUAL', 'clave-aaaa-1');
    expect([run.status, created]).toEqual(['EN_CURSO', true]);
    expect((await service.latest()).running?.runId).toBe(run.runId);
    await service.drain();
    const v = await service.latest();
    expect(v.state).toBe('VIGENTE');
    expect(v.running).toBeNull();
    expect(v.lastRun).toMatchObject({
      runId: run.runId,
      status: 'COMPLETADA',
      trigger: 'MANUAL',
    });
    expect(v.report?.verdict).toBe('AJUSTADA');
    expect(v.history).toHaveLength(1);
  });

  it('idempotente: la misma clave devuelve la misma corrida, antes y después de terminar', async () => {
    const { service, collect } = armar();
    const a = service.request('MANUAL', 'clave-aaaa-1');
    const b = service.request('MANUAL', 'clave-aaaa-1');
    expect(b.run.runId).toBe(a.run.runId);
    expect(b.created).toBe(false);
    await service.drain();
    const c = service.request('MANUAL', 'clave-aaaa-1');
    expect([c.run.runId, c.created, c.run.status]).toEqual([
      a.run.runId,
      false,
      'COMPLETADA',
    ]);
    expect(collect).toHaveBeenCalledTimes(1);
  });

  it('con una corrida en vuelo, otra clave se une a ella en vez de crear una segunda', async () => {
    const { service, collect } = armar();
    const a = service.request('TICK', 'clave-aaaa-1');
    const b = service.request('MANUAL', 'clave-bbbb-2');
    expect([b.run.runId, b.created]).toEqual([a.run.runId, false]);
    await service.drain();
    expect(collect).toHaveBeenCalledTimes(1);
    // y la segunda clave quedó asociada a esa misma corrida
    expect(service.request('MANUAL', 'clave-bbbb-2').run.runId).toBe(
      a.run.runId,
    );
  });

  it('sin clave y sin corrida en vuelo, cada pedido es una corrida nueva', async () => {
    const { service, collect } = armar();
    const a = service.request('TICK', null);
    await service.drain();
    const b = service.request('TICK', null);
    await service.drain();
    expect(b.run.runId).not.toBe(a.run.runId);
    expect(collect).toHaveBeenCalledTimes(2);
    expect((await service.latest()).history).toHaveLength(2);
  });

  it('requestAndWait espera el desenlace y trae el resumen que el worker necesita', async () => {
    const { service } = armar();
    const r = await service.requestAndWait('TICK', null);
    expect(r.run.status).toBe('COMPLETADA');
    expect(r.summary).toEqual({
      verdict: 'AJUSTADA',
      failedChecks: 0,
      blindSpots: 1,
    });
  });

  it('un fallo del colector deja la corrida FALLIDA con la clase del error, sin su mensaje', async () => {
    const { service } = armar(
      mockFn(async () => {
        throw new RangeError('password=secreto');
      }),
    );
    const r = await service.requestAndWait('TICK', null);
    expect(r.run).toMatchObject({ status: 'FALLIDA', errorCode: 'RangeError' });
    expect(JSON.stringify(r)).not.toContain('secreto');
    expect(r.summary).toBeUndefined();
    const v = await service.latest();
    expect(v.state).toBe('SIN_RESULTADO');
    expect(v.lastFailure?.errorCode).toBe('RangeError');
  });

  it('una corrida fallida no borra el último informe bueno', async () => {
    let falla = false;
    const collect = mockFn(async (now: Date) => {
      if (falla) throw new Error('x');
      return { ...baseInputs(), now };
    });
    const { service } = armar(collect);
    await service.requestAndWait('TICK', null);
    falla = true;
    await service.requestAndWait('TICK', null);
    const v = await service.latest();
    expect(v.state).toBe('VIGENTE');
    expect(v.report).not.toBeNull();
    expect(v.lastFailure?.status).toBe('FALLIDA');
  });

  it('S7: pasado el umbral el resultado se sirve ATRASADO con su antigüedad; pasado el TTL, EXPIRADO', async () => {
    const { service, avanzar } = armar();
    await service.requestAndWait('TICK', null);
    avanzar(FIT_STALE_AFTER_MS + 1000);
    expect(await service.latest()).toMatchObject({
      state: 'ATRASADO',
      noResultReason: null,
    });
    expect((await service.latest()).ageSeconds).toBeGreaterThan(
      FIT_STALE_AFTER_MS / 1000,
    );
    expect((await service.latest()).report).not.toBeNull();
    avanzar(FIT_RESULT_TTL_MS);
    const v = await service.latest();
    expect(v).toMatchObject({
      state: 'SIN_RESULTADO',
      noResultReason: 'EXPIRADO',
      report: null,
      history: [],
    });
  });

  it('el historial conserva sólo las últimas FIT_HISTORY_SIZE corridas', async () => {
    const { service } = armar();
    for (let i = 0; i < FIT_HISTORY_SIZE + 3; i++)
      await service.requestAndWait('TICK', null);
    expect((await service.latest()).history).toHaveLength(FIT_HISTORY_SIZE);
  });

  it('una clave vencida (más de una hora) ya no devuelve la corrida vieja', async () => {
    const { service, avanzar, collect } = armar();
    service.request('MANUAL', 'clave-aaaa-1');
    await service.drain();
    avanzar(61 * 60_000);
    const b = service.request('MANUAL', 'clave-aaaa-1');
    expect(b.created).toBe(true);
    await service.drain();
    expect(collect).toHaveBeenCalledTimes(2);
  });
});

/**
 * Doble del repositorio de `data_catalog.catalog_fit_runs` con la misma semántica que el SQL:
 * append-only, idempotente por id y por (trigger, clave), purga por `finished_at`.
 */
class FakeRuns {
  rows: (FitRun & { key: string | null })[] = [];
  failReads = false;
  failWrites = false;
  purges: Date[] = [];
  async save(run: FitRun, key: string | null) {
    if (this.failWrites) throw new TypeError('connection refused');
    if (
      this.rows.some(
        (r) =>
          r.runId === run.runId ||
          (key !== null && r.key === key && r.trigger === run.trigger),
      )
    )
      return 'CLAVE_REPETIDA' as const;
    this.rows.push(structuredClone({ ...run, key }));
    return 'GUARDADA' as const;
  }
  async purgeBefore(cutoff: Date) {
    this.purges.push(cutoff);
    const antes = this.rows.length;
    this.rows = this.rows.filter((r) => r.finishedAt! >= cutoff);
    return antes - this.rows.length;
  }
  private read() {
    if (this.failReads) throw new RangeError('timeout');
    return [...this.rows].sort(
      (a, b) => b.finishedAt!.getTime() - a.finishedAt!.getTime(),
    );
  }
  async latestCompleted() {
    return this.read().find((r) => r.status === 'COMPLETADA') ?? null;
  }
  async latestFailed() {
    return this.read().find((r) => r.status === 'FALLIDA') ?? null;
  }
  async history(since: Date, limit: number) {
    return this.read()
      .filter((r) => r.status === 'COMPLETADA' && r.finishedAt! >= since)
      .slice(0, limit)
      .reverse()
      .map((r) => ({
        runId: r.runId,
        evaluatedAt: r.report!.evaluatedAt,
        trigger: r.trigger,
        verdict: r.report!.verdict,
        dimensions: [],
        failedChecks: [],
        blindSpots: [...r.report!.blindSpots],
      }));
  }
}

describe('CatalogFitService con persistencia (data_catalog.catalog_fit_runs)', () => {
  function armarConBd(
    runs = new FakeRuns(),
    collect = mockFn(async (now: Date) => ({ ...baseInputs(), now })),
  ) {
    let ahora = NOW;
    const nuevo = () =>
      new CatalogFitService(
        { collect } as never,
        new FitCheckRegistry(),
        new FitResultsStore(),
        () => ahora,
        runs as never,
      );
    return {
      runs,
      nuevo,
      service: nuevo(),
      avanzar: (ms: number) => {
        ahora = new Date(ahora.getTime() + ms);
      },
    };
  }

  it('el tick guarda el desenlace y la lectura sale de la base (BASE_DE_DATOS)', async () => {
    const { service, runs } = armarConBd();
    const r = await service.requestAndWait('TICK', 'tick-0001-aaaa');
    expect(r.persisted).toBe(true);
    expect(runs.rows).toHaveLength(1);
    expect(runs.rows[0]).toMatchObject({
      runId: r.run.runId,
      status: 'COMPLETADA',
      trigger: 'TICK',
      key: 'tick-0001-aaaa',
    });
    const v = await service.latest();
    expect(v.state).toBe('VIGENTE');
    expect(v.lastRun?.runId).toBe(r.run.runId);
    expect(v.retention).toMatchObject({
      kind: 'BASE_DE_DATOS',
      fallbackReason: null,
      storedForSeconds: FIT_RUN_RETENTION_MS / 1000,
      lastWrite: { state: 'GUARDADA', runId: r.run.runId, errorCode: null },
    });
  });

  it('sobrevive a un reinicio: otro proceso (memoria vacía) lee la corrida de la base', async () => {
    const { service, nuevo } = armarConBd();
    const r = await service.requestAndWait('TICK', null);
    const reiniciado = nuevo();
    const v = await reiniciado.latest();
    expect(v.state).toBe('VIGENTE');
    expect(v.report?.verdict).toBe('AJUSTADA');
    expect(v.lastRun?.runId).toBe(r.run.runId);
    expect(v.history.map((h) => h.runId)).toEqual([r.run.runId]);
  });

  it('una corrida FALLIDA también se guarda (sin informe) y no tapa el último informe bueno', async () => {
    const collect = mockFn(async (now: Date) => ({ ...baseInputs(), now }));
    const { service, runs } = armarConBd(new FakeRuns(), collect);
    await service.requestAndWait('TICK', null);
    collect.mockImplementationOnce(async () => {
      throw new SyntaxError('boom');
    });
    await service.requestAndWait('TICK', null);
    expect(runs.rows.map((r) => r.status)).toEqual(['COMPLETADA', 'FALLIDA']);
    expect(runs.rows[1]).toMatchObject({
      errorCode: 'SyntaxError',
      report: null,
    });
    const v = await service.latest();
    expect(v.report).not.toBeNull();
    expect(v.lastFailure).toMatchObject({
      status: 'FALLIDA',
      errorCode: 'SyntaxError',
    });
  });

  it('fallback claro: con la base caída en lectura se sirve la memoria y se dice por qué', async () => {
    const { service, runs } = armarConBd();
    await service.requestAndWait('TICK', null);
    runs.failReads = true;
    const v = await service.latest();
    expect(v.state).toBe('VIGENTE');
    expect(v.retention).toMatchObject({
      kind: 'MEMORIA_DEL_PROCESO',
      fallbackReason: 'BD_NO_DISPONIBLE:RangeError',
    });
    expect(v.retention.note).toMatch(/memoria de este proceso/);
  });

  it('una escritura fallida no falla la corrida: queda COMPLETADA, persisted=false y lastWrite lo cuenta', async () => {
    const { service, runs } = armarConBd();
    runs.failWrites = true;
    const r = await service.requestAndWait('TICK', null);
    expect(r.run.status).toBe('COMPLETADA');
    expect(r.persisted).toBe(false);
    runs.failWrites = false;
    const v = await service.latest();
    // La base no tiene nada: lo dice, en vez de inventar un resultado que no guardó.
    expect(v.state).toBe('SIN_RESULTADO');
    expect(v.retention.lastWrite).toMatchObject({
      state: 'NO_GUARDADA',
      runId: r.run.runId,
      errorCode: 'TypeError',
    });
  });

  it('purga por retención después de cada escritura y el TTL de lectura sigue valiendo', async () => {
    const { service, runs, avanzar } = armarConBd();
    await service.requestAndWait('TICK', null);
    expect(runs.purges).toHaveLength(1);
    expect(NOW.getTime() - runs.purges[0].getTime()).toBe(FIT_RUN_RETENTION_MS);
    avanzar(FIT_RESULT_TTL_MS + 1000);
    const v = await service.latest();
    expect(v).toMatchObject({
      state: 'SIN_RESULTADO',
      noResultReason: 'EXPIRADO',
    });
  });
});
