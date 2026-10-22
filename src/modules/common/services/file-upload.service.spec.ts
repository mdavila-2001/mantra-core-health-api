import { jest } from '@jest/globals';
// Alias con tipado laxo: evita el 'never' que @jest/globals infiere para jest.fn() en ESM.
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;
import { FileUploadService } from './file-upload.service';
import { AttachableFileService } from './attachable-file.service';
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

/** Cabeceras binarias auténticas de cada formato, tal como llegarían del cliente. */
const MAGIC = {
  jpeg: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]),
  png: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  pdf: Buffer.from('%PDF-1.7\n'),
};

/** Archivo de multipart mínimo, con bytes reales. */
function uploadedFile(content: Buffer = MAGIC.jpeg) {
  return {
    originalname: 'carnet.jpg',
    mimetype: 'image/jpeg',
    buffer: content,
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
    const attachableFiles = new AttachableFileService(
      filesRepo as never,
      fileVersionsRepo as never,
      logger as never,
    );
    const service = new FileUploadService(
      em as never,
      storage,
      filesService as never,
      filesRepo as never,
      fileVersionsRepo as never,
      attachableFiles,
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

    it('rejects content that matches no known format, whatever el cliente declare', async () => {
      const { service, storage } = build();
      const disguised = {
        originalname: 'payload.png',
        mimetype: 'image/png',
        buffer: Buffer.from('<script>alert(1)</script>'),
      };

      await expect(
        service.upload(disguised, dto, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(storage.store).not.toHaveBeenCalled();
    });

    it('rejects a real PDF uploaded under the IMAGE category', async () => {
      const { service, storage } = build();
      const pdf = {
        originalname: 'informe.pdf',
        mimetype: 'application/pdf',
        buffer: MAGIC.pdf,
      };

      await expect(service.upload(pdf, dto, actor)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
      expect(storage.store).not.toHaveBeenCalled();
    });

    it('accepts that same PDF under the DOCUMENT category', async () => {
      const { service, storage, filesService } = build();
      storage.store.mockResolvedValue({
        storageUri: 'file://local/pdf',
        sizeBytes: 9,
        contentHash: 'hash',
      });
      filesService.createFile.mockResolvedValue({ id: 'file-2' });

      await service.upload(
        {
          originalname: 'informe.pdf',
          mimetype: 'application/pdf',
          buffer: MAGIC.pdf,
        },
        { ...dto, category: FileCategory.DOCUMENT },
        actor,
      );

      expect(storage.store).toHaveBeenCalledWith(
        expect.objectContaining({ mimeType: 'application/pdf' }),
      );
    });

    it('persists the sniffed type, not the one the client declared', async () => {
      const { service, storage, filesService } = build();
      storage.store.mockResolvedValue({
        storageUri: 'file://local/png',
        sizeBytes: 8,
        contentHash: 'hash',
      });
      filesService.createFile.mockResolvedValue({ id: 'file-3' });

      await service.upload(
        {
          originalname: 'avatar.png',
          // Lo que manda un navegador que no reconoce el formato.
          mimetype: 'application/octet-stream',
          buffer: MAGIC.png,
        },
        dto,
        actor,
      );

      expect(storage.store).toHaveBeenCalledWith(
        expect.objectContaining({ mimeType: 'image/png' }),
      );
      expect(filesService.createFile).toHaveBeenCalledWith(
        expect.objectContaining({ mimeType: 'image/png' }),
        actor,
      );
    });
  });

  describe('uploadAnonymous', () => {
    const policy = {
      allowedMimeTypes: ['application/pdf'] as const,
      operation: 'iam.auth.upload-registration-document',
    };

    it('crea el archivo con actor null: sin dueño hasta que alguien lo reclame', async () => {
      const { service, storage, filesService } = build();
      storage.store.mockResolvedValue({
        storageUri: 'file://local/pdf',
        sizeBytes: 9,
        contentHash: 'hash',
      });
      filesService.createFile.mockResolvedValue({
        id: 'file-anon-1',
        category: FileCategory.DOCUMENT,
      });

      const result = await service.uploadAnonymous(
        {
          originalname: 'escritura.pdf',
          mimetype: 'application/pdf',
          buffer: MAGIC.pdf,
        },
        {
          category: FileCategory.DOCUMENT,
          sensitivity: FileSensitivity.NORMAL,
        },
        policy,
      );

      expect(filesService.createFile).toHaveBeenCalledWith(
        expect.objectContaining({ mimeType: 'application/pdf' }),
        null,
      );
      expect(result).toMatchObject({
        id: 'file-anon-1',
        sizeBytes: 9,
        mimeType: 'application/pdf',
      });
    });

    it('rechaza un archivo que no es PDF, aunque declare serlo', async () => {
      const { service, storage } = build();

      await expect(
        service.uploadAnonymous(
          {
            originalname: 'disfrazado.pdf',
            mimetype: 'application/pdf',
            buffer: MAGIC.png,
          },
          {
            category: FileCategory.DOCUMENT,
            sensitivity: FileSensitivity.NORMAL,
          },
          policy,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(storage.store).not.toHaveBeenCalled();
    });

    it('rechaza contenido vacío', async () => {
      const { service, storage } = build();

      await expect(
        service.uploadAnonymous(
          undefined,
          {
            category: FileCategory.DOCUMENT,
            sensitivity: FileSensitivity.NORMAL,
          },
          policy,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(storage.store).not.toHaveBeenCalled();
    });

    it('rechaza contenido que excede el tamaño máximo', async () => {
      const { service, storage } = build();
      const oversized = {
        originalname: 'grande.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.alloc(10 * 1024 * 1024 + 1),
      };

      await expect(
        service.uploadAnonymous(
          oversized,
          {
            category: FileCategory.DOCUMENT,
            sensitivity: FileSensitivity.NORMAL,
          },
          policy,
        ),
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

    it('sirve bytes tras autorización contextual sin convertir al receptor en dueño', async () => {
      const context = build();
      withVersion(context, CONCEPTS.SCAN_CLEAN);
      context.storage.retrieve.mockResolvedValue(Buffer.from('bytes'));

      await expect(
        context.service.downloadForAuthorizedContext(
          'file-1',
          'community.conversation.attachment',
        ),
      ).resolves.toMatchObject({
        buffer: Buffer.from('bytes'),
        mimeType: 'image/jpeg',
      });
    });
  });

  describe('downloadPublicMedia', () => {
    function publicImage(
      { filesRepo, fileVersionsRepo }: ReturnType<typeof build>,
      sensitivityConceptId: string,
    ) {
      filesRepo.findById.mockResolvedValue({
        id: 'file-public',
        currentVersionId: 'ver-public',
        originalName: 'avatar.jpg',
        categoryConceptId: CONCEPTS.FILE_CATEGORY_IMAGE,
        sensitivityConceptId,
        lifecycleStatusConceptId: CONCEPTS.FILE_ACTIVE,
      });
      fileVersionsRepo.findById.mockResolvedValue({
        id: 'ver-public',
        storageUri: 'file://local/public',
        mimeType: 'image/jpeg',
        malwareScanStatusConceptId: CONCEPTS.SCAN_CLEAN,
      });
    }

    it('preserva una imagen pública NORMAL limpia', async () => {
      const context = build();
      publicImage(context, CONCEPTS.SENSITIVITY_NORMAL);
      context.storage.retrieve.mockResolvedValue(Buffer.from('public-image'));

      await expect(
        context.service.downloadPublicMedia('file-public'),
      ).resolves.toMatchObject({
        buffer: Buffer.from('public-image'),
        mimeType: 'image/jpeg',
      });
    });

    it('no vuelve pública una imagen PHI', async () => {
      const context = build();
      publicImage(context, CONCEPTS.SENSITIVITY_PHI);

      await expect(
        context.service.downloadPublicMedia('file-public'),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(context.storage.retrieve).not.toHaveBeenCalled();
    });
  });
});
