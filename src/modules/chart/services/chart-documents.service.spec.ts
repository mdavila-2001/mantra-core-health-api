import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ChartDocumentsService } from './chart-documents.service';
import { CHART } from '../chart.concepts';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';
import { ChartEncounterScopeService } from './chart-encounter-scope.service';
import { ChartErrorReason } from '../chart.error-reasons';

const TENANT_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const TENANT_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

const actor = { id: 'clin-1', roles: [] } as any;

/**
 * Ejecuta cada método del servicio dentro del contexto de tenant A, como lo hace
 * `TenantContextInterceptor` en una petición real.
 *
 * @param service - Servicio bajo prueba.
 * @returns Un proxy que ejecuta cada método dentro de `runWithTenant`.
 */
function inTenantA<T extends object>(service: T): T {
  return new Proxy(service, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);
      if (typeof value !== 'function') return value;
      return (...args: unknown[]) =>
        runWithTenant(TENANT_A, () => value.apply(target, args));
    },
  });
}

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const emFork = {};
  const em = {
    transactional: mockFn((cb: any) => cb(tx)),
    fork: mockFn(() => emFork),
  };
  const documentsRepo = {
    createRecord: mockFn(),
    findRecordsByPatient: mockFn().mockResolvedValue([]),
    findRecordById: mockFn(),
    findFilesForRecords: mockFn().mockResolvedValue([]),
    findByEncounter: mockFn().mockResolvedValue([]),
    createFile: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn() };
  const attachableFiles = {
    assertUsableBy: mockFn().mockResolvedValue({ file: {}, version: {} }),
  };
  const clinicalRead = {
    assertCanReadHistory: mockFn().mockResolvedValue(undefined),
  };
  const fileUpload = {
    downloadForAuthorizedContext: mockFn().mockResolvedValue({
      buffer: Buffer.from('pdf'),
      mimeType: 'application/pdf',
      originalName: 'doc.pdf',
    }),
  };
  // BR-14 (CL-07): por defecto no rechaza nada.
  const encounterSealGuard = {
    assertEncounterWritable: mockFn().mockResolvedValue(undefined),
  };
  // CHART-01: el alcance real, con repositorios de prueba. Por defecto el
  // encuentro `enc-1` existe, está abierto y es del paciente `p1`.
  const encountersRepo = {
    findById: mockFn(async (_tx: unknown, id: string) => ({
      id,
      patientProfileId: 'p1',
      tenantId: TENANT_A,
      sealedAt: undefined,
    })),
  };
  const conditionsRepo = {
    findById: mockFn(async (_tx: unknown, id: string) => ({
      id,
      patientProfileId: 'p1',
    })),
  };
  const encounterScope = new ChartEncounterScopeService(
    encountersRepo as any,
    conditionsRepo as any,
  );
  const service = new ChartDocumentsService(
    em as any,
    documentsRepo,
    logger as any,
    attachableFiles as any,
    clinicalRead as any,
    fileUpload as any,
    encounterSealGuard as any,
    encounterScope,
  );
  return {
    service: inTenantA(service),
    tx,
    em,
    emFork,
    documentsRepo,
    attachableFiles,
    clinicalRead,
    fileUpload,
    encounterSealGuard,
    encountersRepo,
  };
}

describe('ChartDocumentsService', () => {
  describe('createDocument (UC-15-09)', () => {
    it('BR-14 (CL-07): rejects a document against a sealed encounter', async () => {
      const d = build();
      d.encounterSealGuard.assertEncounterWritable.mockRejectedValue(
        new PreconditionFailedException('sellado'),
      );
      await expect(
        d.service.createDocument(
          {
            patientProfileId: 'p1',
            tenantId: 't1',
            title: 'Lab result',
            encounterId: 'enc-1',
            files: [],
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.documentsRepo.createRecord).not.toHaveBeenCalled();
    });

    it('flushes the record before its files and defaults the first file to PRIMARY', async () => {
      const d = build();
      d.documentsRepo.createRecord.mockReturnValue({
        id: 'doc1',
        statusConceptId: CHART.DOC_STATUS_ACTIVE,
        createdAt: new Date(),
      });

      const res = await d.service.createDocument(
        {
          patientProfileId: 'p1',
          tenantId: 't1',
          title: 'Lab result',
          files: [
            { fileId: 'f1' },
            { fileId: 'f2', contentRole: 'ATTACHMENT' },
          ],
        } as any,
        actor,
      );

      expect(d.tx.flush).toHaveBeenCalledTimes(1);
      expect(res.fileCount).toBe(2);
      expect(d.documentsRepo.createFile).toHaveBeenNthCalledWith(
        1,
        d.tx,
        expect.objectContaining({
          fileId: 'f1',
          contentRoleConceptId: CHART.CONTENT_ROLE_PRIMARY,
          ordinal: 0,
        }),
      );
      expect(d.documentsRepo.createFile).toHaveBeenNthCalledWith(
        2,
        d.tx,
        expect.objectContaining({
          fileId: 'f2',
          contentRoleConceptId: CHART.CONTENT_ROLE_ATTACHMENT,
        }),
      );
    });

    it('creates a record with no files (fileCount 0) using default category/status', async () => {
      const d = build();
      d.documentsRepo.createRecord.mockReturnValue({
        id: 'doc2',
        statusConceptId: CHART.DOC_STATUS_ACTIVE,
        createdAt: new Date(),
      });

      const res = await d.service.createDocument(
        { patientProfileId: 'p1', tenantId: 't1', title: 'Note' },
        actor,
      );
      expect(res.fileCount).toBe(0);
      expect(d.documentsRepo.createFile).not.toHaveBeenCalled();
      expect(d.documentsRepo.createRecord).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          categoryConceptId: CHART.DOC_CATEGORY_GENERAL,
          statusConceptId: CHART.DOC_STATUS_ACTIVE,
        }),
      );
    });

    it('validates each file against AttachableFileService before creating the record', async () => {
      const d = build();
      d.documentsRepo.createRecord.mockReturnValue({
        id: 'doc1',
        statusConceptId: CHART.DOC_STATUS_ACTIVE,
        createdAt: new Date(),
      });

      await d.service.createDocument(
        {
          patientProfileId: 'p1',
          tenantId: 't1',
          title: 'Lab result',
          files: [{ fileId: 'f1' }, { fileId: 'f2' }],
        } as any,
        actor,
      );

      expect(d.attachableFiles.assertUsableBy).toHaveBeenCalledTimes(2);
      expect(d.attachableFiles.assertUsableBy).toHaveBeenNthCalledWith(
        1,
        d.tx,
        'f1',
        actor,
        expect.objectContaining({ operation: 'chart.document.create' }),
        expect.objectContaining({ subject: 'El archivo del documento' }),
      );
    });

    it('does not create the record when a file fails validation', async () => {
      const d = build();
      const error = new Error('rejected');
      d.attachableFiles.assertUsableBy.mockRejectedValue(error);

      await expect(
        d.service.createDocument(
          {
            patientProfileId: 'p1',
            tenantId: 't1',
            title: 'Lab result',
            files: [{ fileId: 'f1' }],
          } as any,
          actor,
        ),
      ).rejects.toThrow(error);

      expect(d.documentsRepo.createRecord).not.toHaveBeenCalled();
    });

    it('does not call assertUsableBy when there are no files', async () => {
      const d = build();
      d.documentsRepo.createRecord.mockReturnValue({
        id: 'doc3',
        statusConceptId: CHART.DOC_STATUS_ACTIVE,
        createdAt: new Date(),
      });

      await d.service.createDocument(
        { patientProfileId: 'p1', tenantId: 't1', title: 'Note' },
        actor,
      );

      expect(d.attachableFiles.assertUsableBy).not.toHaveBeenCalled();
    });
  });

  describe('getDocumentFileContent (D-5)', () => {
    it('returns 404 when the document does not exist', async () => {
      const d = build();
      d.documentsRepo.findRecordById.mockResolvedValue(null);

      await expect(
        d.service.getDocumentFileContent('doc1', 'f1', actor),
      ).rejects.toThrow(/no encontrado/);
      expect(d.clinicalRead.assertCanReadHistory).not.toHaveBeenCalled();
    });

    it('returns the same 404 when the file does not hang from that document', async () => {
      const d = build();
      d.documentsRepo.findRecordById.mockResolvedValue({
        id: 'doc1',
        patientProfileId: 'pat-1',
      });
      d.documentsRepo.findFilesForRecords.mockResolvedValue([
        { documentRecordId: 'doc1', fileId: 'other-file' },
      ]);

      await expect(
        d.service.getDocumentFileContent('doc1', 'f1', actor),
      ).rejects.toThrow(/no encontrado/);
      expect(d.clinicalRead.assertCanReadHistory).not.toHaveBeenCalled();
    });

    it('does not download when the actor cannot read the patient chart', async () => {
      const d = build();
      d.documentsRepo.findRecordById.mockResolvedValue({
        id: 'doc1',
        patientProfileId: 'pat-1',
      });
      d.documentsRepo.findFilesForRecords.mockResolvedValue([
        { documentRecordId: 'doc1', fileId: 'f1' },
      ]);
      const forbidden = new Error('forbidden');
      d.clinicalRead.assertCanReadHistory.mockRejectedValue(forbidden);

      await expect(
        d.service.getDocumentFileContent('doc1', 'f1', actor),
      ).rejects.toThrow(forbidden);
      expect(d.fileUpload.downloadForAuthorizedContext).not.toHaveBeenCalled();
    });

    it('downloads the bytes once the document, file and access all check out', async () => {
      const d = build();
      d.documentsRepo.findRecordById.mockResolvedValue({
        id: 'doc1',
        patientProfileId: 'pat-1',
      });
      d.documentsRepo.findFilesForRecords.mockResolvedValue([
        { documentRecordId: 'doc1', fileId: 'f1' },
      ]);

      const content = await d.service.getDocumentFileContent(
        'doc1',
        'f1',
        actor,
      );

      expect(d.clinicalRead.assertCanReadHistory).toHaveBeenCalledWith(
        'pat-1',
        actor,
      );
      expect(d.fileUpload.downloadForAuthorizedContext).toHaveBeenCalledWith(
        'f1',
        'chart.document.file.content',
      );
      expect(content.mimeType).toBe('application/pdf');
    });
  });
});

/**
 * Captura el rechazo para inspeccionar status, reason y details.
 *
 * @param promise - Operación que debe fallar.
 * @returns La excepción lanzada.
 */
async function rejection(promise: Promise<unknown>): Promise<any> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('Se esperaba un rechazo');
}

describe('ChartDocumentsService.createDocument · encuentro del paciente (CHART-01)', () => {
  const dto = (extra: Record<string, unknown> = {}) =>
    ({
      patientProfileId: 'p1',
      tenantId: TENANT_A,
      title: 'Lab result',
      files: [{ fileId: 'f1' }],
      ...extra,
    }) as any;

  it('correcto: el documento de A con un encuentro abierto de A conserva la relación', async () => {
    const d = build();
    d.documentsRepo.createRecord.mockReturnValue({
      id: 'doc1',
      statusConceptId: CHART.DOC_STATUS_ACTIVE,
      createdAt: new Date(),
    });

    const res = await d.service.createDocument(
      dto({ encounterId: 'enc-1' }),
      actor,
    );

    expect(res.id).toBe('doc1');
    expect(d.documentsRepo.createRecord.mock.calls[0][1]).toMatchObject({
      patientProfileId: 'p1',
      encounterId: 'enc-1',
    });
  });

  it('límite: sin encounterId el documento se crea sin consultar encuentros', async () => {
    const d = build();
    d.documentsRepo.createRecord.mockReturnValue({
      id: 'doc1',
      statusConceptId: CHART.DOC_STATUS_ACTIVE,
      createdAt: new Date(),
    });

    await d.service.createDocument(dto(), actor);

    expect(d.encountersRepo.findById).not.toHaveBeenCalled();
  });

  it('error: el encuentro abierto de B usado desde A responde como inexistente, sin registro ni archivos vinculados', async () => {
    const foreign = build();
    foreign.encountersRepo.findById.mockResolvedValue({
      id: 'enc-b',
      patientProfileId: 'p2',
      tenantId: TENANT_A,
    });
    const absent = build();
    absent.encountersRepo.findById.mockResolvedValue(null);

    const a = await rejection(
      foreign.service.createDocument(dto({ encounterId: 'enc-b' }), actor),
    );
    const b = await rejection(
      absent.service.createDocument(dto({ encounterId: 'enc-b' }), actor),
    );

    expect(a).toBeInstanceOf(ResourceNotFoundException);
    expect(a.reason).toBe(ChartErrorReason.CHART_ENCOUNTER_OUT_OF_SCOPE);
    expect(a.details).toBeUndefined();
    expect(a.getResponse()).toEqual(b.getResponse());
    expect(foreign.documentsRepo.createRecord).not.toHaveBeenCalled();
    expect(foreign.documentsRepo.createFile).not.toHaveBeenCalled();
    expect(foreign.attachableFiles.assertUsableBy).not.toHaveBeenCalled();
  });

  it('un encuentro del mismo paciente pero de otro tenant también es ajeno', async () => {
    const d = build();
    d.encountersRepo.findById.mockResolvedValue({
      id: 'enc-1',
      patientProfileId: 'p1',
      tenantId: TENANT_B,
    });

    const error = await rejection(
      runWithTenant(TENANT_A, () =>
        d.service.createDocument(dto({ encounterId: 'enc-1' }), actor),
      ),
    );

    expect(error.reason).toBe(ChartErrorReason.CHART_ENCOUNTER_OUT_OF_SCOPE);
    expect(d.documentsRepo.createRecord).not.toHaveBeenCalled();
  });

  it('falla catalogada: un encuentro sellado responde 422 CHART_ENCOUNTER_SEALED y no escribe', async () => {
    const d = build();
    d.encountersRepo.findById.mockResolvedValue({
      id: 'enc-1',
      patientProfileId: 'p1',
      tenantId: TENANT_A,
      sealedAt: new Date(),
    });

    const error = await rejection(
      d.service.createDocument(dto({ encounterId: 'enc-1' }), actor),
    );

    expect(error).toBeInstanceOf(PreconditionFailedException);
    expect(error.getStatus()).toBe(422);
    expect(error.reason).toBe(ChartErrorReason.CHART_ENCOUNTER_SEALED);
    expect(d.documentsRepo.createRecord).not.toHaveBeenCalled();
    expect(d.attachableFiles.assertUsableBy).not.toHaveBeenCalled();
  });
});
