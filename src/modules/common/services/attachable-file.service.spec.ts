import { afterEach, jest } from '@jest/globals';

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

  it('contextual validation checks state/version without requiring uploader ownership', async () => {
    const d = build();
    d.filesRepo.findById.mockResolvedValue({
      id: 'f1',
      createdByUserId: 'otro-usuario',
      currentVersionId: 'v1',
      lifecycleStatusConceptId: CONCEPTS.FILE_ACTIVE,
    });

    await expect(
      d.service.assertUsableForAuthorizedContext(em, 'f1'),
    ).resolves.toMatchObject({ file: { id: 'f1' }, version: { id: 'v1' } });
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

  it('AG-17: admite un archivo ajeno si su id está en la allowlist', async () => {
    const d = build();
    d.filesRepo.findById.mockResolvedValue({
      id: 'sticker-1',
      createdByUserId: 'system-worker',
      currentVersionId: 'v1',
      lifecycleStatusConceptId: CONCEPTS.FILE_ACTIVE,
    });

    await expect(
      d.service.assertUsableBy(em, 'sticker-1', actor, {
        allowIfFileIdIn: ['sticker-1', 'sticker-2'],
      }),
    ).resolves.toMatchObject({ file: { id: 'sticker-1' } });
    expect(d.logger.warn).not.toHaveBeenCalled();
  });

  it('AG-17: un archivo ajeno fuera de la allowlist sigue rechazado', async () => {
    const d = build();
    d.filesRepo.findById.mockResolvedValue({
      id: 'otro-1',
      createdByUserId: 'otro-usuario',
      currentVersionId: 'v1',
      lifecycleStatusConceptId: CONCEPTS.FILE_ACTIVE,
    });

    await expect(
      d.service.assertUsableBy(em, 'otro-1', actor, {
        allowIfFileIdIn: ['sticker-1', 'sticker-2'],
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
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

describe('AttachableFileService.claimAnonymousUpload con RLS', () => {
  const claim = { tenantId: 'tenant-1', ownerUserId: 'owner-1' };
  const previous = process.env.RLS_ENFORCE;
  const SET_TRUE = "select set_config('app.system_context', 'true', true)";
  const RESTORE = "select set_config('app.system_context', ?, true) <- false";

  afterEach(() => {
    if (previous === undefined) delete process.env.RLS_ENFORCE;
    else process.env.RLS_ENFORCE = previous;
  });

  /** Todo lo que toca la base deja huella en `order`, para comprobar la secuencia. */
  function buildRls(updated = 1) {
    const order: string[] = [];
    const rlsEm = {
      isInTransaction: () => true,
      execute: mockFn(async (sql: string, params?: unknown[]) => {
        order.push(params ? `${sql} <- ${String(params)}` : sql);
        return sql.includes('current_setting') ? [{ value: null }] : [];
      }),
      nativeUpdate: mockFn(async () => {
        order.push('nativeUpdate');
        return updated;
      }),
      // Like the real re-read: the entity takes the row as the UPDATE left it.
      refresh: mockFn(async (entity: Record<string, unknown>) => {
        order.push('refresh');
        Object.assign(entity, {
          tenantId: 'tenant-1',
          createdByUserId: 'owner-1',
        });
        return entity;
      }),
    };
    const filesRepo = {
      findById: mockFn(async () => {
        order.push('findById');
        return {
          id: 'f1',
          tenantId: SEED.tenantId,
          createdByUserId: null,
          categoryConceptId: CONCEPTS.FILE_CATEGORY_DOCUMENT,
          currentVersionId: 'v1',
          lifecycleStatusConceptId: CONCEPTS.FILE_ACTIVE,
        };
      }),
    };
    const fileVersionsRepo = {
      findById: mockFn(async () => {
        order.push('versions.findById');
        return {
          id: 'v1',
          mimeType: 'application/pdf',
          malwareScanStatusConceptId: CONCEPTS.SCAN_PENDING,
        };
      }),
    };
    const logger = { setContext: mockFn(), warn: mockFn(), info: mockFn() };
    const service = new AttachableFileService(
      filesRepo as any,
      fileVersionsRepo as any,
      logger as any,
    );
    return { service, rlsEm: rlsEm as any, order, logger };
  }

  it('abre la ventana de sistema, lee, hace el UPDATE condicional y restaura', async () => {
    process.env.RLS_ENFORCE = 'true';
    const d = buildRls();

    const { file } = await d.service.claimAnonymousUpload(d.rlsEm, 'f1', claim);

    expect(d.order).toEqual([
      "select current_setting('app.system_context', true) as value",
      SET_TRUE,
      'findById',
      'versions.findById',
      'nativeUpdate',
      'refresh',
      RESTORE,
    ]);
    expect(d.rlsEm.nativeUpdate).toHaveBeenCalledWith(
      expect.anything(),
      { id: 'f1', tenantId: SEED.tenantId, createdByUserId: null },
      expect.objectContaining({
        tenantId: 'tenant-1',
        createdByUserId: 'owner-1',
        updatedByUserId: 'owner-1',
      }),
    );
    expect(file.tenantId).toBe('tenant-1');
    expect(file.createdByUserId).toBe('owner-1');
  });

  it('un UPDATE que afecta 0 filas (otro reclamo ganó) da 422 y restaura la ventana', async () => {
    process.env.RLS_ENFORCE = 'true';
    const d = buildRls(0);

    await expect(
      d.service.claimAnonymousUpload(d.rlsEm, 'f1', claim),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
    expect(d.logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ fileId: 'f1' }),
      'Refused to claim a file that is not an unclaimed anonymous upload',
    );
    expect(d.order.at(-1)).toBe(RESTORE);
  });

  it('con RLS apagado no ejecuta set_config ni UPDATE propio', async () => {
    delete process.env.RLS_ENFORCE;
    const d = buildRls();

    const { file } = await d.service.claimAnonymousUpload(d.rlsEm, 'f1', claim);

    expect(d.order).toEqual(['findById', 'versions.findById']);
    expect(d.rlsEm.execute).not.toHaveBeenCalled();
    expect(d.rlsEm.nativeUpdate).not.toHaveBeenCalled();
    expect(file.tenantId).toBe('tenant-1');
  });
});
