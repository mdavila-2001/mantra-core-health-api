import { jest } from '@jest/globals';
import { ConflictException } from '../../../common/errors/domain.exception';
import { PROBE_INTERVAL_MS } from '../catalog/catalog.constants';
import type {
  CatalogRepository,
  ScanRow,
} from '../repositories/catalog.repository';
import { CatalogScanService } from './catalog-scan.service';

const ACTOR = '00000000-0000-4000-8000-000000000001';
const AHORA = new Date('2026-10-24T12:00:00.000Z');

const escaneo = (extra: Partial<ScanRow> = {}): ScanRow =>
  ({
    id: 'scan-1',
    status: 'QUEUED',
    requested_by_user_id: ACTOR,
    ...extra,
  }) as ScanRow;

// Fábrica de mocks con tipos sueltos: el contrato que se prueba es el del servicio, no el de jest.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

type Mocks = Record<string, any>;

/** El `EntityManager` simulado: `fork()` y `transactional` entregan el mismo objeto. */
function armar() {
  const repo: Mocks = {
    failAbandoned: mockFn(async () => 0),
    activeScan: mockFn(async () => null),
    lastFinishedScanAt: mockFn(async () => null),
    insertScan: mockFn(async () => escaneo()),
    claimScan: mockFn(async () => escaneo({ status: 'RUNNING' })),
    knownObjects: mockFn(async () => []),
    applyScan: mockFn(async () => undefined),
    finishScan: mockFn(async () => true),
    failScan: mockFn(async () => true),
    scanById: mockFn(async () => escaneo({ status: 'SUCCEEDED' })),
  };
  const em: Record<string, unknown> = {};
  em.fork = () => em;
  em.transactional = async (cb: (tx: unknown) => unknown) => cb(em);
  const classification = { classifyScan: mockFn(async () => ({})) };
  const service = new CatalogScanService(
    em as never,
    repo as unknown as CatalogRepository,
    classification as never,
  );
  (jest.spyOn(service, 'observe') as any).mockResolvedValue({
    observed: [],
    engineVersion: 'PostgreSQL 16',
  });
  return { service, repo, classification };
}

describe('CatalogScanService.runNext (la sonda)', () => {
  it('cierra lo abandonado antes de mirar si hay un escaneo activo', async () => {
    const { service, repo } = armar();
    repo.activeScan.mockResolvedValueOnce(escaneo({ status: 'RUNNING' }));
    await service.runNext(ACTOR, AHORA);
    const orden = [
      repo.failAbandoned.mock.invocationCallOrder[0],
      repo.activeScan.mock.invocationCallOrder[0],
    ];
    expect(orden[0]).toBeLessThan(orden[1]);
  });

  it('con un escaneo RUNNING ajeno no reclama nada', async () => {
    const { service, repo } = armar();
    repo.activeScan.mockResolvedValueOnce(escaneo({ status: 'RUNNING' }));
    await expect(service.runNext(ACTOR, AHORA)).resolves.toEqual({
      claimed: 0,
    });
    expect(repo.claimScan).not.toHaveBeenCalled();
    expect(repo.insertScan).not.toHaveBeenCalled();
  });

  it('con un escaneo en cola lo ejecuta sin pedir otro', async () => {
    const { service, repo } = armar();
    repo.activeScan.mockResolvedValueOnce(escaneo({ status: 'QUEUED' }));
    await expect(service.runNext(ACTOR, AHORA)).resolves.toEqual({
      claimed: 1,
      scanId: 'scan-1',
      status: 'SUCCEEDED',
    });
    expect(repo.insertScan).not.toHaveBeenCalled();
    expect(repo.finishScan).toHaveBeenCalled();
  });

  it('sin activo y sin escaneo previo pide uno y lo ejecuta', async () => {
    const { service, repo } = armar();
    const res = await service.runNext(ACTOR, AHORA);
    expect(res.claimed).toBe(1);
    expect(repo.insertScan).toHaveBeenCalledTimes(1);
    expect(repo.claimScan).toHaveBeenCalledTimes(1);
  });

  it('dentro del intervalo no pide nada', async () => {
    const { service, repo } = armar();
    repo.lastFinishedScanAt.mockResolvedValueOnce(
      new Date(AHORA.getTime() - PROBE_INTERVAL_MS + 1000).toISOString(),
    );
    await expect(service.runNext(ACTOR, AHORA)).resolves.toEqual({
      claimed: 0,
    });
    expect(repo.insertScan).not.toHaveBeenCalled();
  });

  it('vencido el intervalo pide el escaneo', async () => {
    const { service, repo } = armar();
    repo.lastFinishedScanAt.mockResolvedValueOnce('2026-10-24 11:44:00.000+00');
    const res = await service.runNext(ACTOR, AHORA);
    expect(res.claimed).toBe(1);
    expect(repo.insertScan).toHaveBeenCalled();
  });

  it('si otro proceso pidió el escaneo antes (409), no reclama', async () => {
    const otro = armar();
    otro.repo.insertScan.mockRejectedValueOnce(
      new ConflictException('Ya hay un escaneo en curso de esta fuente'),
    );
    otro.repo.activeScan.mockResolvedValue(null);
    await expect(otro.service.runNext(ACTOR, AHORA)).resolves.toEqual({
      claimed: 0,
    });
  });

  it('si el worker pierde la carrera por el lease (claimScan sin fila) no reclama', async () => {
    const { service, repo } = armar();
    repo.activeScan.mockResolvedValueOnce(escaneo({ status: 'QUEUED' }));
    repo.claimScan.mockResolvedValueOnce(null);
    await expect(service.runNext(ACTOR, AHORA)).resolves.toEqual({
      claimed: 0,
    });
    expect(repo.applyScan).not.toHaveBeenCalled();
  });
});

describe('clasificación al terminar el escaneo', () => {
  it('un escaneo exitoso dispara la clasificación de sus columnas', async () => {
    const { service, repo, classification } = armar();
    repo.activeScan.mockResolvedValueOnce(escaneo({ status: 'QUEUED' }));
    await service.runNext(ACTOR, AHORA);
    await service.drain();
    expect(classification.classifyScan).toHaveBeenCalledWith('scan-1');
  });

  it('un escaneo sin lease no clasifica', async () => {
    const a = armar();
    a.repo.activeScan.mockResolvedValueOnce(escaneo({ status: 'QUEUED' }));
    a.repo.finishScan.mockResolvedValueOnce(false);
    await a.service.runNext(ACTOR, AHORA);
    await a.service.drain();
    expect(a.classification.classifyScan).not.toHaveBeenCalled();
  });

  it('si la clasificación falla, el escaneo ya quedó confirmado y no se propaga', async () => {
    const { service, repo, classification } = armar();
    repo.activeScan.mockResolvedValueOnce(escaneo({ status: 'QUEUED' }));
    classification.classifyScan.mockRejectedValueOnce(new Error('boom'));
    await expect(service.runNext(ACTOR, AHORA)).resolves.toMatchObject({
      claimed: 1,
    });
    await expect(service.drain()).resolves.toBeUndefined();
  });
});

describe('fencing del cierre del escaneo', () => {
  it('finishScan sin fila: informa fenced y no confirma lo aplicado (lanza dentro de la transacción)', async () => {
    const { service, repo } = armar();
    repo.activeScan.mockResolvedValueOnce(escaneo({ status: 'QUEUED' }));
    repo.finishScan.mockResolvedValueOnce(false);
    repo.scanById.mockResolvedValueOnce(escaneo({ status: 'FAILED' }));
    const res = await service.runNext(ACTOR, AHORA);
    expect(res).toEqual({
      claimed: 1,
      scanId: 'scan-1',
      status: 'FAILED',
      fenced: true,
    });
    expect(repo.failScan).not.toHaveBeenCalled();
  });

  it('failScan sin fila: también informa fenced', async () => {
    const { service, repo } = armar();
    repo.activeScan.mockResolvedValueOnce(escaneo({ status: 'QUEUED' }));
    (jest.spyOn(service, 'observe') as any).mockRejectedValue(
      new Error('pg caído'),
    );
    repo.failScan.mockResolvedValueOnce(false);
    const res = await service.runNext(ACTOR, AHORA);
    expect(res.fenced).toBe(true);
  });

  it('el cierre lleva el dueño del lease que reclamó', async () => {
    const { service, repo } = armar();
    repo.activeScan.mockResolvedValueOnce(escaneo({ status: 'QUEUED' }));
    await service.runNext(ACTOR, AHORA);
    const dueñoReclamo = repo.claimScan.mock.calls[0][2];
    expect(repo.finishScan.mock.calls[0][2]).toBe(dueñoReclamo);
  });
});
