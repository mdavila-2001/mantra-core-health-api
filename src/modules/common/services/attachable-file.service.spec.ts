import { jest } from '@jest/globals';

// Loose-typed mock factory: runtime 'jest' pero sin los tipos estrictos Mock<never>.
/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ForbiddenException } from '@nestjs/common';
import { AttachableFileService } from './attachable-file.service';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
  SEED,
} from '../../../common';

const actor = { id: 'u-1', roles: [] } as any;
const em = {} as any;

/**
 * Construye el sistema bajo prueba con un archivo propio, vivo y utilizable.
 *
 * El caso feliz es el estado por defecto: cada prueba negativa cambia una sola
 * pieza, así lo que la hace fallar queda a la vista.
 *
 * @returns Resultado de build.
 */
function build() {
  const filesRepo = {
    findById: mockFn(() =>
      Promise.resolve({
        id: 'f1',
        createdByUserId: actor.id,
        currentVersionId: 'v1',
        lifecycleStatusConceptId: CONCEPTS.FILE_ACTIVE,
      }),
    ),
  };
  const fileVersionsRepo = {
    findById: mockFn(() =>
      Promise.resolve({
        id: 'v1',
        mimeType: 'image/png',
        malwareScanStatusConceptId: CONCEPTS.SCAN_PENDING,
      }),
    ),
  };
  const logger = { setContext: mockFn(), warn: mockFn(), info: mockFn() };
  const service = new AttachableFileService(
    filesRepo as any,
    fileVersionsRepo as any,
    logger as any,
  );
  return { service, filesRepo, fileVersionsRepo, logger };
}

describe('AttachableFileService', () => {
  it('returns the file and its current version when everything checks out', async () => {
    const d = build();

    const { file, version } = await d.service.assertUsableBy(em, 'f1', actor);

    expect(file.id).toBe('f1');
    expect(version.id).toBe('v1');
  });

  it('accepts a file whose scan has not run yet', async () => {
    // En este despliegue no hay antivirus cableado: exigir SCAN_CLEAN dejaría
    // inservible toda la media. Lo pendiente pasa; lo infectado no.
    const d = build();

    await expect(
      d.service.assertUsableBy(em, 'f1', actor),
    ).resolves.toBeDefined();
  });

  it('refuses a file that does not exist', async () => {
    const d = build();
    d.filesRepo.findById.mockResolvedValue(null);

    await expect(
      d.service.assertUsableBy(em, 'fantasma', actor),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('refuses a file uploaded by someone else and leaves a trace', async () => {
    const d = build();
    d.filesRepo.findById.mockResolvedValue({
      id: 'f1',
      createdByUserId: 'otro-usuario',
      currentVersionId: 'v1',
      lifecycleStatusConceptId: CONCEPTS.FILE_ACTIVE,
    });

    await expect(
      d.service.assertUsableBy(em, 'f1', actor, { operation: 'prueba' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    // Que el rechazo quede registrado importa: enumerar uuids ajenos es
    // exactamente la señal que alguien tiene que poder ver después.
    expect(d.logger.warn).toHaveBeenCalled();
  });

  it('refuses a soft-deleted file', async () => {
    const d = build();
    d.filesRepo.findById.mockResolvedValue({
      id: 'f1',
      createdByUserId: actor.id,
      currentVersionId: 'v1',
      deletedAt: new Date('2026-01-01'),
      lifecycleStatusConceptId: CONCEPTS.FILE_DELETED,
    });

    await expect(
      d.service.assertUsableBy(em, 'f1', actor),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('refuses a file without a current version', async () => {
    const d = build();
    d.filesRepo.findById.mockResolvedValue({
      id: 'f1',
      createdByUserId: actor.id,
      lifecycleStatusConceptId: CONCEPTS.FILE_ACTIVE,
    });

    await expect(
      d.service.assertUsableBy(em, 'f1', actor),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('refuses a file whose current version row is missing', async () => {
    // La FK apunta a una versión que ya no está: sin este caso, `version` sería
    // `null` y el resto de la comprobación se saltaría en silencio.
    const d = build();
    d.fileVersionsRepo.findById.mockResolvedValue(null);

    await expect(
      d.service.assertUsableBy(em, 'f1', actor),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('refuses a file whose current version is infected', async () => {
    const d = build();
    d.fileVersionsRepo.findById.mockResolvedValue({
      id: 'v1',
      mimeType: 'image/png',
      malwareScanStatusConceptId: CONCEPTS.SCAN_INFECTED,
    });

    await expect(
      d.service.assertUsableBy(em, 'f1', actor),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('refuses a type the caller does not admit for this use', async () => {
    const d = build();
    d.fileVersionsRepo.findById.mockResolvedValue({
      id: 'v1',
      mimeType: 'application/pdf',
      malwareScanStatusConceptId: CONCEPTS.SCAN_PENDING,
    });

    await expect(
      d.service.assertUsableBy(em, 'f1', actor, {
        allowedMimeTypes: ['image/png', 'image/jpeg'],
      }),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('admits a type the caller does allow', async () => {
    const d = build();

    await expect(
      d.service.assertUsableBy(em, 'f1', actor, {
        allowedMimeTypes: ['image/png'],
      }),
    ).resolves.toBeDefined();
  });

  it('names the file the way the caller asked', async () => {
    // El mensaje es parte del contrato con quien llama: la publicación habla de
    // «el archivo adjunto» y el perfil, de su foto.
    const d = build();
    d.filesRepo.findById.mockResolvedValue({
      id: 'f1',
      createdByUserId: 'otro-usuario',
      currentVersionId: 'v1',
      lifecycleStatusConceptId: CONCEPTS.FILE_ACTIVE,
    });

    await expect(
      d.service.assertUsableBy(
        em,
        'f1',
        actor,
        {},
        { subject: 'El archivo de la foto', notFound: 'No existe esa foto' },
      ),
    ).rejects.toThrow('El archivo de la foto no le pertenece');
  });
});

describe('AttachableFileService.claimAnonymousUpload', () => {
  const claim = { tenantId: 'tenant-1', ownerUserId: 'owner-1' };

  /** Un archivo anónimo, en el tenant DEFAULT, con versión PDF vigente y sin escanear. */
  function buildAnonymousUpload() {
    const filesRepo = {
      findById: mockFn(() =>
        Promise.resolve({
          id: 'f1',
          tenantId: SEED.tenantId,
          createdByUserId: null, // MikroORM hidrata así una FK nullable sin valor
          categoryConceptId: CONCEPTS.FILE_CATEGORY_DOCUMENT,
          currentVersionId: 'v1',
          lifecycleStatusConceptId: CONCEPTS.FILE_ACTIVE,
        }),
      ),
    };
    const fileVersionsRepo = {
      findById: mockFn(() =>
        Promise.resolve({
          id: 'v1',
          mimeType: 'application/pdf',
          malwareScanStatusConceptId: CONCEPTS.SCAN_PENDING,
        }),
      ),
    };
    const logger = { setContext: mockFn(), warn: mockFn(), info: mockFn() };
    const service = new AttachableFileService(
      filesRepo as any,
      fileVersionsRepo as any,
      logger as any,
    );
    return { service, filesRepo, fileVersionsRepo, logger };
  }

  it('reclama un archivo anónimo válido y le asigna tenant y dueño', async () => {
    const d = buildAnonymousUpload();

    const { file } = await d.service.claimAnonymousUpload(em, 'f1', claim, {
      allowedMimeTypes: ['application/pdf'],
    });

    expect(file.tenantId).toBe('tenant-1');
    expect(file.createdByUserId).toBe('owner-1');
    expect(file.updatedByUserId).toBe('owner-1');
  });

  it('rechaza un archivo inexistente', async () => {
    const d = buildAnonymousUpload();
    d.filesRepo.findById.mockResolvedValue(null);

    await expect(
      d.service.claimAnonymousUpload(em, 'fantasma', claim),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('rechaza un archivo que ya tiene dueño', async () => {
    const d = buildAnonymousUpload();
    d.filesRepo.findById.mockResolvedValue({
      id: 'f1',
      tenantId: SEED.tenantId,
      createdByUserId: 'alguien-ya-lo-reclamó',
      categoryConceptId: CONCEPTS.FILE_CATEGORY_DOCUMENT,
      currentVersionId: 'v1',
      lifecycleStatusConceptId: CONCEPTS.FILE_ACTIVE,
    });

    await expect(
      d.service.claimAnonymousUpload(em, 'f1', claim),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('rechaza un archivo que ya no está en el tenant DEFAULT', async () => {
    const d = buildAnonymousUpload();
    d.filesRepo.findById.mockResolvedValue({
      id: 'f1',
      tenantId: 'otro-tenant',
      createdByUserId: null, // MikroORM hidrata así una FK nullable sin valor
      categoryConceptId: CONCEPTS.FILE_CATEGORY_DOCUMENT,
      currentVersionId: 'v1',
      lifecycleStatusConceptId: CONCEPTS.FILE_ACTIVE,
    });

    await expect(
      d.service.claimAnonymousUpload(em, 'f1', claim),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('rechaza una categoría distinta de la exigida', async () => {
    const d = buildAnonymousUpload();
    d.filesRepo.findById.mockResolvedValue({
      id: 'f1',
      tenantId: SEED.tenantId,
      createdByUserId: null, // MikroORM hidrata así una FK nullable sin valor
      categoryConceptId: CONCEPTS.FILE_CATEGORY_IMAGE,
      currentVersionId: 'v1',
      lifecycleStatusConceptId: CONCEPTS.FILE_ACTIVE,
    });

    await expect(
      d.service.claimAnonymousUpload(em, 'f1', claim, {
        allowedCategoryConceptId: CONCEPTS.FILE_CATEGORY_DOCUMENT,
      }),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('rechaza un archivo borrado', async () => {
    const d = buildAnonymousUpload();
    d.filesRepo.findById.mockResolvedValue({
      id: 'f1',
      tenantId: SEED.tenantId,
      createdByUserId: null, // MikroORM hidrata así una FK nullable sin valor
      categoryConceptId: CONCEPTS.FILE_CATEGORY_DOCUMENT,
      currentVersionId: 'v1',
      deletedAt: new Date('2026-01-01'),
      lifecycleStatusConceptId: CONCEPTS.FILE_DELETED,
    });

    await expect(
      d.service.claimAnonymousUpload(em, 'f1', claim),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('rechaza un archivo sin versión vigente', async () => {
    const d = buildAnonymousUpload();
    d.filesRepo.findById.mockResolvedValue({
      id: 'f1',
      tenantId: SEED.tenantId,
      createdByUserId: null, // MikroORM hidrata así una FK nullable sin valor
      categoryConceptId: CONCEPTS.FILE_CATEGORY_DOCUMENT,
      lifecycleStatusConceptId: CONCEPTS.FILE_ACTIVE,
    });

    await expect(
      d.service.claimAnonymousUpload(em, 'f1', claim),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('rechaza un archivo infectado', async () => {
    const d = buildAnonymousUpload();
    d.fileVersionsRepo.findById.mockResolvedValue({
      id: 'v1',
      mimeType: 'application/pdf',
      malwareScanStatusConceptId: CONCEPTS.SCAN_INFECTED,
    });

    await expect(
      d.service.claimAnonymousUpload(em, 'f1', claim),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('rechaza un archivo que no es PDF', async () => {
    const d = buildAnonymousUpload();
    d.fileVersionsRepo.findById.mockResolvedValue({
      id: 'v1',
      mimeType: 'image/png',
      malwareScanStatusConceptId: CONCEPTS.SCAN_PENDING,
    });

    await expect(
      d.service.claimAnonymousUpload(em, 'f1', claim, {
        allowedMimeTypes: ['application/pdf'],
      }),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('no flushea: la asignación queda en la unidad de trabajo del llamador', async () => {
    const d = buildAnonymousUpload();

    const { file } = await d.service.claimAnonymousUpload(em, 'f1', claim);

    // El objeto devuelto ya trae los cambios en memoria; persistirlos es
    // responsabilidad de la transacción de quien llama.
    expect(file.tenantId).toBe('tenant-1');
  });
});
