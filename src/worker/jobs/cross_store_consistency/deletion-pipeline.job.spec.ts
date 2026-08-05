import { jest } from '@jest/globals';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict typings.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { DeletionPipelineJob } from './deletion-pipeline.job';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 */
function build() {
  const api = { get: mockFn(), post: mockFn(), workerId: mockFn() };
  const logger = {
    setContext: mockFn(),
    info: mockFn(),
    warn: mockFn(),
    error: mockFn(),
  };
  const job = new DeletionPipelineJob(api as any, logger as any);
  return { job, api, logger };
}

const pendingTarget = {
  id: 'target-1',
  deletionRequestId: 'request-1',
  datasetId: 'dataset-1',
  backendCode: 'MONGO',
  targetLocator: 'db.patients:doc-1',
  deletionMode: 'HARD',
};

const executedTarget = {
  id: 'target-2',
  deletionRequestId: 'request-1',
  datasetId: 'dataset-1',
  backendCode: 'OPENSEARCH',
  targetLocator: 'idx:doc-2',
  deletionMode: 'HARD',
};

describe('DeletionPipelineJob', () => {
  describe('executePending (UC-62-10)', () => {
    it('no llama a executions si no hay objetivos pendientes', async () => {
      const d = build();
      d.api.get.mockImplementation(async (path: string) =>
        path === '/workers/deletion-targets/pending'
          ? { targets: [] }
          : { targets: [] },
      );

      await d.job.tick();

      expect(d.api.get).toHaveBeenCalledWith(
        '/workers/deletion-targets/pending',
      );
      expect(d.api.post).not.toHaveBeenCalled();
    });

    it('ejecuta cada objetivo pendiente descubierto con el adapter por defecto (falla, no finge)', async () => {
      const d = build();
      d.api.get.mockImplementation(async (path: string) =>
        path === '/workers/deletion-targets/pending'
          ? { targets: [pendingTarget] }
          : { targets: [] },
      );
      d.api.post.mockResolvedValue({
        id: 'exec-1',
        status: 'FAILED',
        targetState: 'PENDING',
        duplicate: false,
      });

      await d.job.tick();

      expect(d.api.post).toHaveBeenCalledWith(
        `/workers/deletion-targets/${pendingTarget.id}/executions`,
        expect.objectContaining({
          succeeded: false,
          errorCode: 'PROVIDER_NOT_CONFIGURED',
        }),
      );
      expect(d.logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'worker.xstore.deletion-execute',
          errorCode: 'PROVIDER_NOT_CONFIGURED',
        }),
        expect.any(String),
      );
    });

    it('un adapter real inyectado puede reportar éxito', async () => {
      const d = build();
      d.job.executionAdapter = mockFn(async () => ({
        succeeded: true,
        providerReceipt: 'receipt-123',
      }));
      d.api.get.mockImplementation(async (path: string) =>
        path === '/workers/deletion-targets/pending'
          ? { targets: [pendingTarget] }
          : { targets: [] },
      );
      d.api.post.mockResolvedValue({
        id: 'exec-1',
        status: 'SUCCEEDED',
        targetState: 'EXECUTED',
        duplicate: false,
      });

      await d.job.tick();

      expect(d.api.post).toHaveBeenCalledWith(
        `/workers/deletion-targets/${pendingTarget.id}/executions`,
        expect.objectContaining({
          succeeded: true,
          providerReceipt: 'receipt-123',
        }),
      );
    });

    it('un fallo al ejecutar un objetivo no impide intentar el resto', async () => {
      const d = build();
      const second = { ...pendingTarget, id: 'target-3' };
      d.api.get.mockImplementation(async (path: string) =>
        path === '/workers/deletion-targets/pending'
          ? { targets: [pendingTarget, second] }
          : { targets: [] },
      );
      d.api.post
        .mockRejectedValueOnce(new Error('API caída'))
        .mockResolvedValueOnce({
          id: 'exec-2',
          status: 'FAILED',
          targetState: 'PENDING',
          duplicate: false,
        });

      await d.job.tick();

      expect(d.api.post).toHaveBeenCalledTimes(2);
      expect(d.logger.error).toHaveBeenCalledTimes(1);
    });
  });

  describe('verifyExecuted (UC-62-11)', () => {
    it('no llama a verifications si no hay objetivos ejecutados', async () => {
      const d = build();
      d.api.get.mockResolvedValue({ targets: [] });

      await d.job.tick();

      expect(d.api.get).toHaveBeenCalledWith(
        '/workers/deletion-targets/executed',
      );
      expect(d.api.post).not.toHaveBeenCalled();
    });

    it('verifica cada objetivo ejecutado con el adapter por defecto (no confirma ausencia)', async () => {
      const d = build();
      d.api.get.mockImplementation(async (path: string) =>
        path === '/workers/deletion-targets/executed'
          ? { targets: [executedTarget] }
          : { targets: [] },
      );
      d.api.post.mockResolvedValue({
        id: 'ver-1',
        targetState: 'PENDING',
        requiresReexecution: true,
      });

      await d.job.tick();

      expect(d.api.post).toHaveBeenCalledWith(
        `/workers/deletion-targets/${executedTarget.id}/verifications`,
        expect.objectContaining({
          verificationMethod: 'QUERY_ABSENCE',
          verifiedAbsent: false,
        }),
      );
      expect(d.logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'worker.xstore.deletion-verify',
          targetId: executedTarget.id,
        }),
        expect.any(String),
      );
    });

    it('un adapter real que confirma ausencia no marca requiresReexecution', async () => {
      const d = build();
      d.job.verificationAdapter = mockFn(async () => ({
        verificationMethod: 'CHECKSUM' as const,
        verifiedAbsent: true,
        residualReferenceCount: 0,
      }));
      d.api.get.mockImplementation(async (path: string) =>
        path === '/workers/deletion-targets/executed'
          ? { targets: [executedTarget] }
          : { targets: [] },
      );
      d.api.post.mockResolvedValue({
        id: 'ver-2',
        targetState: 'VERIFIED',
        requiresReexecution: false,
      });

      await d.job.tick();

      expect(d.logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'worker.xstore.deletion-verify',
          targetId: executedTarget.id,
        }),
        expect.any(String),
      );
    });
  });

  it('un fallo al listar no lanza (runTick lo absorbe)', async () => {
    const d = build();
    d.api.get.mockRejectedValue(new Error('API caída'));

    await expect(d.job.tick()).resolves.toBeUndefined();
    expect(d.logger.error).toHaveBeenCalled();
  });
});
