import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { EmbeddingDrainJob } from './embedding-drain.job';

function build() {
  const api = { get: mockFn(), post: mockFn(), workerId: mockFn() };
  const logger = {
    setContext: mockFn(),
    info: mockFn(),
    warn: mockFn(),
    error: mockFn(),
  };
  const job = new EmbeddingDrainJob(api as any, logger as any);
  return { job, api, logger };
}

const queuedJob = {
  id: 'job-1',
  vectorCollectionId: 'coll-1',
  jobType: 'backfill',
};

describe('EmbeddingDrainJob', () => {
  it('no llama a run si no hay jobs en cola', async () => {
    const d = build();
    d.api.get.mockResolvedValue({ jobs: [] });

    await d.job.tick();

    expect(d.api.get).toHaveBeenCalledWith(
      '/vector-rag/embedding-jobs/pending',
      {
        limit: 20,
      },
    );
    expect(d.api.post).not.toHaveBeenCalled();
  });

  it('con el adapter por defecto, declara failed en vez de inventar un embedding', async () => {
    const d = build();
    d.api.get.mockResolvedValue({ jobs: [queuedJob] });
    d.api.post.mockResolvedValue({ jobId: queuedJob.id, status: 'failed' });

    await d.job.tick();

    expect(d.api.post).toHaveBeenCalledWith(
      `/vector-rag/embedding-jobs/${queuedJob.id}/run`,
      { failed: true, errorCode: 'PROVIDER_NOT_CONFIGURED' },
    );
    expect(d.logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: 'worker.vector_rag.embedding-drain',
        jobId: queuedJob.id,
      }),
      expect.any(String),
    );
  });

  it('un adapter real inyectado puede reportar éxito', async () => {
    const d = build();
    d.job.providerAdapter = mockFn(async () => ({
      succeeded: true,
      documents: [{ sourceDocumentId: 'doc-1' }],
      finalBatch: true,
    }));
    d.api.get.mockResolvedValue({ jobs: [queuedJob] });
    d.api.post.mockResolvedValue({ jobId: queuedJob.id, status: 'completed' });

    await d.job.tick();

    expect(d.api.post).toHaveBeenCalledWith(
      `/vector-rag/embedding-jobs/${queuedJob.id}/run`,
      { documents: [{ sourceDocumentId: 'doc-1' }], finalBatch: true },
    );
  });

  it('un fallo al ejecutar un job no impide intentar el resto', async () => {
    const d = build();
    const second = { ...queuedJob, id: 'job-2' };
    d.api.get.mockResolvedValue({ jobs: [queuedJob, second] });
    d.api.post
      .mockRejectedValueOnce(new Error('API caída'))
      .mockResolvedValueOnce({ jobId: second.id, status: 'failed' });

    await d.job.tick();

    expect(d.api.post).toHaveBeenCalledTimes(2);
  });

  it('un fallo al listar no lanza (runTick lo absorbe)', async () => {
    const d = build();
    d.api.get.mockRejectedValue(new Error('API caída'));

    await expect(d.job.tick()).resolves.toBeUndefined();
    expect(d.logger.error).toHaveBeenCalled();
  });
});
