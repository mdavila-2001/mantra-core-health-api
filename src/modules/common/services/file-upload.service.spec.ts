import { jest } from '@jest/globals';
// Alias con tipado laxo: evita el 'never' que @jest/globals infiere para jest.fn() en ESM.
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;
import { FileUploadService } from './file-upload.service';
import { ForbiddenException } from '@nestjs/common';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { FileCategory, FileSensitivity, UploadFileDto } from '../dto';
import type { AuthenticatedUser } from '../../../common';

const actor: AuthenticatedUser = { id: 'user-1', roles: [] };
const dto: UploadFileDto = {
  category: FileCategory.IMAGE,
  sensitivity: FileSensitivity.PHI,
};

/** Archivo de multipart mínimo, con bytes reales. */
function uploadedFile(content = 'carnet') {
  return {
    originalname: 'carnet.jpg',
    mimetype: 'image/jpeg',
    buffer: Buffer.from(content),
  };
}

describe('FileUploadService', () => {
  const logger = { setContext: fn(), info: fn(), warn: fn(), error: fn() };

  /**
   * Construye el sistema bajo prueba con dependencias controladas.
   * @returns Resultado de build.
   */
  function build() {
    const forked = {};
    const em = { fork: fn(() => forked) };
    const storage = { store: fn(), retrieve: fn(), exists: fn(), delete: fn() };
    const filesService = { createFile: fn() };
    const filesRepo = { findById: fn() };
    const fileVersionsRepo = { findById: fn() };
    const service = new FileUploadService(
      em as never,
      storage,
      filesService as never,
      filesRepo as never,
      fileVersionsRepo as never,
      logger as never,
    );
    return { service, storage, filesService, filesRepo, fileVersionsRepo };
  }

  describe('upload', () => {
    it('stores the bytes and registers metadata from the adapter, not the client', async () => {
      const { service, storage, filesService } = build();
      storage.store.mockResolvedValue({
        storageUri: 'file://local/abc',
        sizeBytes: 6,
        contentHash: 'abc',
      });
      filesService.createFile.mockResolvedValue({ id: 'file-1' });

      const result = await service.upload(uploadedFile(), dto, actor);

      expect(storage.store).toHaveBeenCalledWith({
        buffer: expect.any(Buffer),
        originalName: 'carnet.jpg',
        mimeType: 'image/jpeg',
      });
      expect(filesService.createFile).toHaveBeenCalledWith(
        {
          originalName: 'carnet.jpg',
          category: FileCategory.IMAGE,
          sensitivity: FileSensitivity.PHI,
          mimeType: 'image/jpeg',
          sizeBytes: 6,
          contentHash: 'abc',
          storageUri: 'file://local/abc',
        },
        actor,
      );
      expect(result).toEqual({ id: 'file-1' });
    });

    it('rejects an empty upload without touching storage', async () => {
      const { service, storage } = build();

      await expect(
        service.upload(undefined, dto, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(storage.store).not.toHaveBeenCalled();
    });

    it('rejects content larger than the configured maximum', async () => {
      const { service, storage } = build();
      const oversized = {
        originalname: 'big.jpg',
        mimetype: 'image/jpeg',
        // Un byte más que el máximo por defecto (10 MiB).
        buffer: Buffer.alloc(10 * 1024 * 1024 + 1),
      };

      await expect(
        service.upload(oversized, dto, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(storage.store).not.toHaveBeenCalled();
    });
  });

  describe('download', () => {
    /** Archivo vivo con versión vigente en el estado de escaneo indicado. */
    function withVersion(
      { filesRepo, fileVersionsRepo }: ReturnType<typeof build>,
      malwareScanStatusConceptId: string,
    ) {
      filesRepo.findById.mockResolvedValue({
        id: 'file-1',
        currentVersionId: 'ver-1',
        originalName: 'carnet.jpg',
        lifecycleStatusConceptId: CONCEPTS.FILE_ACTIVE,
        createdByUserId: actor.id,
      });
      fileVersionsRepo.findById.mockResolvedValue({
        id: 'ver-1',
        storageUri: 'file://local/abc',
        mimeType: 'image/jpeg',
        malwareScanStatusConceptId,
      });
    }

    it('returns the stored content of the current version', async () => {
      const context = build();
      withVersion(context, CONCEPTS.SCAN_CLEAN);
      context.storage.retrieve.mockResolvedValue(Buffer.from('bytes'));

      const result = await context.service.download('file-1', actor);

      expect(context.storage.retrieve).toHaveBeenCalledWith('file://local/abc');
      expect(result).toEqual({
        buffer: Buffer.from('bytes'),
        mimeType: 'image/jpeg',
        originalName: 'carnet.jpg',
      });
    });

    it('still serves a version whose scan is pending (no antivirus is wired)', async () => {
      const context = build();
      withVersion(context, CONCEPTS.SCAN_PENDING);
      context.storage.retrieve.mockResolvedValue(Buffer.from('bytes'));

      await expect(
        context.service.download('file-1', actor),
      ).resolves.toMatchObject({
        mimeType: 'image/jpeg',
      });
    });

    it('refuses a version known to be infected', async () => {
      const context = build();
      withVersion(context, CONCEPTS.SCAN_INFECTED);

      await expect(
        context.service.download('file-1', actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(context.storage.retrieve).not.toHaveBeenCalled();
    });

    it('refuses a soft-deleted file', async () => {
      const context = build();
      context.filesRepo.findById.mockResolvedValue({
        id: 'file-1',
        currentVersionId: 'ver-1',
        deletedAt: new Date('2026-01-01'),
        lifecycleStatusConceptId: CONCEPTS.FILE_DELETED,
        createdByUserId: actor.id,
      });

      await expect(
        context.service.download('file-1', actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the file does not exist', async () => {
      const context = build();
      context.filesRepo.findById.mockResolvedValue(null);

      await expect(
        context.service.download('file-1', actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('refuses a user who neither uploaded the file nor has a review role', async () => {
      const context = build();
      withVersion(context, CONCEPTS.SCAN_CLEAN);
      const stranger: AuthenticatedUser = { id: 'someone-else', roles: [] };

      await expect(
        context.service.download('file-1', stranger),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(context.storage.retrieve).not.toHaveBeenCalled();
    });

    it('lets a SECURITY_ADMIN download a file uploaded by someone else', async () => {
      const context = build();
      withVersion(context, CONCEPTS.SCAN_CLEAN);
      context.storage.retrieve.mockResolvedValue(Buffer.from('bytes'));
      const reviewer: AuthenticatedUser = {
        id: 'reviewer-1',
        roles: ['SECURITY_ADMIN'],
      };

      await expect(
        context.service.download('file-1', reviewer),
      ).resolves.toMatchObject({ mimeType: 'image/jpeg' });
    });
  });
});
