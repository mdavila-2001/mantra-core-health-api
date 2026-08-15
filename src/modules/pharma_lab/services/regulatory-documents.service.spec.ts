import { jest } from '@jest/globals';

/**
 * Crea una función simulada con la implementación dada.
 *
 * @param impl - Implementación que ejecuta el doble.
 * @returns La función simulada.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { RegulatoryDocumentsService } from './regulatory-documents.service';
import { PHL } from '../pharma_lab.concepts';

const LAB = '11111111-1111-1111-1111-111111111111';
const TENANT = '22222222-2222-2222-2222-222222222222';
const DOCUMENT = '33333333-3333-3333-3333-333333333333';
const VERSION = '44444444-4444-4444-4444-444444444444';
const ACTOR = { id: '99999999-9999-9999-9999-999999999999' } as any;

/** Documento vigente por defecto. */
function document(
  overrides: Record<string, unknown> = {},
): Record<string, any> {
  return {
    id: DOCUMENT,
    pharmaLabId: LAB,
    name: 'Licencia de funcionamiento',
    documentTypeConceptId: PHL.DOC_TYPE_LICENSE,
    currentVersion: 'v1',
    statusConceptId: PHL.DOC_VALID,
    disclosureLevelConceptId: PHL.DISCLOSURE_INTERNAL,
    expiryAlertDays: 30,
    updatedAt: new Date(),
    ...overrides,
  };
}

/** Versión vigente por defecto. */
function version(overrides: Record<string, unknown> = {}): Record<string, any> {
  return {
    id: VERSION,
    regulatoryDocumentId: DOCUMENT,
    version: 'v1',
    storageKey: 'docs/licencia-v1.pdf',
    fileName: 'licencia-v1.pdf',
    statusConceptId: PHL.DOC_VALID,
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 *
 * @param options - Estado inicial de los dobles.
 * @returns El servicio y los dobles.
 */
function build(
  options: {
    /** Documento devuelto por el repositorio. */
    documentRow?: Record<string, any>;
    /** Versión vigente. */
    currentVersion?: Record<string, any> | null;
    /** Documentos próximos a vencer. */
    expiring?: Record<string, any>[];
  } = {},
) {
  const documentRow = options.documentRow ?? document();
  const currentVersion =
    options.currentVersion === undefined ? version() : options.currentVersion;

  const repo = {
    findDocument: mockFn(async () => documentRow),
    listDocuments: mockFn(async () => [documentRow]),
    listExpiringDocuments: mockFn(async () => options.expiring ?? []),
    createDocument: mockFn(() => documentRow),
    createVersion: mockFn(() => version()),
    findCurrentVersion: mockFn(async () => currentVersion),
    listVersions: mockFn(async () => (currentVersion ? [currentVersion] : [])),
    appendAccess: mockFn(() => ({ id: 'access' })),
    listAccesses: mockFn(async () => []),
  };
  const access = {
    requireLab: mockFn(async () => ({ id: LAB, tenantId: TENANT })),
    requireActiveLab: mockFn(async () => ({ id: LAB, tenantId: TENANT })),
  };
  const organization = {
    listActiveStaffUserIds: mockFn(async () => ['staff-1']),
  };
  const notifications = { notify: mockFn(), notifyAll: mockFn() };
  const audit = { record: mockFn(async () => undefined) };
  const em: any = {
    transactional: mockFn((cb: any) => cb(em)),
    flush: mockFn(async () => undefined),
  };

  const service = new RegulatoryDocumentsService(
    em,
    repo as any,
    access as any,
    organization as any,
    notifications as any,
    audit as any,
  );
  return { service, repo, notifications, documentRow, currentVersion };
}

describe('RegulatoryDocumentsService', () => {
  it('no expone ninguna operación de borrado', () => {
    const { service } = build();

    expect(
      Object.getOwnPropertyNames(Object.getPrototypeOf(service)).filter(
        (name) => /delete|remove|destroy/i.test(name),
      ),
    ).toEqual([]);
  });

  describe('versiones', () => {
    it('la sustitución marca la anterior como sustituida y conserva su archivo', async () => {
      const { service, repo, currentVersion, documentRow } = build();

      await service.addVersion(
        LAB,
        DOCUMENT,
        {
          version: 'v2',
          fileName: 'licencia-v2.pdf',
          storageKey: 'docs/licencia-v2.pdf',
          changeReason: 'Renovación anual',
        },
        ACTOR,
      );

      expect(currentVersion!.statusConceptId).toBe(PHL.DOC_SUPERSEDED);
      expect(currentVersion!.storageKey).toBe('docs/licencia-v1.pdf');
      expect(documentRow.currentVersion).toBe('v2');
      expect(repo.createVersion).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          version: 'v2',
          statusConceptId: PHL.DOC_VALID,
        }),
      );
    });

    it('un documento invalidado no admite versiones nuevas', async () => {
      const { service } = build({
        documentRow: document({ statusConceptId: PHL.DOC_INVALIDATED }),
      });

      await expect(
        service.addVersion(
          LAB,
          DOCUMENT,
          {
            version: 'v2',
            fileName: 'f.pdf',
            storageKey: 'k',
            changeReason: 'x',
          },
          ACTOR,
        ),
      ).rejects.toThrow('no admite versiones nuevas');
    });
  });

  describe('invalidación', () => {
    it('marca el documento y su versión, sin borrar nada', async () => {
      const { service, documentRow, currentVersion } = build();

      const result = await service.invalidateDocument(
        LAB,
        DOCUMENT,
        { reason: 'Emitido con datos erróneos' },
        ACTOR,
      );

      expect(result.statusConceptId).toBe(PHL.DOC_INVALIDATED);
      expect(documentRow.id).toBe(DOCUMENT);
      expect(currentVersion!.statusConceptId).toBe(PHL.DOC_INVALIDATED);
      expect(currentVersion!.changeReason).toBe('Emitido con datos erróneos');
    });

    it('no invalida dos veces', async () => {
      const { service } = build({
        documentRow: document({ statusConceptId: PHL.DOC_INVALIDATED }),
      });

      await expect(
        service.invalidateDocument(LAB, DOCUMENT, { reason: 'x' }, ACTOR),
      ).rejects.toThrow('ya está invalidado');
    });
  });

  describe('registro de accesos', () => {
    it('la consulta queda registrada', async () => {
      const { service, repo } = build();

      await service.getDocument(LAB, DOCUMENT, ACTOR);

      expect(repo.appendAccess).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ accessKind: 'VIEW', actorUserId: ACTOR.id }),
      );
    });

    it('la descarga queda registrada con la versión concreta', async () => {
      const { service, repo } = build();

      await service.registerDownload(LAB, DOCUMENT, VERSION, ACTOR);

      expect(repo.appendAccess).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          accessKind: 'DOWNLOAD',
          regulatoryDocumentVersionId: VERSION,
        }),
      );
    });

    it('rechaza descargar una versión que no es del documento', async () => {
      const { service } = build();

      await expect(
        service.registerDownload(
          LAB,
          DOCUMENT,
          '00000000-0000-0000-0000-000000000000',
          ACTOR,
        ),
      ).rejects.toThrow('Versión no encontrada');
    });
  });

  describe('alertas de vencimiento', () => {
    it('marca como próximo a vencer y avisa una sola vez', async () => {
      const soon = new Date(Date.now() + 10 * 86_400_000)
        .toISOString()
        .slice(0, 10);
      const doc = document({ expiresOn: soon });
      const { service, notifications } = build({ expiring: [doc] });

      const first = await service.reviewExpirations(LAB, ACTOR);
      expect(first.expiring).toBe(1);
      expect(doc.statusConceptId).toBe(PHL.DOC_EXPIRING);

      const second = await service.reviewExpirations(LAB, ACTOR);
      expect(second.expiring).toBe(0);
      expect(notifications.notifyAll).toHaveBeenCalledTimes(1);
    });

    it('marca como vencido el que ya pasó su fecha', async () => {
      const past = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
      const doc = document({ expiresOn: past });
      const { service } = build({ expiring: [doc] });

      const result = await service.reviewExpirations(LAB, ACTOR);

      expect(result.expired).toBe(1);
      expect(doc.statusConceptId).toBe(PHL.DOC_EXPIRED);
    });

    it('no toca los que aún están lejos del vencimiento', async () => {
      const far = new Date(Date.now() + 200 * 86_400_000)
        .toISOString()
        .slice(0, 10);
      const doc = document({ expiresOn: far });
      const { service } = build({ expiring: [doc] });

      const result = await service.reviewExpirations(LAB, ACTOR);

      expect(result.expiring).toBe(0);
      expect(doc.statusConceptId).toBe(PHL.DOC_VALID);
    });
  });
});
