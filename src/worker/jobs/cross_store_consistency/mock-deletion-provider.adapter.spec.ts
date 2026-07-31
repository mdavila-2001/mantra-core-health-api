import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import {
  createMockDeletionExecutionAdapter,
  createMockDeletionVerificationAdapter,
} from './mock-deletion-provider.adapter';

const TARGET = {
  id: 'target-1',
  deletionRequestId: 'request-1',
  datasetId: 'dataset-1',
  backendCode: 'MONGO',
  targetLocator: 'db.patients:doc-1',
  deletionMode: 'HARD',
};

describe('createMockDeletionExecutionAdapter', () => {
  it('llama /deletions/execute con backend, locator y modo', async () => {
    const client = { post: mockFn() };
    client.post.mockResolvedValue({ succeeded: true, providerReceipt: 'r1' });
    const adapter = createMockDeletionExecutionAdapter(client as any);

    const outcome = await adapter(TARGET);

    expect(client.post).toHaveBeenCalledWith('/deletions/execute', {
      backendCode: 'MONGO',
      targetLocator: 'db.patients:doc-1',
      deletionMode: 'HARD',
    });
    expect(outcome).toEqual({ succeeded: true, providerReceipt: 'r1' });
  });
});

describe('createMockDeletionVerificationAdapter', () => {
  it('llama /deletions/verify con backend y locator', async () => {
    const client = { post: mockFn() };
    client.post.mockResolvedValue({
      verificationMethod: 'QUERY_ABSENCE',
      verifiedAbsent: true,
      residualReferenceCount: 0,
    });
    const adapter = createMockDeletionVerificationAdapter(client as any);

    const outcome = await adapter(TARGET);

    expect(client.post).toHaveBeenCalledWith('/deletions/verify', {
      backendCode: 'MONGO',
      targetLocator: 'db.patients:doc-1',
    });
    expect(outcome.verifiedAbsent).toBe(true);
  });
});
