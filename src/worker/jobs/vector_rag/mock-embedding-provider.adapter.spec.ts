import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { createMockEmbeddingProviderAdapter } from './mock-embedding-provider.adapter';

const JOB = { id: 'job-1', vectorCollectionId: 'coll-1', jobType: 'backfill' };

describe('createMockEmbeddingProviderAdapter', () => {
  it('pide un vector al emulador y arma un EmbeddedDocumentDto sintético', async () => {
    const client = { post: mockFn() };
    client.post.mockResolvedValue({
      model: 'mock-embedding-v1',
      dimension: 3,
      data: [{ index: 0, embedding: [0.1, 0.2, 0.3], tokenCount: 12 }],
    });
    const adapter = createMockEmbeddingProviderAdapter(client as any);

    const outcome = await adapter(JOB);

    expect(client.post).toHaveBeenCalledWith(
      '/embeddings/compute',
      expect.objectContaining({
        inputs: [expect.stringContaining(JOB.id)],
      }),
    );
    expect(outcome.succeeded).toBe(true);
    expect(outcome.finalBatch).toBe(true);
    const documents = outcome.documents as any[];
    expect(documents).toHaveLength(1);
    const chunk = documents[0].chunks[0];
    expect(chunk.embedding).toBe('[0.1,0.2,0.3]');
    expect(chunk.chunkHash).toHaveLength(64); // sha256 hex
    expect(chunk.embeddingHash).toHaveLength(64);
    expect(chunk.tokenCount).toBe(12);
  });

  it('genera sourceDocumentId/sourceVersionId distintos en cada llamada', async () => {
    const client = { post: mockFn() };
    client.post.mockResolvedValue({
      model: 'mock-embedding-v1',
      dimension: 1,
      data: [{ index: 0, embedding: [0.5], tokenCount: 1 }],
    });
    const adapter = createMockEmbeddingProviderAdapter(client as any);

    const first = await adapter(JOB);
    const second = await adapter(JOB);

    const firstDocs = first.documents as any[];
    const secondDocs = second.documents as any[];
    expect(firstDocs[0].sourceDocumentId).not.toBe(
      secondDocs[0].sourceDocumentId,
    );
  });
});
