import { jest } from '@jest/globals';
import type { EntityManager } from '@mikro-orm/postgresql';
import { FileUploadService } from './file-upload.service';
import { FilesService } from './files.service';
import { AttachableFileService } from './attachable-file.service';
import { CONCEPTS, SEED } from '../../../common/constants/concepts';
import { StorageLifecycleDenied } from '../../../common/storage/storage-lifecycle.protocol';
import type { PublicationContext } from '../../../common/storage/storage-publication.service';
import {
  FileCategory,
  FileSensitivity,
  DerivativeType,
  OwnerType,
} from '../dto';

function build() {
  process.env.FILE_STORAGE_LIFECYCLE_BINDING = '{}';
  const identity = {
    kind: 'KNOWN',
    protocolVersion: 1,
    bindingRevision: 'synthetic',
    backendIdentity: 'synthetic',
    physicalContainer: 'synthetic',
    exactObjectKey: 'synthetic',
    versionSelector: { kind: 'UNVERSIONED' },
  } as const;
  const file = {
    id: 'synthetic-file',
    tenantId: SEED.tenantId,
    currentVersionId: 'synthetic-version',
    createdByUserId: undefined as string | undefined,
    originalName: 'synthetic.pdf',
    lifecycleStatusConceptId: CONCEPTS.FILE_ACTIVE,
    createdAt: new Date(),
  };
  const tx = {
    flush: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  } as unknown as EntityManager;
  const em = {
    transactional: jest
      .fn<(cb: (tx: EntityManager) => Promise<unknown>) => Promise<unknown>>()
      .mockImplementation(async (cb) => cb(tx)),
    fork: () => tx,
  };
  const files = {
    create: jest.fn(() => file),
    findById: jest.fn<() => Promise<unknown>>().mockResolvedValue(file),
  };
  const versions = {
    create: jest.fn(() => ({ id: 'synthetic-version' })),
    findById: jest.fn<() => Promise<unknown>>().mockResolvedValue({
      id: 'synthetic-version',
      fileId: file.id,
      mimeType: 'application/pdf',
    }),
    maxVersionNumber: jest.fn<() => Promise<number>>().mockResolvedValue(1),
  };
  const derivatives = { create: jest.fn() };
  const links = { create: jest.fn() };
  const context: PublicationContext = {
    tx,
    targetId: file.id,
    stored: {
      storageUri: 'synthetic://object',
      contentHash: 'a'.repeat(64),
      sizeBytes: 9,
      physicalIdentity: identity,
    },
  };
  const publication = {
    guardLocator: jest.fn<() => Promise<unknown>>().mockResolvedValue(identity),
    guardFile: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    lockNamespace: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    publish: jest
      .fn<
        (
          input: unknown,
          target: unknown,
          callback: (context: PublicationContext) => Promise<unknown>,
        ) => Promise<unknown>
      >()
      .mockImplementation(async (_input, _target, callback) =>
        callback(context),
      ),
  };
  const logger = {
    setContext: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  const storage = {
    store: jest.fn(),
    retrieve: jest.fn(),
    exists: jest.fn(),
    delete: jest.fn(),
  };
  const service = new FilesService(
    em as never,
    files as never,
    versions as never,
    derivatives as never,
    links as never,
    logger as never,
    publication as never,
  );
  const attachable = new AttachableFileService(
    files as never,
    versions as never,
    logger as never,
    publication as never,
  );
  const uploads = new FileUploadService(
    em as never,
    storage as never,
    service,
    files as never,
    versions as never,
    attachable,
    logger as never,
    publication as never,
  );
  return {
    service,
    uploads,
    attachable,
    files,
    versions,
    derivatives,
    links,
    publication,
    storage,
    em,
    tx,
    file,
    context,
  };
}
const dto = {
  category: FileCategory.DOCUMENT,
  sensitivity: FileSensitivity.NORMAL,
};
const versionDto = {
  ...dto,
  originalName: 'synthetic.pdf',
  storageUri: 'synthetic://object',
  contentHash: 'a'.repeat(64),
  sizeBytes: 9,
  mimeType: 'application/pdf',
};
const input = {
  originalname: 'synthetic.pdf',
  mimetype: 'application/pdf',
  buffer: Buffer.from('%PDF-1.7\n'),
};
const actor = { id: 'synthetic-owner', roles: [] };
afterEach(() => {
  delete process.env.FILE_STORAGE_LIFECYCLE_BINDING;
});
describe('real files write integration with a controlled coordinator transaction', () => {
  it.each([false, true])(
    'authenticated/anonymous upload (%s) publishes both metadata layers in the supplied transaction',
    async (anonymous) => {
      const test = build();
      if (anonymous)
        await test.uploads.uploadAnonymous(input, dto, {
          allowedMimeTypes: ['application/pdf'],
          operation: 'synthetic-upload',
        });
      else await test.uploads.upload(input, dto, actor);
      expect(test.publication.publish).toHaveBeenCalledTimes(1);
      expect(test.storage.store).not.toHaveBeenCalled();
      expect(test.files.create).toHaveBeenCalledWith(
        test.tx,
        expect.objectContaining({
          id: test.file.id,
          actorUserId: anonymous ? undefined : actor.id,
        }),
      );
      expect(test.versions.create).toHaveBeenCalledWith(
        test.tx,
        expect.objectContaining({
          bucketOrContainer: 'synthetic',
          objectKey: 'synthetic',
        }),
      );
      expect(test.em.transactional).not.toHaveBeenCalled(); // No nested/uncoordinated metadata commit.
    },
  );
  it('a producer reservation blocks claim before ownership changes', async () => {
    const test = build();
    test.publication.guardFile.mockRejectedValue(
      new StorageLifecycleDenied('PRODUCER_IN_FLIGHT'),
    );
    await expect(
      test.attachable.claimAnonymousUpload(test.tx, test.file.id, {
        tenantId: 'synthetic-new-tenant',
        ownerUserId: actor.id,
      }),
    ).rejects.toThrow('PRODUCER_IN_FLIGHT');
    expect(test.file.tenantId).toBe(SEED.tenantId);
    expect(test.file.createdByUserId).toBeUndefined();
    expect(test.files.findById).not.toHaveBeenCalled();
  });
  it('claim retains the existing ownership checks after the lifecycle guard', async () => {
    const test = build();
    test.file.createdByUserId = 'synthetic-other-owner';
    await expect(
      test.attachable.claimAnonymousUpload(test.tx, test.file.id, {
        tenantId: 'synthetic-tenant',
        ownerUserId: actor.id,
      }),
    ).rejects.toThrow();
    expect(test.publication.guardFile).toHaveBeenCalledWith(
      test.tx,
      test.file.id,
    );
    expect(test.file.createdByUserId).toBe('synthetic-other-owner');
  });
  it.each(['create', 'version', 'derivative'])(
    'blocks %s reference publication when physical identity is unproven',
    async (operation) => {
      const test = build();
      test.publication.guardLocator.mockRejectedValue(
        new StorageLifecycleDenied('PHYSICAL_IDENTITY_UNKNOWN'),
      );
      const promise =
        operation === 'create'
          ? test.service.createFile(versionDto, actor)
          : operation === 'version'
            ? test.service.createVersion(test.file.id, versionDto, actor)
            : test.service.createDerivative(
                test.file.id,
                'synthetic-version',
                { ...versionDto, derivativeType: DerivativeType.THUMBNAIL },
                actor,
              );
      await expect(promise).rejects.toThrow('PHYSICAL_IDENTITY_UNKNOWN');
      expect(test.files.create).not.toHaveBeenCalled();
      expect(test.versions.create).not.toHaveBeenCalled();
      expect(test.derivatives.create).not.toHaveBeenCalled();
    },
  );
  it('blocks new file links while a producer is in flight', async () => {
    const test = build();
    test.publication.guardFile.mockRejectedValue(
      new StorageLifecycleDenied('PRODUCER_IN_FLIGHT'),
    );
    await expect(
      test.service.createLink(
        test.file.id,
        { ownerType: Object.values(OwnerType)[0], ownerId: 'synthetic-owner' },
        actor,
      ),
    ).rejects.toThrow('PRODUCER_IN_FLIGHT');
    expect(test.links.create).not.toHaveBeenCalled();
  });
  it.each(['deleted', 'no-current', 'other-owner'])(
    'read authorization still fails closed for %s without any lifecycle grant',
    async (state) => {
      const test = build();
      test.file.createdByUserId = actor.id;
      if (state === 'deleted')
        test.file.lifecycleStatusConceptId = CONCEPTS.FILE_DELETED;
      if (state === 'no-current') test.file.currentVersionId = '';
      if (state === 'other-owner')
        test.file.createdByUserId = 'synthetic-other-owner';
      await expect(
        test.uploads.download(test.file.id, actor),
      ).rejects.toThrow();
      await expect(
        test.attachable.assertUsableBy(test.tx, test.file.id, actor),
      ).rejects.toThrow();
      expect(test.storage.retrieve).not.toHaveBeenCalled();
      expect(test.publication.guardFile).not.toHaveBeenCalled();
    },
  );
});
