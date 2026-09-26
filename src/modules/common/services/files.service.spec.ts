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
// H4.S1.M1: casos preexistentes de `listLinkedFiles` que no ejercitan la
// autorización por propiedad usan un actor con rol de revisión, para no
// enredar lo que ya probaban con el chequeo nuevo (N-01).
const reviewer: AuthenticatedUser = { id: 'reviewer-1', roles: ['SECURITY_ADMIN'] };

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
      // 5.2: la lista resuelve versiones en lote. Por defecto no encuentra
      // ninguna, que es lo que ven las pruebas escritas antes de la metadata.
      findByIds: fn(() => Promise.resolve([])),
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
      expect(result.url).toContain('/common/files/file-1/signed-content');
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
        url: expect.stringContaining('/common/files/file-1/signed-content'),
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
          `/common/files/file-1/signed-content?versionId=ver-1&expires=${url.split('expires=')[1]?.split('&')[0]}&signature=${url.split('signature=')[1]}`,
        );
      },
    );
  });

  describe('verifySignedDownload', () => {
    /** Reconstruye la firma real de `generateDownloadUrl` para no repetirla a mano. */
    async function firmar(fileId: string, versionId: string, expires: number) {
      const { createHmac } = await import('node:crypto');
      return createHmac('sha256', 'alovida-dev-download-secret')
        .update(`${fileId}:${versionId}:${expires}`)
        .digest('hex');
    }

    it('acepta una firma válida y no vencida', async () => {
      const { service, filesRepo } = build();
      filesRepo.findById.mockResolvedValue({ id: 'file-1' });
      const expires = Date.now() + 60_000;
      const signature = await firmar('file-1', 'ver-1', expires);

      await expect(
        service.verifySignedDownload('file-1', {
          versionId: 'ver-1',
          expires: String(expires),
          signature,
        }),
      ).resolves.toMatchObject({ id: 'file-1' });
    });

    it('rechaza una firma vencida', async () => {
      const { service, filesRepo } = build();
      filesRepo.findById.mockResolvedValue({ id: 'file-1' });
      const expires = Date.now() - 1_000;
      const signature = await firmar('file-1', 'ver-1', expires);

      await expect(
        service.verifySignedDownload('file-1', {
          versionId: 'ver-1',
          expires: String(expires),
          signature,
        }),
      ).rejects.toThrow('La URL de descarga venció');
    });

    it('rechaza una firma que no corresponde (forjada o de otro archivo/versión)', async () => {
      const { service, filesRepo } = build();
      filesRepo.findById.mockResolvedValue({ id: 'file-1' });
      const expires = Date.now() + 60_000;
      // Firmada para `ver-OTRA`, no para `ver-1`: mismo archivo, otra versión.
      const signature = await firmar('file-1', 'ver-OTRA', expires);

      await expect(
        service.verifySignedDownload('file-1', {
          versionId: 'ver-1',
          expires: String(expires),
          signature,
        }),
      ).rejects.toThrow('Firma de descarga inválida');
    });

    it('rechaza un archivo inexistente antes de mirar la firma', async () => {
      const { service, filesRepo } = build();
      filesRepo.findById.mockResolvedValue(null);

      await expect(
        service.verifySignedDownload('missing', {
          versionId: 'ver-1',
          expires: String(Date.now() + 60_000),
          signature: 'lo-que-sea',
        }),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
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
      }, reviewer);

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
      }, reviewer);

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
      }, reviewer);

      expect(pagina.items[0]!.file.sensitivity).toBe(FileSensitivity.PHI);
      expect(pagina.items[0]!.file.category).toBe(FileCategory.DOCUMENT);
    });

    it('acota siempre por propietario y con tope', async () => {
      const { service, fileLinksRepo } = build();
      fileLinksRepo.findByOwner.mockResolvedValue([]);

      await service.listLinkedFiles({
        ownerType: OwnerType.PATIENT,
        ownerId: 'p-7',
      }, reviewer);

      const [, tipo, owner, tope] = fileLinksRepo.findByOwner.mock.calls[0];
      expect(tipo).toBe(CONCEPTS.OWNER_PATIENT);
      expect(owner).toBe('p-7');
      expect(typeof tope).toBe('number');
    });

    /**
     * 5.2 · AC-5.2-2 — el tipo y el tamaño viajan con cada adjunto.
     *
     * Viven en `common.file_versions`, así que hasta ahora la lista los perdía
     * y la pantalla tenía que bajar los bytes sólo para saber qué eran. Se
     * comprueba también lo que **no** debe viajar: ni la ubicación interna ni
     * el hash, aunque estén en la misma fila de la versión.
     */
    it('5.2: propaga tipo y tamaño de la versión vigente, sin internals de storage', async () => {
      const { service, filesRepo, fileVersionsRepo, fileLinksRepo } = build();
      fileLinksRepo.findByOwner.mockResolvedValue([
        { id: 'l-1', fileId: 'f-1', ownerId: 'p-1', createdAt: new Date() },
      ]);
      filesRepo.findById.mockResolvedValue({
        id: 'f-1',
        currentVersionId: 'v-1',
        originalName: 'análisis.pdf',
        categoryConceptId: CONCEPTS.FILE_CATEGORY_DOCUMENT,
        sensitivityConceptId: CONCEPTS.SENSITIVITY_PHI,
        lifecycleStatusConceptId: CONCEPTS.FILE_ACTIVE,
        createdAt: new Date(),
      });
      fileVersionsRepo.findByIds.mockResolvedValue([
        {
          id: 'v-1',
          fileId: 'f-1',
          mimeType: 'application/pdf',
          sizeBytes: '20480',
          storageUri: 's3://bucket-clinico/pacientes/estudio.pdf',
          objectKey: 'pacientes/estudio.pdf',
          bucketOrContainer: 'bucket-clinico',
          contentHash: '9f2c1ab34d5e6f70',
        },
      ]);

      const pagina = await service.listLinkedFiles({
        ownerType: OwnerType.PATIENT,
        ownerId: 'p-1',
      }, reviewer);

      const archivo = pagina.items[0]!.file;
      expect(archivo).toMatchObject({
        originalName: 'análisis.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 20480,
      });
      // El bigint de la versión llega como número, no como texto.
      expect(typeof archivo.sizeBytes).toBe('number');
      const serializado = JSON.stringify(pagina);
      for (const interno of [
        's3://',
        'bucket-clinico',
        'pacientes/estudio.pdf',
        '9f2c1ab34d5e6f70',
        'storageUri',
        'objectKey',
        'contentHash',
      ]) {
        expect(serializado).not.toContain(interno);
      }
    });

    /**
     * Diez adjuntos no pueden costar diez lecturas de versión. Las versiones
     * vigentes de la página se piden **una sola vez**, todas juntas, y la
     * lectura por id no se usa en este camino.
     */
    it('5.2: resuelve las versiones de toda la página en una sola consulta', async () => {
      const { service, filesRepo, fileVersionsRepo, fileLinksRepo } = build();
      const ids = ['f-1', 'f-2', 'f-3'];
      fileLinksRepo.findByOwner.mockResolvedValue(
        ids.map((fileId, i) => ({
          id: `l-${i}`,
          fileId,
          ownerId: 'p-1',
          createdAt: new Date(),
        })),
      );
      filesRepo.findById.mockImplementation((_em: unknown, id: string) =>
        Promise.resolve({
          id,
          currentVersionId: `v-${id}`,
          categoryConceptId: CONCEPTS.FILE_CATEGORY_IMAGE,
          sensitivityConceptId: CONCEPTS.SENSITIVITY_PHI,
          lifecycleStatusConceptId: CONCEPTS.FILE_ACTIVE,
          createdAt: new Date(),
        }),
      );
      fileVersionsRepo.findByIds.mockImplementation(
        (_em: unknown, pedidos: string[]) =>
          Promise.resolve(
            pedidos.map((vid) => ({
              id: vid,
              fileId: vid.replace(/^v-/, ''),
              mimeType: 'image/png',
              sizeBytes: '10',
            })),
          ),
      );

      const pagina = await service.listLinkedFiles({
        ownerType: OwnerType.PATIENT,
        ownerId: 'p-1',
      }, reviewer);

      expect(fileVersionsRepo.findByIds).toHaveBeenCalledTimes(1);
      expect(fileVersionsRepo.findByIds.mock.calls[0][1]).toEqual([
        'v-f-1',
        'v-f-2',
        'v-f-3',
      ]);
      expect(fileVersionsRepo.findById).not.toHaveBeenCalled();
      expect(pagina.items.map((i) => i.file.mimeType)).toEqual([
        'image/png',
        'image/png',
        'image/png',
      ]);
    });

    /**
     * Metadata opcional: un archivo sin versión vigente, o cuya versión no
     * aparece, sale **sin** tipo ni tamaño. No se inventa un tipo genérico ni
     * un tamaño cero, que la pantalla leería como dato real.
     */
    it('5.2: sin versión vigente resoluble no inventa tipo ni tamaño', async () => {
      const { service, filesRepo, fileVersionsRepo, fileLinksRepo } = build();
      fileLinksRepo.findByOwner.mockResolvedValue([
        { id: 'l-1', fileId: 'f-sin', ownerId: 'p-1', createdAt: new Date() },
        {
          id: 'l-2',
          fileId: 'f-perdida',
          ownerId: 'p-1',
          createdAt: new Date(),
        },
      ]);
      filesRepo.findById.mockImplementation((_em: unknown, id: string) =>
        Promise.resolve({
          id,
          currentVersionId: id === 'f-perdida' ? 'v-que-no-existe' : undefined,
          categoryConceptId: CONCEPTS.FILE_CATEGORY_DOCUMENT,
          sensitivityConceptId: CONCEPTS.SENSITIVITY_PHI,
          lifecycleStatusConceptId: CONCEPTS.FILE_ACTIVE,
          createdAt: new Date(),
        }),
      );
      fileVersionsRepo.findByIds.mockResolvedValue([]);

      const pagina = await service.listLinkedFiles({
        ownerType: OwnerType.PATIENT,
        ownerId: 'p-1',
      }, reviewer);

      for (const item of pagina.items) {
        expect(item.file).not.toHaveProperty('mimeType');
        expect(item.file).not.toHaveProperty('sizeBytes');
      }
      // Sólo se pidió la versión que existía como puntero.
      expect(fileVersionsRepo.findByIds.mock.calls[0][1]).toEqual([
        'v-que-no-existe',
      ]);
    });

    /**
     * Falla cerrado. Si la versión resuelta no es de ese archivo —con datos
     * sanos no ocurre, pero una FK inconsistente existe—, se responde sin
     * metadata antes que con la de otro archivo.
     */
    it('5.2: no usa una versión que pertenece a otro archivo', async () => {
      const { service, filesRepo, fileVersionsRepo, fileLinksRepo } = build();
      fileLinksRepo.findByOwner.mockResolvedValue([
        { id: 'l-1', fileId: 'f-1', ownerId: 'p-1', createdAt: new Date() },
      ]);
      filesRepo.findById.mockResolvedValue({
        id: 'f-1',
        currentVersionId: 'v-ajena',
        categoryConceptId: CONCEPTS.FILE_CATEGORY_IMAGE,
        sensitivityConceptId: CONCEPTS.SENSITIVITY_PHI,
        lifecycleStatusConceptId: CONCEPTS.FILE_ACTIVE,
        createdAt: new Date(),
      });
      fileVersionsRepo.findByIds.mockResolvedValue([
        {
          id: 'v-ajena',
          fileId: 'f-OTRO',
          mimeType: 'text/plain',
          sizeBytes: '99',
        },
      ]);

      const pagina = await service.listLinkedFiles({
        ownerType: OwnerType.PATIENT,
        ownerId: 'p-1',
      }, reviewer);

      expect(pagina.items[0]!.file).not.toHaveProperty('mimeType');
      expect(pagina.items[0]!.file).not.toHaveProperty('sizeBytes');
    });

    it('5.2: una página sin archivos vivos no consulta versiones', async () => {
      const { service, fileVersionsRepo, fileLinksRepo } = build();
      fileLinksRepo.findByOwner.mockResolvedValue([]);

      await service.listLinkedFiles({
        ownerType: OwnerType.PATIENT,
        ownerId: 'p-1',
      }, reviewer);

      // El repositorio cortocircuita con la lista vacía; el servicio igual la
      // entrega vacía y no inventa ids.
      expect(fileVersionsRepo.findByIds.mock.calls[0]?.[1] ?? []).toEqual([]);
    });

    // H4.S1.M1 (N-01): sin actor ni chequeo de propiedad, cualquier sesión
    // autenticada podía listar los adjuntos de cualquier condición o
    // procedimiento cambiando `ownerId`. Estos cuatro casos fijan el contrato
    // nuevo: dueño ve lo suyo, revisor ve todo, ajeno recibe 403 (no una lista
    // vacía, que sería indistinguible de «sin adjuntos»), y un recurso sin
    // adjuntos de verdad sigue devolviendo 200 vacío.
    it('el dueño del archivo ve su propio adjunto', async () => {
      const { service, filesRepo, fileLinksRepo } = build();
      fileLinksRepo.findByOwner.mockResolvedValue([
        { id: 'l-1', fileId: 'f-1', ownerId: 'p-1', createdAt: new Date() },
      ]);
      filesRepo.findById.mockResolvedValue({
        id: 'f-1',
        createdByUserId: actor.id,
        categoryConceptId: CONCEPTS.FILE_CATEGORY_DOCUMENT,
        sensitivityConceptId: CONCEPTS.SENSITIVITY_PHI,
        lifecycleStatusConceptId: CONCEPTS.FILE_ACTIVE,
        createdAt: new Date(),
      });

      const pagina = await service.listLinkedFiles(
        { ownerType: OwnerType.PATIENT, ownerId: 'p-1' },
        actor,
      );

      expect(pagina.count).toBe(1);
    });

    it('un actor sin rol de revisión y ajeno a los archivos recibe 403, no una lista vacía', async () => {
      const { service, filesRepo, fileLinksRepo } = build();
      fileLinksRepo.findByOwner.mockResolvedValue([
        { id: 'l-1', fileId: 'f-ajeno', ownerId: 'p-1', createdAt: new Date() },
      ]);
      filesRepo.findById.mockResolvedValue({
        id: 'f-ajeno',
        createdByUserId: 'otro-usuario',
        categoryConceptId: CONCEPTS.FILE_CATEGORY_DOCUMENT,
        sensitivityConceptId: CONCEPTS.SENSITIVITY_PHI,
        lifecycleStatusConceptId: CONCEPTS.FILE_ACTIVE,
        createdAt: new Date(),
      });

      await expect(
        service.listLinkedFiles(
          { ownerType: OwnerType.PATIENT, ownerId: 'p-1' },
          actor,
        ),
      ).rejects.toThrow('No tiene acceso a los adjuntos de este recurso');
    });

    it('un rol de revisión ve los adjuntos aunque no los haya subido', async () => {
      const { service, filesRepo, fileLinksRepo } = build();
      fileLinksRepo.findByOwner.mockResolvedValue([
        { id: 'l-1', fileId: 'f-ajeno', ownerId: 'p-1', createdAt: new Date() },
      ]);
      filesRepo.findById.mockResolvedValue({
        id: 'f-ajeno',
        createdByUserId: 'otro-usuario',
        categoryConceptId: CONCEPTS.FILE_CATEGORY_DOCUMENT,
        sensitivityConceptId: CONCEPTS.SENSITIVITY_PHI,
        lifecycleStatusConceptId: CONCEPTS.FILE_ACTIVE,
        createdAt: new Date(),
      });

      const pagina = await service.listLinkedFiles(
        { ownerType: OwnerType.PATIENT, ownerId: 'p-1' },
        reviewer,
      );

      expect(pagina.count).toBe(1);
    });

    it('un recurso sin adjuntos responde 200 vacío, no 403', async () => {
      const { service, fileLinksRepo } = build();
      fileLinksRepo.findByOwner.mockResolvedValue([]);

      const pagina = await service.listLinkedFiles(
        { ownerType: OwnerType.PATIENT, ownerId: 'p-sin-adjuntos' },
        actor,
      );

      expect(pagina).toEqual({ items: [], count: 0 });
    });
  });

  /**
   * 5.2 · AC-5.2-2 en el alta: la versión 1 recién creada ya está en mano, así
   * que su tipo y tamaño viajan en la respuesta sin una lectura más.
   */
  describe('createFile · metadata (5.2)', () => {
    it('devuelve tipo y tamaño de la versión recién creada, sin storageUri', async () => {
      const { service, filesRepo, fileVersionsRepo } = build();
      filesRepo.create.mockReturnValue({
        id: 'file-1',
        originalName: 'doc.pdf',
        lifecycleStatusConceptId: CONCEPTS.FILE_ACTIVE,
        createdAt: new Date(),
      });
      fileVersionsRepo.create.mockReturnValue({
        id: 'ver-1',
        fileId: 'file-1',
        mimeType: 'application/pdf',
        sizeBytes: '1024',
        storageUri: 's3://bucket/doc.pdf',
      });

      const result = await service.createFile(createFileDto, actor);

      expect(result).toMatchObject({
        mimeType: 'application/pdf',
        sizeBytes: 1024,
      });
      expect(JSON.stringify(result)).not.toContain('s3://');
      expect(fileVersionsRepo.findByIds).not.toHaveBeenCalled();
      expect(fileVersionsRepo.findById).not.toHaveBeenCalled();
    });
  });
});
