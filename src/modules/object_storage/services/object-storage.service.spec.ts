import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { ObjectStorageService } from './object-storage.service';
import { ServiceUnavailableException } from '@nestjs/common';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { ObjectContentUnavailableError } from '../ports';
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
const SHA_V2 = 'b'.repeat(64);

/**
 * Lo que el proveedor tiene guardado de verdad, por clave. Las pruebas de
 * integridad (MCH-021) lo alteran para que los bytes contradigan al cliente.
 */
function storedContents(): Record<
  string,
  { sha256: string; sizeBytes: bigint; providerVersionId?: string }
> {
  return {
    'obj/opaque-key': {
      sha256: SHA,
      sizeBytes: 1024n,
      providerVersionId: 'pv-1',
    },
    'obj/key-2': {
      sha256: SHA_V2,
      sizeBytes: 2048n,
      providerVersionId: 'pv-2',
    },
  };
}

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
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
    findChecksum: mockFn(() =>
      Promise.resolve({
        checksum: SHA,
        source: 'server',
        verificationStatus: 'verified',
      }),
    ),
    createLargePayload: mockFn(() => ({ id: 'payload-1' })),
    findLargePayloadBySource: mockFn(() => Promise.resolve(null)),
  };
  const dicomRepo = { createAccessLog: mockFn(() => ({ id: 'access-1' })) };
  const logger = {
    setContext: mockFn(),
    info: mockFn(),
    warn: mockFn(),
    error: mockFn(),
  };
  const stored = storedContents();
  const reader = {
    stat: mockFn((loc: any) => {
      const obj = stored[loc.key];
      return Promise.resolve(
        obj
          ? {
              sizeBytes: obj.sizeBytes,
              providerVersionId: obj.providerVersionId,
              etag: '"etag-provider"',
            }
          : null,
      );
    }),
    digest: mockFn((loc: any) => {
      const obj = stored[loc.key];
      return Promise.resolve({ sha256: obj.sha256, sizeBytes: obj.sizeBytes });
    }),
    open: mockFn(),
  };
  const service = new ObjectStorageService(
    em as any,
    storageRepo as any,
    dicomRepo as any,
    logger as any,
    undefined,
    reader as any,
  );
  return { service, tx, storageRepo, dicomRepo, logger, reader, stored };
}

/**
 * Ejecuta la operación active namespace.
 *
 * @param overrides - Valor de overrides requerido por la operación.
 * @returns Resultado de active namespace conforme al contrato `any`.
 */
function activeNamespace(overrides: Record<string, unknown> = {}): any {
  return {
    id: NAMESPACE,
    code: 'clinical-media',
    state: NAMESPACE_ACTIVE,
    versioningEnabled: true,
    objectLockEnabled: true,
    defaultStorageClass: 'standard',
    backendCode: 's3',
    bucketOrContainer: 'bucket',
    ...overrides,
  };
}

/**
 * Ejecuta la operación initiated upload.
 *
 * @param overrides - Valor de overrides requerido por la operación.
 * @returns Resultado de initiated upload conforme al contrato `any`.
 */
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
  providerUri: 's3://bucket/obj/opaque-key',
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
    /**
     * Ejecuta la operación wire.
     *
     * @param d - Valor de d requerido por la operación.
     * @param upload - Valor de upload requerido por la operación.
     * @returns Resultado de wire.
     */
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

    // MCH-021: el catálogo no puede publicar lo que el cliente dice de los
    // bytes; tiene que mirarlos.
    describe('integridad física (MCH-021)', () => {
      it('refuses when the stored bytes do not hash to the declared sha', async () => {
        const d = build();
        wire(d);
        d.stored['obj/opaque-key'].sha256 = 'c'.repeat(64);

        await expect(
          d.service.completeUpload(UPLOAD, COMPLETE),
        ).rejects.toBeInstanceOf(PreconditionFailedException);
        expect(d.storageRepo.createVersion).not.toHaveBeenCalled();
        expect(d.storageRepo.createChecksum).not.toHaveBeenCalled();
      });

      it('refuses when the object is not in the provider', async () => {
        const d = build();
        wire(d);
        delete d.stored['obj/opaque-key'];

        await expect(
          d.service.completeUpload(UPLOAD, COMPLETE),
        ).rejects.toBeInstanceOf(PreconditionFailedException);
        expect(d.storageRepo.createVersion).not.toHaveBeenCalled();
      });

      it('refuses when the stored size is smaller than declared', async () => {
        const d = build();
        wire(d);
        d.stored['obj/opaque-key'].sizeBytes = 1000n;

        await expect(
          d.service.completeUpload(UPLOAD, COMPLETE),
        ).rejects.toBeInstanceOf(PreconditionFailedException);
        expect(d.storageRepo.createVersion).not.toHaveBeenCalled();
      });

      it('refuses a provider version other than the declared one', async () => {
        const d = build();
        wire(d);
        d.stored['obj/opaque-key'].providerVersionId = 'pv-otra';

        await expect(
          d.service.completeUpload(UPLOAD, COMPLETE),
        ).rejects.toBeInstanceOf(PreconditionFailedException);
        expect(d.storageRepo.createVersion).not.toHaveBeenCalled();
      });

      it('refuses a provider URI that is not where the upload landed', async () => {
        const d = build();
        wire(d);

        await expect(
          d.service.completeUpload(UPLOAD, {
            ...COMPLETE,
            providerUri: 's3://otro-bucket/otra-clave',
          }),
        ).rejects.toBeInstanceOf(PreconditionFailedException);
        expect(d.storageRepo.createVersion).not.toHaveBeenCalled();
      });

      it('records the checksum as verified by the server, with provider data', async () => {
        const d = build();
        wire(d);

        await d.service.completeUpload(UPLOAD, COMPLETE);

        expect(d.reader.digest).toHaveBeenCalledWith(
          expect.objectContaining({
            backendCode: 's3',
            bucket: 'bucket',
            key: 'obj/opaque-key',
            providerVersionId: 'pv-1',
          }),
          '"etag-provider"',
        );
        expect(d.storageRepo.createChecksum).toHaveBeenCalledWith(
          d.tx,
          expect.objectContaining({
            checksum: SHA,
            source: 'server',
            verificationStatus: 'verified',
          }),
        );
        expect(d.storageRepo.createVersion).toHaveBeenCalledWith(
          d.tx,
          expect.objectContaining({ etag: '"etag-provider"' }),
        );
      });

      it('does not complete when the provider cannot be read', async () => {
        const d = build();
        wire(d);
        d.reader.stat.mockRejectedValue(
          new ObjectContentUnavailableError('PROVIDER_ERROR'),
        );

        await expect(
          d.service.completeUpload(UPLOAD, COMPLETE),
        ).rejects.toBeInstanceOf(ServiceUnavailableException);
        expect(d.storageRepo.createVersion).not.toHaveBeenCalled();
      });
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
      sha256: SHA_V2,
      providerVersionId: 'pv-2',
      objectKey: 'obj/key-2',
      sizeBytes: '2048',
      etag: 'etag-2',
      mimeType: 'application/pdf',
      providerUri: 's3://bucket/obj/key-2',
    };

    /**
     * Ejecuta la operación wire.
     *
     * @param d - Valor de d requerido por la operación.
     * @param namespace - Valor de namespace requerido por la operación.
     * @returns Resultado de wire.
     */
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

    it('refuses a version whose bytes do not match the declared sha (MCH-021)', async () => {
      const d = build();
      wire(d);
      d.stored['obj/key-2'].sha256 = 'c'.repeat(64);

      await expect(
        d.service.createVersion(MANIFEST, dto),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.storageRepo.createVersion).not.toHaveBeenCalled();
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

    /**
     * Ejecuta la operación wire.
     *
     * @param d - Valor de d requerido por la operación.
     * @param manifestOverrides - Valor de manifest overrides requerido por la operación.
     * @param locationOverrides - Valor de location overrides requerido por la operación.
     * @returns Resultado de wire.
     */
    function wire(
      d: ReturnType<typeof build>,
      manifestOverrides: Record<string, unknown> = {},
      locationOverrides: Record<string, unknown> = {},
    ) {
      d.storageRepo.findVersionById.mockResolvedValue({
        id: VERSION,
        objectManifestId: MANIFEST,
        sha256: SHA,
        objectKey: 'obj/opaque-key',
        providerVersionId: 'pv-1',
        mimeType: 'application/dicom',
        sizeBytes: '1024',
      });
      d.storageRepo.findManifestById.mockResolvedValue({
        id: MANIFEST,
        lifecycleState: OBJECT_LIFECYCLE.ACTIVE,
        ...manifestOverrides,
      });
      d.storageRepo.findPrimaryLocation.mockResolvedValue({
        providerUri: 's3://bucket/obj',
        storageClass: 'standard',
        namespaceId: NAMESPACE,
        ...locationOverrides,
      });
      d.storageRepo.findNamespaceById.mockResolvedValue(activeNamespace());
    }

    /** Emite y devuelve el token que viaja en la URL. */
    async function emitir(d: ReturnType<typeof build>, body: any = dto) {
      const res: any = await d.service.issueSignedUrl(VERSION, body, actor);
      const token = String(res.url).split('/').pop() as string;
      return { res, token };
    }

    // MCH-009: el enlace tiene que ser un acceso temporal de verdad, no la URI
    // interna con una fecha decorativa al lado.
    describe('acceso temporal real (MCH-009)', () => {
      afterEach(() => jest.restoreAllMocks());

      it('returns a signed link to the proxy and never the provider URI', async () => {
        const d = build();
        wire(d);

        const { res, token } = await emitir(d);

        expect(res.providerUri).toBeUndefined();
        expect(JSON.stringify(res)).not.toContain('s3://');
        expect(res.method).toBe('GET');
        expect(res.url).toBe(
          `/object-storage/versions/${VERSION}/content/${token}`,
        );
        expect(token.split('.')).toHaveLength(2);
      });

      it('caps the lifetime the client asks for', async () => {
        const d = build();
        wire(d);
        const antes = Date.now();

        const { res } = await emitir(d, { ...dto, expiresInSeconds: 86400 });

        expect(new Date(res.expiresAt).getTime()).toBeLessThanOrEqual(
          antes + 900 * 1000 + 1000,
        );
      });

      it('serves the bytes of the signed version through the proxy', async () => {
        const d = build();
        wire(d);
        const body = { pipe: mockFn() };
        d.reader.open.mockResolvedValue({ body, contentLength: 1024 });
        const { token } = await emitir(d);

        const content: any = await (d.service as any).redeemSignedAccess(
          VERSION,
          token,
          actor,
        );

        expect(content.body).toBe(body);
        expect(content.mimeType).toBe('application/dicom');
        expect(d.reader.open).toHaveBeenCalledWith(
          expect.objectContaining({
            bucket: 'bucket',
            key: 'obj/opaque-key',
            providerVersionId: 'pv-1',
          }),
        );
      });

      it('rejects the link once it expired', async () => {
        const d = build();
        wire(d);
        const { res, token } = await emitir(d);
        const vence = new Date(res.expiresAt).getTime();
        jest.spyOn(Date, 'now').mockReturnValue(vence + 1000);

        await expect(
          (d.service as any).redeemSignedAccess(VERSION, token, actor),
        ).rejects.toBeInstanceOf(ResourceNotFoundException);
        expect(d.reader.open).not.toHaveBeenCalled();
      });

      it('rejects the link for another version', async () => {
        const d = build();
        wire(d);
        const { token } = await emitir(d);

        await expect(
          (d.service as any).redeemSignedAccess(
            '55555555-5555-5555-5555-555555555555',
            token,
            actor,
          ),
        ).rejects.toBeInstanceOf(ResourceNotFoundException);
        expect(d.reader.open).not.toHaveBeenCalled();
      });

      it('rejects a tampered signature or payload', async () => {
        const d = build();
        wire(d);
        const { token } = await emitir(d);
        const [payload, firma] = token.split('.');
        const otraFirma = `${payload}.${firma.slice(0, -2)}${firma.endsWith('AA') ? 'BB' : 'AA'}`;
        const claims = JSON.parse(
          Buffer.from(payload, 'base64url').toString('utf8'),
        );
        const otroPayload = `${Buffer.from(
          JSON.stringify({ ...claims, exp: claims.exp + 3600 }),
        ).toString('base64url')}.${firma}`;

        for (const falso of [otraFirma, otroPayload, 'basura', '']) {
          await expect(
            (d.service as any).redeemSignedAccess(VERSION, falso, actor),
          ).rejects.toBeInstanceOf(ResourceNotFoundException);
        }
        expect(d.reader.open).not.toHaveBeenCalled();
      });

      it('rejects the link when redeemed by someone else', async () => {
        const d = build();
        wire(d);
        const { token } = await emitir(d);

        await expect(
          (d.service as any).redeemSignedAccess(VERSION, token, {
            id: 'user-2',
            roles: ['SYSTEM'],
          }),
        ).rejects.toBeInstanceOf(ResourceNotFoundException);
      });

      it('re-checks the object on redemption: pending deletion is not served', async () => {
        const d = build();
        wire(d);
        const { token } = await emitir(d);
        d.storageRepo.findManifestById.mockResolvedValue({
          id: MANIFEST,
          lifecycleState: OBJECT_LIFECYCLE.PENDING_DELETION,
        });

        await expect(
          (d.service as any).redeemSignedAccess(VERSION, token, actor),
        ).rejects.toBeInstanceOf(PreconditionFailedException);
        expect(d.reader.open).not.toHaveBeenCalled();
      });

      it('fails closed when the provider is down, without falling back to the URI', async () => {
        const d = build();
        wire(d);
        d.reader.open.mockRejectedValue(
          new ObjectContentUnavailableError('PROVIDER_ERROR'),
        );
        const { token } = await emitir(d);

        await expect(
          (d.service as any).redeemSignedAccess(VERSION, token, actor),
        ).rejects.toBeInstanceOf(ServiceUnavailableException);
      });
    });

    it('issues the access and logs the emission', async () => {
      const d = build();
      wire(d);
      d.storageRepo.findEncryptionEnvelope.mockResolvedValue({
        keyVersion: 'v1',
      });

      const res = await d.service.issueSignedUrl(VERSION, dto, actor);

      // MCH-009: ya no devuelve la URI del proveedor sino el enlace firmado.
      expect(res).toMatchObject({
        objectVersionId: VERSION,
        method: 'GET',
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

    it('refuses a version whose checksum was only declared by the client (MCH-021)', async () => {
      const d = build();
      wire(d);
      d.storageRepo.findChecksum.mockResolvedValue({
        checksum: SHA,
        source: 'client',
        verificationStatus: 'verified',
      });

      await expect(
        d.service.issueSignedUrl(VERSION, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses a version without any checksum (MCH-021)', async () => {
      const d = build();
      wire(d);
      d.storageRepo.findChecksum.mockResolvedValue(null);

      await expect(
        d.service.issueSignedUrl(VERSION, dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
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
