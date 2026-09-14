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
  OwnerType,
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
      findPendingScan: fn(() => Promise.resolve([])),
      create: fn(),
    };
    const fileDerivativesRepo = { create: fn() };
    const fileLinksRepo = { create: fn(), findByOwner: fn() };
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

    it('con actor null deja createdByUserId/recordedByUserId sin declarar (pre-carga anónima)', async () => {
      const { service, filesRepo, fileVersionsRepo } = build();
      filesRepo.create.mockReturnValue({
        id: 'file-anon',
        lifecycleStatusConceptId: CONCEPTS.FILE_ACTIVE,
        createdAt: new Date(),
      });
      fileVersionsRepo.create.mockReturnValue({ id: 'ver-1' });

      await service.createFile(createFileDto, null);

      expect(filesRepo.create).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ actorUserId: undefined }),
      );
      expect(fileVersionsRepo.create).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ recordedByUserId: undefined }),
      );
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
        createdByUserId: actor.id,
        currentVersionId: 'ver-1',
        deletedAt: undefined,
        lifecycleStatusConceptId: CONCEPTS.FILE_ACTIVE,
      });
      fileVersionsRepo.findById.mockResolvedValue({
        id: 'ver-1',
        storageUri: 's3://bucket/doc.pdf',
        malwareScanStatusConceptId: CONCEPTS.SCAN_CLEAN,
      });

      const result = await service.generateDownloadUrl('file-1', actor);

      expect(em.fork).toHaveBeenCalled();
      expect(result.url).toContain('/common/files/file-1/content');
      expect(result.url).not.toContain('s3://bucket');
      expect(result.url).toContain('signature=');
      expect(result.expiresAt).toBeInstanceOf(Date);
    });

    it('rejects when the current version is not clean', async () => {
      const { service, filesRepo, fileVersionsRepo } = build();
      filesRepo.findById.mockResolvedValue({
        id: 'file-1',
        createdByUserId: actor.id,
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
        service.generateDownloadUrl('file-1', actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('throws ResourceNotFoundException when the file is missing', async () => {
      const { service, filesRepo } = build();
      filesRepo.findById.mockResolvedValue(null);
      await expect(
        service.generateDownloadUrl('missing', actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('no emite URL para un actor que sólo conoce el UUID', async () => {
      const { service, filesRepo } = build();
      filesRepo.findById.mockResolvedValue({
        id: 'file-1',
        createdByUserId: 'otro',
        currentVersionId: 'ver-1',
        lifecycleStatusConceptId: CONCEPTS.FILE_ACTIVE,
      });

      await expect(
        service.generateDownloadUrl('file-1', actor),
      ).rejects.toThrow('No tiene acceso a este archivo');
    });

    it('preserva la descarga de un revisor de evidencia ajena', async () => {
      const { service, filesRepo, fileVersionsRepo } = build();
      filesRepo.findById.mockResolvedValue({
        id: 'file-1',
        createdByUserId: 'otro',
        currentVersionId: 'ver-1',
        lifecycleStatusConceptId: CONCEPTS.FILE_ACTIVE,
      });
      fileVersionsRepo.findById.mockResolvedValue({
        id: 'ver-1',
        storageUri: 's3://bucket/identity.pdf',
        malwareScanStatusConceptId: CONCEPTS.SCAN_CLEAN,
      });

      await expect(
        service.generateDownloadUrl('file-1', {
          id: 'reviewer-1',
          roles: ['SECURITY_ADMIN'],
        }),
      ).resolves.toMatchObject({
        url: expect.stringContaining('/common/files/file-1/content'),
      });
    });

    /**
     * 5.1 · la URL no puede publicar dónde viven los bytes.
     *
     * El modelo lo prohíbe explícitamente («`storage_uri` es una URI interna
     * estable, no una URL pública ni firmada», nota `FILE_SECURITY` de
     * `diagram_02_common.puml`) y la versión anterior la incrustaba entera. Se
     * prueban las dos formas que emite el sistema, porque cada adaptador filtra
     * una cosa distinta: S3 el **bucket y la clave del objeto**, el disco local
     * el **hash del contenido**.
     */
    it.each([
      ['s3', 's3://bucket-clinico/pacientes/2026/estudio-ana.pdf'],
      [
        'disco local',
        'file://local/9f2c1ab34d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8',
      ],
    ])(
      'la URL no revela la ubicación interna del adaptador %s',
      async (_adaptador, storageUri) => {
        const { service, filesRepo, fileVersionsRepo } = build();
        filesRepo.findById.mockResolvedValue({
          id: 'file-1',
          createdByUserId: actor.id,
          currentVersionId: 'ver-1',
          deletedAt: undefined,
          lifecycleStatusConceptId: CONCEPTS.FILE_ACTIVE,
        });
        fileVersionsRepo.findById.mockResolvedValue({
          id: 'ver-1',
          storageUri,
          malwareScanStatusConceptId: CONCEPTS.SCAN_CLEAN,
        });

        const { url } = await service.generateDownloadUrl('file-1', actor);

        expect(url).not.toContain(storageUri);
        expect(url).not.toContain('s3://');
        expect(url).not.toContain('file://');
        expect(url).not.toContain('bucket-clinico');
        expect(url).not.toContain('estudio-ana.pdf');
        expect(url).not.toContain('9f2c1ab3');
        // Lo que sí debe llevar: el recurso de la propia API y la firma.
        expect(url).toBe(
          `/common/files/file-1/content?versionId=ver-1&expires=${url.split('expires=')[1]?.split('&')[0]}&signature=${url.split('signature=')[1]}`,
        );
      },
    );
  });
  describe('listLinkedFiles', () => {
    /**
     * El vínculo sobrevive al archivo: `softDelete` es lógico y no toca
     * `file_links`. Sin este filtro la ficha seguiría ofreciendo adjuntos que
     * ya no se pueden descargar — un enlace que lleva a un 404 es peor que no
     * mostrarlo.
     */
    it('omite los archivos borrados lógicamente y los que ya no existen', async () => {
      const { service, filesRepo, fileLinksRepo } = build();
      fileLinksRepo.findByOwner.mockResolvedValue([
        { id: 'l-1', fileId: 'f-vivo', ownerId: 'p-1', createdAt: new Date() },
        {
          id: 'l-2',
          fileId: 'f-borrado',
          ownerId: 'p-1',
          createdAt: new Date(),
        },
        {
          id: 'l-3',
          fileId: 'f-fantasma',
          ownerId: 'p-1',
          createdAt: new Date(),
        },
      ]);
      filesRepo.findById.mockImplementation((_em: unknown, id: string) => {
        if (id === 'f-vivo') {
          return Promise.resolve({
            id: 'f-vivo',
            originalName: 'radiografia.jpg',
            categoryConceptId: CONCEPTS.FILE_CATEGORY_IMAGE,
            sensitivityConceptId: CONCEPTS.SENSITIVITY_PHI,
            lifecycleStatusConceptId: CONCEPTS.FILE_ACTIVE,
            createdAt: new Date(),
          });
        }
        if (id === 'f-borrado') {
          return Promise.resolve({
            id: 'f-borrado',
            deletedAt: new Date(),
            categoryConceptId: CONCEPTS.FILE_CATEGORY_DOCUMENT,
            sensitivityConceptId: CONCEPTS.SENSITIVITY_NORMAL,
            lifecycleStatusConceptId: CONCEPTS.FILE_DELETED,
            createdAt: new Date(),
          });
        }
        return Promise.resolve(null);
      });

      const pagina = await service.listLinkedFiles({
        ownerType: OwnerType.PATIENT,
        ownerId: 'p-1',
      });

      expect(pagina.count).toBe(1);
      expect(pagina.items[0]!.file.id).toBe('f-vivo');
      expect(pagina.items[0]!.linkId).toBe('l-1');
    });

    /**
     * La categoría y la sensibilidad se guardan como uuid de concepto; el
     * camino de vuelta no existía porque hasta ahora siempre venían en el
     * cuerpo de la petición.
     */
    it('traduce los conceptos de vuelta a los valores del contrato', async () => {
      const { service, filesRepo, fileLinksRepo } = build();
      fileLinksRepo.findByOwner.mockResolvedValue([
        { id: 'l-1', fileId: 'f-1', ownerId: 'p-1', createdAt: new Date() },
      ]);
      filesRepo.findById.mockResolvedValue({
        id: 'f-1',
        categoryConceptId: CONCEPTS.FILE_CATEGORY_IMAGE,
        sensitivityConceptId: CONCEPTS.SENSITIVITY_PHI,
        lifecycleStatusConceptId: CONCEPTS.FILE_ACTIVE,
        createdAt: new Date(),
      });

      const pagina = await service.listLinkedFiles({
        ownerType: OwnerType.PATIENT,
        ownerId: 'p-1',
      });

      expect(pagina.items[0]!.file.category).toBe(FileCategory.IMAGE);
      expect(pagina.items[0]!.file.sensitivity).toBe(FileSensitivity.PHI);
      expect(pagina.items[0]!.ownerType).toBe(OwnerType.PATIENT);
    });

    /**
     * Un concepto que no case cae en PHI, no en NORMAL. Entre ocultar de más y
     * mostrar de menos, acá se elige ocultar: es dato clínico.
     */
    it('un concepto de sensibilidad desconocido se trata como PHI', async () => {
      const { service, filesRepo, fileLinksRepo } = build();
      fileLinksRepo.findByOwner.mockResolvedValue([
        { id: 'l-1', fileId: 'f-1', ownerId: 'p-1', createdAt: new Date() },
      ]);
      filesRepo.findById.mockResolvedValue({
        id: 'f-1',
        categoryConceptId: 'concepto-que-nadie-declaro',
        sensitivityConceptId: 'concepto-que-nadie-declaro',
        lifecycleStatusConceptId: CONCEPTS.FILE_ACTIVE,
        createdAt: new Date(),
      });

      const pagina = await service.listLinkedFiles({
        ownerType: OwnerType.PATIENT,
        ownerId: 'p-1',
      });

      expect(pagina.items[0]!.file.sensitivity).toBe(FileSensitivity.PHI);
      expect(pagina.items[0]!.file.category).toBe(FileCategory.DOCUMENT);
    });

    it('acota siempre por propietario y con tope', async () => {
      const { service, fileLinksRepo } = build();
      fileLinksRepo.findByOwner.mockResolvedValue([]);

      await service.listLinkedFiles({
        ownerType: OwnerType.PATIENT,
        ownerId: 'p-7',
      });

      const [, tipo, owner, tope] = fileLinksRepo.findByOwner.mock.calls[0];
      expect(tipo).toBe(CONCEPTS.OWNER_PATIENT);
      expect(owner).toBe('p-7');
      expect(typeof tope).toBe('number');
    });
  });
});
