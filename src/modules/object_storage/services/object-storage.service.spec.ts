import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { ObjectStorageService } from './object-storage.service';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import {
  NAMESPACE_ACTIVE,
  OBJECT_LIFECYCLE,
  PLACEMENT_ROLE,
  STORAGE_CLASS,
  UPLOAD_STATUS,
} from '../constants';

const actor = { id: 'user-1', roles: ['SYSTEM'] };
const NAMESPACE = '11111111-1111-1111-1111-111111111111';
const UPLOAD = '22222222-2222-2222-2222-222222222222';
const MANIFEST = '33333333-3333-3333-3333-333333333333';
const VERSION = '44444444-4444-4444-4444-444444444444';
const SHA = 'a'.repeat(64);

function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const storageRepo = {
    findNamespaceByCode: mockFn(),
    findNamespaceById: mockFn(),
    createUpload: mockFn(() => ({ id: UPLOAD })),
    findUploadByProviderId: mockFn(() => Promise.resolve(null)),
    findUploadForUpdate: mockFn(),
    createManifest: mockFn(() => ({ id: MANIFEST })),
    findManifestById: mockFn(),
    findManifestForUpdate: mockFn(),
    findManifestByLogicalIdForUpdate: mockFn(() => Promise.resolve(null)),
    createVersion: mockFn(() => ({ id: VERSION, versionNumber: 1 })),
    findVersionById: mockFn(),
    findLatestVersion: mockFn(() => Promise.resolve(null)),
    findVersionBySha: mockFn(() => Promise.resolve(null)),
    createChecksum: mockFn(() => ({ id: 'checksum-1' })),
    createEncryptionEnvelope: mockFn(() => ({ id: 'envelope-1' })),
    findEncryptionEnvelope: mockFn(),
    createLocation: mockFn(() => ({ id: 'location-1' })),
    findPrimaryLocation: mockFn(),
    createLargePayload: mockFn(() => ({ id: 'payload-1' })),
    findLargePayloadBySource: mockFn(() => Promise.resolve(null)),
  };
  const dicomRepo = { createAccessLog: mockFn(() => ({ id: 'access-1' })) };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new ObjectStorageService(
    em as any,
    storageRepo as any,
    dicomRepo as any,
    logger as any,
  );
  return { service, tx, storageRepo, dicomRepo, logger };
}

function activeNamespace(overrides: Record<string, unknown> = {}): any {
  return {
    id: NAMESPACE,
    code: 'clinical-media',
    state: NAMESPACE_ACTIVE,
    versioningEnabled: true,
    objectLockEnabled: true,
    defaultStorageClass: 'standard',
    ...overrides,
  };
}

function initiatedUpload(overrides: Record<string, unknown> = {}): any {
  return {
    id: UPLOAD,
    namespaceId: NAMESPACE,
    targetObjectKey: 'obj/opaque-key',
    expectedSizeBytes: '1024',
    status: UPLOAD_STATUS.INITIATED,
    ...overrides,
  };
}

const COMPLETE: any = {
  logicalObjectId: 'study/1',
  objectType: 'dicom',
  sha256: SHA,
  receivedSizeBytes: '1024',
  providerVersionId: 'pv-1',
  etag: 'etag-1',
  mimeType: 'application/dicom',
  providerUri: 's3://bucket/obj',
};

describe('ObjectStorageService', () => {
  describe('initiateUpload (UC-60-01)', () => {
    const dto: any = {
      providerUploadId: 'up-1',
      targetObjectKey: 'obj/opaque-key',
      expectedSizeBytes: '1024',
    };

    it('initiates the upload', async () => {
      const d = build();
      d.storageRepo.findNamespaceByCode.mockResolvedValue(activeNamespace());

      const res = await d.service.initiateUpload('clinical-media', dto);

      expect(res).toEqual({
        id: UPLOAD,
        namespaceId: NAMESPACE,
        status: UPLOAD_STATUS.INITIATED,
        duplicate: false,
      });
    });

    it('does not restart the same provider upload', async () => {
      const d = build();
      d.storageRepo.findNamespaceByCode.mockResolvedValue(activeNamespace());
      d.storageRepo.findUploadByProviderId.mockResolvedValue({
        id: 'upload-prev',
        status: UPLOAD_STATUS.INITIATED,
      });

      const res = await d.service.initiateUpload('clinical-media', dto);

      expect(res).toMatchObject({ id: 'upload-prev', duplicate: true });
      expect(d.storageRepo.createUpload).not.toHaveBeenCalled();
    });

    it('refuses an inactive namespace', async () => {
      const d = build();
      d.storageRepo.findNamespaceByCode.mockResolvedValue(
        activeNamespace({ state: 'disabled' }),
      );

      await expect(
        d.service.initiateUpload('clinical-media', dto),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the namespace does not exist', async () => {
      const d = build();
      d.storageRepo.findNamespaceByCode.mockResolvedValue(null);

      await expect(
        d.service.initiateUpload('nope', dto),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('completeUpload (UC-60-02)', () => {
    function wire(d: ReturnType<typeof build>, upload = initiatedUpload()) {
      d.storageRepo.findUploadForUpdate.mockResolvedValue(upload);
      d.storageRepo.findNamespaceById.mockResolvedValue(activeNamespace());
      return upload;
    }

    it('materialises the version with checksum, envelope and location', async () => {
      const d = build();
      const upload = wire(d);

      const res = await d.service.completeUpload(UPLOAD, {
        ...COMPLETE,
        encryption: {
          algorithm: 'AES256',
          keyManagementProvider: 'kms',
          encryptedDataKey: 'cifrada',
          keyVersion: 'v1',
        },
      });

      expect(res).toMatchObject({
        manifestId: MANIFEST,
        versionId: VERSION,
        versionNumber: 1,
        manifestCreated: true,
        duplicate: false,
      });
      expect(upload.status).toBe(UPLOAD_STATUS.COMPLETED);
      expect(d.storageRepo.createChecksum).toHaveBeenCalled();
      expect(d.storageRepo.createEncryptionEnvelope).toHaveBeenCalled();
      expect(d.storageRepo.createLocation).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ placementRole: PLACEMENT_ROLE.PRIMARY }),
      );
    });

    it('refuses a size that does not match what was declared', async () => {
      const d = build();
      wire(d);

      await expect(
        d.service.completeUpload(UPLOAD, {
          ...COMPLETE,
          receivedSizeBytes: '999',
        }),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses an expired upload', async () => {
      const d = build();
      wire(
        d,
        initiatedUpload({ expiresAt: new Date('2020-01-01T00:00:00.000Z') }),
      );

      await expect(
        d.service.completeUpload(UPLOAD, COMPLETE),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses an upload that is no longer in progress', async () => {
      const d = build();
      wire(d, initiatedUpload({ status: UPLOAD_STATUS.COMPLETED }));

      await expect(
        d.service.completeUpload(UPLOAD, COMPLETE),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('does not version identical content twice', async () => {
      const d = build();
      wire(d);
      d.storageRepo.findManifestByLogicalIdForUpdate.mockResolvedValue({
        id: MANIFEST,
        lifecycleState: OBJECT_LIFECYCLE.ACTIVE,
      });
      d.storageRepo.findVersionBySha.mockResolvedValue({
        id: 'version-prev',
        versionNumber: 2,
      });

      const res = await d.service.completeUpload(UPLOAD, COMPLETE);

      expect(res).toMatchObject({ versionId: 'version-prev', duplicate: true });
      expect(d.storageRepo.createVersion).not.toHaveBeenCalled();
    });

    it('fails when the upload does not exist', async () => {
      const d = build();
      d.storageRepo.findUploadForUpdate.mockResolvedValue(null);

      await expect(
        d.service.completeUpload(UPLOAD, COMPLETE),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('createVersion (UC-60-03)', () => {
    const dto: any = {
      sha256: 'b'.repeat(64),
      providerVersionId: 'pv-2',
      objectKey: 'obj/key-2',
      sizeBytes: '2048',
      etag: 'etag-2',
      mimeType: 'application/pdf',
      providerUri: 's3://bucket/obj2',
    };

    function wire(d: ReturnType<typeof build>, namespace = activeNamespace()) {
      d.storageRepo.findManifestForUpdate.mockResolvedValue({
        id: MANIFEST,
        namespaceId: NAMESPACE,
        lifecycleState: OBJECT_LIFECYCLE.ACTIVE,
      });
      d.storageRepo.findNamespaceById.mockResolvedValue(namespace);
    }

    it('chains the new version on top of the previous one', async () => {
      const d = build();
      wire(d);
      d.storageRepo.findLatestVersion.mockResolvedValue({
        id: 'version-prev',
        versionNumber: 4,
      });
      d.storageRepo.createVersion.mockReturnValue({
        id: VERSION,
        versionNumber: 5,
      });

      const res = await d.service.createVersion(MANIFEST, dto);

      expect(res.versionNumber).toBe(5);
      expect(d.storageRepo.createVersion).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ supersedesVersionId: 'version-prev' }),
      );
    });

    it('refuses a namespace without versioning', async () => {
      const d = build();
      wire(d, activeNamespace({ versioningEnabled: false }));

      await expect(
        d.service.createVersion(MANIFEST, dto),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses versioning an object that is not active', async () => {
      const d = build();
      d.storageRepo.findManifestForUpdate.mockResolvedValue({
        id: MANIFEST,
        namespaceId: NAMESPACE,
        lifecycleState: OBJECT_LIFECYCLE.PENDING_DELETION,
      });

      await expect(
        d.service.createVersion(MANIFEST, dto),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the object does not exist', async () => {
      const d = build();
      d.storageRepo.findManifestForUpdate.mockResolvedValue(null);

      await expect(
        d.service.createVersion(MANIFEST, dto),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('registerLargePayload (UC-60-06)', () => {
    const dto: any = {
      objectManifestId: MANIFEST,
      payloadType: 'fhir-export',
      sourceEntityType: 'health_export_jobs',
      sourceEntityId: '55555555-5555-5555-5555-555555555555',
      contentHash: 'hash-1',
      containsPhi: true,
    };

    it('registers the payload', async () => {
      const d = build();
      d.storageRepo.findManifestForUpdate.mockResolvedValue({ id: MANIFEST });

      const res = await d.service.registerLargePayload(dto);

      expect(res).toEqual({
        id: 'payload-1',
        objectManifestId: MANIFEST,
        duplicate: false,
      });
    });

    it('does not register the same source and type twice', async () => {
      const d = build();
      d.storageRepo.findManifestForUpdate.mockResolvedValue({ id: MANIFEST });
      d.storageRepo.findLargePayloadBySource.mockResolvedValue({
        id: 'payload-prev',
        objectManifestId: MANIFEST,
      });

      const res = await d.service.registerLargePayload(dto);

      expect(res).toMatchObject({ id: 'payload-prev', duplicate: true });
      expect(d.storageRepo.createLargePayload).not.toHaveBeenCalled();
    });

    it('fails when the object does not exist', async () => {
      const d = build();
      d.storageRepo.findManifestForUpdate.mockResolvedValue(null);

      await expect(d.service.registerLargePayload(dto)).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
    });
  });

  describe('issueSignedUrl (UC-60-09)', () => {
    const dto: any = { purposeOfUseCode: 'TREATMENT' };

    function wire(
      d: ReturnType<typeof build>,
      manifestOverrides: Record<string, unknown> = {},
      locationOverrides: Record<string, unknown> = {},
    ) {
      d.storageRepo.findVersionById.mockResolvedValue({
        id: VERSION,
        objectManifestId: MANIFEST,
      });
      d.storageRepo.findManifestById.mockResolvedValue({
        id: MANIFEST,
        lifecycleState: OBJECT_LIFECYCLE.ACTIVE,
        ...manifestOverrides,
      });
      d.storageRepo.findPrimaryLocation.mockResolvedValue({
        providerUri: 's3://bucket/obj',
        storageClass: 'standard',
        ...locationOverrides,
      });
    }

    it('issues the access and logs the emission', async () => {
      const d = build();
      wire(d);
      d.storageRepo.findEncryptionEnvelope.mockResolvedValue({
        keyVersion: 'v1',
      });

      const res = await d.service.issueSignedUrl(VERSION, dto, actor);

      expect(res).toMatchObject({
        objectVersionId: VERSION,
        providerUri: 's3://bucket/obj',
        keyVersion: 'v1',
      });
      expect(new Date(res.expiresAt).getTime()).toBeGreaterThan(Date.now());
      // El acceso a datos almacenados siempre queda con nivel de aviso.
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('records the DICOM access when a study is given', async () => {
      const d = build();
      wire(d);

      const res = await d.service.issueSignedUrl(
        VERSION,
        { ...dto, studyInstanceUid: '1.2.3' },
        actor,
      );

      expect(res.accessLogId).toBe('access-1');
      expect(d.dicomRepo.createAccessLog).toHaveBeenCalled();
    });

    it('refuses serving cold storage without rehydration', async () => {
      const d = build();
      wire(d, {}, { storageClass: STORAGE_CLASS.GLACIER });

      await expect(
        d.service.issueSignedUrl(VERSION, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses serving an object pending deletion', async () => {
      const d = build();
      wire(d, { lifecycleState: OBJECT_LIFECYCLE.PENDING_DELETION });

      await expect(
        d.service.issueSignedUrl(VERSION, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses serving a corrupt object', async () => {
      const d = build();
      wire(d, { lifecycleState: OBJECT_LIFECYCLE.CORRUPT });

      await expect(
        d.service.issueSignedUrl(VERSION, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the version has no primary location', async () => {
      const d = build();
      wire(d);
      d.storageRepo.findPrimaryLocation.mockResolvedValue(null);

      await expect(
        d.service.issueSignedUrl(VERSION, dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('fails when the version does not exist', async () => {
      const d = build();
      d.storageRepo.findVersionById.mockResolvedValue(null);

      await expect(
        d.service.issueSignedUrl(VERSION, dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });
});
