import { jest } from '@jest/globals';
import { CatalogFitService } from './catalog-fit.service';
import { FitCheckRegistry } from './fit-check.registry';
import { FitResultsStore } from './fit-results.store';
import {
  FIT_HISTORY_SIZE,
  FIT_RESULT_TTL_MS,
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
  it('sin corridas: SIN_RESULTADO / NUNCA_EJECUTADA, sin informe y con la retención declarada', () => {
    const { service } = armar();
    const v = service.latest();
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
    expect(service.latest().running?.runId).toBe(run.runId);
    await service.drain();
    const v = service.latest();
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
    expect(service.latest().history).toHaveLength(2);
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
    const v = service.latest();
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
    const v = service.latest();
    expect(v.state).toBe('VIGENTE');
    expect(v.report).not.toBeNull();
    expect(v.lastFailure?.status).toBe('FALLIDA');
  });

  it('S7: pasado el umbral el resultado se sirve ATRASADO con su antigüedad; pasado el TTL, EXPIRADO', async () => {
    const { service, avanzar } = armar();
    await service.requestAndWait('TICK', null);
    avanzar(FIT_STALE_AFTER_MS + 1000);
    expect(service.latest()).toMatchObject({
      state: 'ATRASADO',
      noResultReason: null,
    });
    expect(service.latest().ageSeconds).toBeGreaterThan(
      FIT_STALE_AFTER_MS / 1000,
    );
    expect(service.latest().report).not.toBeNull();
    avanzar(FIT_RESULT_TTL_MS);
    const v = service.latest();
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
    expect(service.latest().history).toHaveLength(FIT_HISTORY_SIZE);
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
