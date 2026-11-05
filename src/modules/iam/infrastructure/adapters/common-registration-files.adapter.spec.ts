import { jest } from '@jest/globals';
import { EntitySchema, TransactionContext } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/postgresql';
import { CommonRegistrationFilesAdapter } from './common-registration-files.adapter';

function fixture(fail = false) {
  const orm = new MikroORM({
    entities: [
      new EntitySchema({
        name: 'OfflineUploadContext',
        properties: { id: { type: 'number', primary: true } },
      }),
    ],
    dbName: 'offline',
    allowGlobalContext: true,
    metadataCache: { enabled: false },
    logger: () => undefined,
  });
  const tx = orm.em.fork();
  const events: string[] = [];
  const execute = jest.fn(async () => {
    events.push('scope');
    return [];
  });
  tx.execute = execute as any;
  const em = { transactional: jest.fn(async (fn: any) => fn(tx)) };
  const uploads = {
    uploadAnonymous: jest.fn(async () => {
      expect(TransactionContext.getEntityManager('default')).toBe(tx);
      events.push('upload');
      if (fail) throw new Error('validation denied');
      return { id: 'synthetic-file' };
    }),
  };
  const attach = {
    claimAnonymousUpload: jest.fn(async () => ({ id: 'claimed' })),
  };
  const adapter = new CommonRegistrationFilesAdapter(
    uploads as never,
    attach as never,
    em as never,
  );
  return { tx, execute, events, em, uploads, adapter, attach };
}
describe('public registration file persistence boundary', () => {
  it('scopes the write to the existing IAM auth-boundary transaction and preserves upload policy', async () => {
    const d = fixture();
    const file = {
      buffer: Buffer.from('%PDF-1.7'),
      originalname: 'synthetic.pdf',
      mimetype: 'application/pdf',
    };
    const policy = {
      category: 'DOCUMENT',
      sensitivity: 'NORMAL',
      allowedMimeTypes: ['application/pdf'],
      operation: 'iam.auth.upload-registration-document',
    } as const;
    expect(await d.adapter.uploadAnonymous(file, policy)).toEqual({
      id: 'synthetic-file',
    });
    expect(d.execute).toHaveBeenCalledWith(
      "select set_config('app.system_context', 'true', true)",
    );
    expect(d.events).toEqual(['scope', 'upload']);
    expect(TransactionContext.getEntityManager('default')).toBeUndefined();
    expect(d.uploads.uploadAnonymous).toHaveBeenCalledWith(
      file,
      expect.anything(),
      expect.objectContaining({
        allowedMimeTypes: policy.allowedMimeTypes,
        operation: policy.operation,
      }),
    );
  });
  it('does not retain an elevated context after validation rejects the upload', async () => {
    const d = fixture(true);
    await expect(
      d.adapter.uploadAnonymous(undefined, {
        category: 'DOCUMENT',
        sensitivity: 'NORMAL',
        allowedMimeTypes: ['application/pdf'],
        operation: 'test',
      }),
    ).rejects.toThrow('validation denied');
    expect(TransactionContext.getEntityManager('default')).toBeUndefined();
  });
  it('leaves authenticated claim delegation unchanged and does not open a system transaction', async () => {
    const d = fixture();
    await (d.adapter.claimAnonymousUpload as any)('id', 'actor', 'scope');
    expect(d.attach.claimAnonymousUpload).toHaveBeenCalledWith(
      'id',
      'actor',
      'scope',
    );
    expect(d.em.transactional).not.toHaveBeenCalled();
  });
});
