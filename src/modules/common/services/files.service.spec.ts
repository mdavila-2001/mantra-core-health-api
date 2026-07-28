import { jest } from '@jest/globals';
// Alias con tipado laxo: evita el 'never' que @jest/globals infiere para jest.fn() en ESM.
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;
import { FilesService } from './files.service';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import {
  CreateFileDerivativeDto,
  CreateFileDto,
  CreateFileVersionDto,
  DerivativeType,
  FileCategory,
  FileSensitivity,
  ScanResult,
} from '../dto';
import type { AuthenticatedUser } from '../../../common';

/**
 * Crea create em mock.
 * @returns Resultado de create em mock.
 */
function createEmMock() {
  const tx = { flush: fn().mockResolvedValue(undefined) };
  const fork = {};
  const em = {
    transactional: fn((cb: (tx: unknown) => unknown) => cb(tx)),
    fork: fn(() => fork),
  };
  return { em, tx, fork };
}

const actor: AuthenticatedUser = { id: 'user-1', roles: [] };

describe('FilesService', () => {
  const logger = { setContext: fn(), info: fn(), warn: fn(), error: fn() };

  /**
   * Construye el sistema bajo prueba con dependencias controladas.
   * @returns Resultado de build.
   */
  function build() {
    const { em, tx } = createEmMock();
    const filesRepo = { findById: fn(), create: fn() };
    const fileVersionsRepo = {
      findById: fn(),
      findByFileAndId: fn(),
      maxVersionNumber: fn(),
      create: fn(),
    };
    const fileDerivativesRepo = { create: fn() };
    const fileLinksRepo = { create: fn() };
    const service = new FilesService(
      em as never,
      filesRepo,
      fileVersionsRepo,
      fileDerivativesRepo,
      fileLinksRepo,
      logger as never,
    );
    return {
      service,
      em,
      tx,
      filesRepo,
      fileVersionsRepo,
      fileDerivativesRepo,
      fileLinksRepo,
    };
  }

  const createFileDto: CreateFileDto = {
    originalName: 'doc.pdf',
    category: FileCategory.DOCUMENT,
    sensitivity: FileSensitivity.NORMAL,
    mimeType: 'application/pdf',
    sizeBytes: 1024,
    contentHash: 'abc',
    storageUri: 's3://bucket/doc.pdf',
  };

  describe('createFile', () => {
    it('creates a file and its version 1, promoting it as current', async () => {
      const { service, tx, filesRepo, fileVersionsRepo } = build();
      const file: Record<string, unknown> = {
        id: 'file-1',
        originalName: 'doc.pdf',
        lifecycleStatusConceptId: CONCEPTS.FILE_ACTIVE,
        createdAt: new Date(),
      };
      filesRepo.create.mockReturnValue(file);
      fileVersionsRepo.create.mockReturnValue({ id: 'ver-1' });

      const result = await service.createFile(createFileDto, actor);

      expect(filesRepo.create).toHaveBeenCalledTimes(1);
      expect(fileVersionsRepo.create).toHaveBeenCalledTimes(1);
      // Flush del padre, de la versión y de la promoción: tres unidades de trabajo.
      expect(tx.flush).toHaveBeenCalledTimes(3);
      expect(file.currentVersionId).toBe('ver-1');
      expect(result).toMatchObject({ id: 'file-1', currentVersionId: 'ver-1' });
    });
  });

  describe('createVersion', () => {
    const dto: CreateFileVersionDto = {
      mimeType: 'application/pdf',
      sizeBytes: 2048,
      contentHash: 'def',
      storageUri: 's3://bucket/doc-v2.pdf',
    };

    it('throws ResourceNotFoundException when file is missing', async () => {
      const { service, filesRepo } = build();
      filesRepo.findById.mockResolvedValue(null);
      await expect(
        service.createVersion('missing', dto, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('adds the next version and promotes it', async () => {
      const { service, filesRepo, fileVersionsRepo } = build();
      const file: Record<string, unknown> = { id: 'file-1' };
      filesRepo.findById.mockResolvedValue(file);
      fileVersionsRepo.maxVersionNumber.mockResolvedValue(2);
      fileVersionsRepo.create.mockReturnValue({
        id: 'ver-3',
        fileId: 'file-1',
        versionNumber: 3,
        mimeType: dto.mimeType,
        sizeBytes: '2048',
        contentHash: dto.contentHash,
        malwareScanStatusConceptId: CONCEPTS.SCAN_PENDING,
        recordedAt: new Date(),
      });

      const result = await service.createVersion('file-1', dto, actor);

      expect(fileVersionsRepo.create).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ versionNumber: 3 }),
      );
      expect(file.currentVersionId).toBe('ver-3');
      expect(result).toMatchObject({ id: 'ver-3', versionNumber: 3 });
    });
  });

  describe('createDerivative', () => {
    const dto: CreateFileDerivativeDto = {
      derivativeType: DerivativeType.THUMBNAIL,
      storageUri: 's3://bucket/thumb.png',
      mimeType: 'image/png',
      sizeBytes: 512,
      contentHash: 'ghi',
    };

    it('rejects a derivative from a non-clean source version', async () => {
      const { service, fileVersionsRepo } = build();
      fileVersionsRepo.findByFileAndId.mockResolvedValue({
        id: 'ver-1',
        malwareScanStatusConceptId: CONCEPTS.SCAN_PENDING,
      });
      await expect(
        service.createDerivative('file-1', 'ver-1', dto, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('creates a derivative from a clean source version', async () => {
      const { service, fileVersionsRepo, fileDerivativesRepo } = build();
      fileVersionsRepo.findByFileAndId.mockResolvedValue({
        id: 'ver-1',
        malwareScanStatusConceptId: CONCEPTS.SCAN_CLEAN,
      });
      fileVersionsRepo.maxVersionNumber.mockResolvedValue(1);
      fileVersionsRepo.create.mockReturnValue({ id: 'ver-2' });
      fileDerivativesRepo.create.mockReturnValue({
        id: 'der-1',
        sourceFileVersionId: 'ver-1',
        derivativeFileVersionId: 'ver-2',
        createdAt: new Date(),
      });

      const result = await service.createDerivative(
        'file-1',
        'ver-1',
        dto,
        actor,
      );

      expect(fileDerivativesRepo.create).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          sourceFileVersionId: 'ver-1',
          derivativeFileVersionId: 'ver-2',
        }),
      );
      expect(result).toMatchObject({
        id: 'der-1',
        derivativeType: DerivativeType.THUMBNAIL,
      });
    });

    it('throws ResourceNotFoundException when the source version is missing', async () => {
      const { service, fileVersionsRepo } = build();
      fileVersionsRepo.findByFileAndId.mockResolvedValue(null);
      await expect(
        service.createDerivative('file-1', 'missing', dto, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('recordScanResult', () => {
    it('marks a version as infected', async () => {
      const { service, fileVersionsRepo } = build();
      const version = {
        id: 'ver-1',
        malwareScanStatusConceptId: CONCEPTS.SCAN_PENDING,
      };
      fileVersionsRepo.findById.mockResolvedValue(version);

      const result = await service.recordScanResult('ver-1', {
        result: ScanResult.INFECTED,
      });

      expect(version.malwareScanStatusConceptId).toBe(CONCEPTS.SCAN_INFECTED);
      expect(result.malwareScanStatusConceptId).toBe(CONCEPTS.SCAN_INFECTED);
    });

    it('throws ResourceNotFoundException when the version is missing', async () => {
      const { service, fileVersionsRepo } = build();
      fileVersionsRepo.findById.mockResolvedValue(null);
      await expect(
        service.recordScanResult('missing', { result: ScanResult.CLEAN }),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('softDelete', () => {
    it('rejects deletion while under legal hold', async () => {
      const { service, filesRepo } = build();
      filesRepo.findById.mockResolvedValue({
        id: 'file-1',
        legalHoldUntil: new Date(Date.now() + 3600_000),
      });
      await expect(service.softDelete('file-1', actor)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
    });

    it('soft-deletes a file and returns its deletedAt', async () => {
      const { service, filesRepo } = build();
      const file: Record<string, unknown> = {
        id: 'file-1',
        legalHoldUntil: undefined,
      };
      filesRepo.findById.mockResolvedValue(file);

      const result = await service.softDelete('file-1', actor);

      expect(file.lifecycleStatusConceptId).toBe(CONCEPTS.FILE_DELETED);
      expect(result.id).toBe('file-1');
      expect(result.deletedAt).toBeInstanceOf(Date);
    });
  });

  describe('generateDownloadUrl', () => {
    it('returns a signed URL when the current version is clean', async () => {
      const { service, em, filesRepo, fileVersionsRepo } = build();
      filesRepo.findById.mockResolvedValue({
        id: 'file-1',
        currentVersionId: 'ver-1',
        deletedAt: undefined,
        lifecycleStatusConceptId: CONCEPTS.FILE_ACTIVE,
      });
      fileVersionsRepo.findById.mockResolvedValue({
        id: 'ver-1',
        storageUri: 's3://bucket/doc.pdf',
        malwareScanStatusConceptId: CONCEPTS.SCAN_CLEAN,
      });

      const result = await service.generateDownloadUrl('file-1');

      expect(em.fork).toHaveBeenCalled();
      expect(result.url).toContain('fileId=file-1');
      expect(result.url).toContain('signature=');
      expect(result.expiresAt).toBeInstanceOf(Date);
    });

    it('rejects when the current version is not clean', async () => {
      const { service, filesRepo, fileVersionsRepo } = build();
      filesRepo.findById.mockResolvedValue({
        id: 'file-1',
        currentVersionId: 'ver-1',
        deletedAt: undefined,
        lifecycleStatusConceptId: CONCEPTS.FILE_ACTIVE,
      });
      fileVersionsRepo.findById.mockResolvedValue({
        id: 'ver-1',
        storageUri: 's3://bucket/doc.pdf',
        malwareScanStatusConceptId: CONCEPTS.SCAN_PENDING,
      });

      await expect(
        service.generateDownloadUrl('file-1'),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('throws ResourceNotFoundException when the file is missing', async () => {
      const { service, filesRepo } = build();
      filesRepo.findById.mockResolvedValue(null);
      await expect(
        service.generateDownloadUrl('missing'),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });
});
