import { jest } from '@jest/globals';
import { DiagnosticsPractitionerResultsService } from './diagnostics-practitioner-results.service';
import { DIAG } from '../diagnostics.concepts';
import { DiagnosticsErrorReason } from '../diagnostics.error-reasons';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const TENANT = 't1';
const PATIENT = 'p1';
const REPORT = 'r1';
const FILE = 'f-pdf';
const RELEASED_AT = new Date('2026-11-01T10:00:00Z');

/**
 * Construye el servicio con un informe de laboratorio liberado: una versión 1
 * liberada, dos observaciones (cantidad con rango e interpretación, y valor
 * codificado) y un PDF.
 */
function build(
  opts: {
    report?: Record<string, unknown> | null;
    releases?: Record<string, unknown>[];
    versions?: Record<string, unknown>[];
  } = {},
) {
  const report =
    opts.report === undefined
      ? {
          id: REPORT,
          patientProfileId: PATIENT,
          custodianTenantId: TENANT,
          serviceRequestId: 'sr1',
          codeConceptId: 'c-panel',
          categoryConceptId: 'c-lab',
        }
      : opts.report;
  const versions = opts.versions ?? [
    {
      id: 'v1',
      diagnosticReportId: REPORT,
      versionNumber: 1,
      clinicalStatusConceptId: 'c-final',
      conclusionText: 'Glucemia elevada.',
      issuedAt: new Date('2026-11-01T09:00:00Z'),
      recordedAt: new Date('2026-11-01T08:00:00Z'),
    },
  ];
  const releases = opts.releases ?? [
    {
      diagnosticReportVersionId: 'v1',
      actionConceptId: DIAG.RELEASE_ACTION_RELEASE,
      patientVisibilityConceptId: DIAG.VISIBILITY_PATIENT_VISIBLE,
      recordedAt: RELEASED_AT,
    },
  ];
  const em = { fork: mockFn().mockReturnValue({}) };
  const ordersRepo = { findReportById: mockFn().mockResolvedValue(report) };
  const reportsRepo = {
    findVersionsByReports: mockFn().mockResolvedValue(versions),
    findReleaseEventsByVersions: mockFn().mockResolvedValue(releases),
    findResultsByVersions: mockFn().mockImplementation(
      async (_em: unknown, ids: string[]) =>
        ids
          .map((versionId) => [
            {
              diagnosticReportVersionId: versionId,
              observationId: 'o-glu',
              ordinal: 0,
            },
            {
              diagnosticReportVersionId: versionId,
              observationId: 'o-hiv',
              ordinal: 1,
            },
            {
              diagnosticReportVersionId: versionId,
              observationId: 'o-gone',
              ordinal: 2,
            },
          ])
          .flat(),
    ),
    findFilesByVersions: mockFn().mockImplementation(
      async (_em: unknown, ids: string[]) =>
        ids.map((versionId) => ({
          id: 'rf1',
          diagnosticReportVersionId: versionId,
          fileId: FILE,
          contentRoleConceptId: 'c-role',
          ordinal: 1,
        })),
    ),
  };
  const refsRepo = {
    findObservations: mockFn().mockResolvedValue([
      {
        id: 'o-glu',
        codeConceptId: 'c-glu',
        statusConceptId: 'c-st',
        quantityValue: '126.0',
        quantityUnitConceptId: 'c-mgdl',
        interpretationConceptId: 'c-high',
        effectiveStartAt: new Date('2026-10-31T07:00:00Z'),
      },
      {
        id: 'o-hiv',
        codeConceptId: 'c-hiv',
        statusConceptId: 'c-st',
        valueConceptId: 'c-neg',
      },
    ]),
    findReferenceRanges: mockFn().mockResolvedValue([
      {
        observationId: 'o-glu',
        observationComponentId: 'comp',
        lowValue: '1',
        highValue: '2',
      },
      {
        observationId: 'o-glu',
        lowValue: '70',
        highValue: '100',
        unitConceptId: 'c-mgdl',
      },
      { observationId: 'o-glu', lowValue: '60', highValue: '90' },
    ]),
    findFiles: mockFn().mockResolvedValue([
      { id: FILE, originalName: 'informe.pdf' },
    ]),
    findConceptLabels: mockFn().mockResolvedValue(
      new Map([
        ['c-panel', { code: 'PANEL', display: 'Perfil metabólico' }],
        ['c-glu', { code: 'GLU', display: 'Glucosa' }],
        ['c-mgdl', { code: 'mg/dL', display: 'mg/dL' }],
        ['c-high', { code: 'H', display: 'Alto' }],
        ['c-hiv', { code: 'HIV', display: 'VIH' }],
        ['c-neg', { code: 'NEG', display: 'Negativo' }],
      ]),
    ),
  };
  const fileUpload = {
    downloadForAuthorizedContext: mockFn().mockResolvedValue({
      buffer: Buffer.from('%PDF-1.4'),
      mimeType: 'application/pdf',
      originalName: 'informe.pdf',
    }),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new DiagnosticsPractitionerResultsService(
    em as any,
    ordersRepo as any,
    reportsRepo as any,
    refsRepo as any,
    logger as any,
    fileUpload as any,
  );
  return { service, reportsRepo, refsRepo, fileUpload };
}

/** Comprueba el 404 único de esta lectura. */
async function expectNotFound(promise: Promise<unknown>) {
  const error: any = await promise.then(
    () => undefined,
    (e: unknown) => e,
  );
  expect(error?.getStatus()).toBe(404);
  expect(error.reason).toBe(
    DiagnosticsErrorReason.DIAGNOSTICS_RESOURCE_NOT_AVAILABLE,
  );
  expect(error.message).toBe('Informe no encontrado');
}

describe('DiagnosticsPractitionerResultsService.getReleasedResult', () => {
  it('devuelve la versión liberada con valores, conclusión y archivos', async () => {
    const { service } = build();

    const result = await service.getReleasedResult(TENANT, PATIENT, REPORT);

    expect(result).toMatchObject({
      reportId: REPORT,
      patientProfileId: PATIENT,
      serviceRequestId: 'sr1',
      codeConceptId: 'c-panel',
      codeDisplay: 'Perfil metabólico',
      categoryConceptId: 'c-lab',
      versionId: 'v1',
      versionNumber: 1,
      clinicalStatusConceptId: 'c-final',
      releasedAt: RELEASED_AT,
      patientVisible: true,
      conclusionText: 'Glucemia elevada.',
      files: [
        {
          id: 'rf1',
          fileId: FILE,
          name: 'informe.pdf',
          contentRoleConceptId: 'c-role',
          presentationFormatConceptId: null,
          ordinal: 1,
        },
      ],
    });
  });

  it('da forma a cada valor: cantidad, unidad, rango e interpretación', async () => {
    const { service } = build();

    const { values } = await service.getReleasedResult(TENANT, PATIENT, REPORT);

    // La observación enlazada que no se puede leer no aparece.
    expect(values.map((v) => v.observationId)).toEqual(['o-glu', 'o-hiv']);
    expect(values[0]).toEqual({
      observationId: 'o-glu',
      codeConceptId: 'c-glu',
      name: 'Glucosa',
      value: '126.0',
      valueKind: 'QUANTITY',
      valueConceptId: null,
      unitConceptId: 'c-mgdl',
      unit: 'mg/dL',
      // El primer rango de la observación, no el de un componente.
      referenceRange: {
        low: '70',
        high: '100',
        text: null,
        unitConceptId: 'c-mgdl',
        unit: 'mg/dL',
      },
      interpretationConceptId: 'c-high',
      interpretationCode: 'H',
      interpretation: 'Alto',
      statusConceptId: 'c-st',
      effectiveAt: new Date('2026-10-31T07:00:00Z'),
    });
    expect(values[1]).toMatchObject({
      name: 'VIH',
      value: 'Negativo',
      valueKind: 'CONCEPT',
      valueConceptId: 'c-neg',
      unit: null,
      referenceRange: null,
      interpretation: null,
      interpretationCode: null,
      effectiveAt: null,
    });
  });

  it('una liberación oculta al paciente sí se muestra a quien atiende', async () => {
    const { service } = build({
      releases: [
        {
          diagnosticReportVersionId: 'v1',
          actionConceptId: DIAG.RELEASE_ACTION_RELEASE,
          patientVisibilityConceptId: DIAG.VISIBILITY_PATIENT_HIDDEN,
          recordedAt: RELEASED_AT,
        },
      ],
    });

    const result = await service.getReleasedResult(TENANT, PATIENT, REPORT);

    expect(result.patientVisible).toBe(false);
  });

  it('de varias versiones liberadas gana la de número más alto', async () => {
    const later = new Date('2026-11-02T10:00:00Z');
    const { service } = build({
      versions: [
        {
          id: 'v2',
          diagnosticReportId: REPORT,
          versionNumber: 2,
          clinicalStatusConceptId: 'c-final',
          recordedAt: later,
        },
        {
          id: 'v1',
          diagnosticReportId: REPORT,
          versionNumber: 1,
          clinicalStatusConceptId: 'c-final',
          recordedAt: RELEASED_AT,
        },
        {
          id: 'v3',
          diagnosticReportId: REPORT,
          versionNumber: 3,
          clinicalStatusConceptId: 'c-prelim',
          recordedAt: later,
        },
      ],
      releases: [
        {
          diagnosticReportVersionId: 'v2',
          actionConceptId: DIAG.RELEASE_ACTION_RELEASE,
          patientVisibilityConceptId: DIAG.VISIBILITY_PATIENT_VISIBLE,
          recordedAt: later,
        },
        {
          diagnosticReportVersionId: 'v1',
          actionConceptId: DIAG.RELEASE_ACTION_RELEASE,
          patientVisibilityConceptId: DIAG.VISIBILITY_PATIENT_VISIBLE,
          recordedAt: RELEASED_AT,
        },
      ],
    });

    const result = await service.getReleasedResult(TENANT, PATIENT, REPORT);

    // v3 es un borrador posterior sin liberar: no se muestra.
    expect(result).toMatchObject({
      versionId: 'v2',
      versionNumber: 2,
      releasedAt: later,
      issuedAt: null,
      conclusionText: null,
    });
  });

  it('inexistente → 404', async () => {
    const { service, reportsRepo } = build({ report: null });

    await expectNotFound(service.getReleasedResult(TENANT, PATIENT, REPORT));
    expect(reportsRepo.findVersionsByReports).not.toHaveBeenCalled();
  });

  it('de otro paciente → el mismo 404', async () => {
    const { service, reportsRepo } = build();

    await expectNotFound(
      service.getReleasedResult(TENANT, 'otro-paciente', REPORT),
    );
    expect(reportsRepo.findVersionsByReports).not.toHaveBeenCalled();
  });

  it('de otra organización → el mismo 404', async () => {
    const { service } = build();

    await expectNotFound(
      service.getReleasedResult('otro-tenant', PATIENT, REPORT),
    );
  });

  it('sin versión liberada → el mismo 404, sin leer valores', async () => {
    const { service, reportsRepo, refsRepo } = build({ releases: [] });

    await expectNotFound(service.getReleasedResult(TENANT, PATIENT, REPORT));
    expect(reportsRepo.findResultsByVersions).not.toHaveBeenCalled();
    expect(refsRepo.findObservations).not.toHaveBeenCalled();
  });

  it('el último evento de la versión no es liberar → el mismo 404', async () => {
    const { service } = build({
      releases: [
        {
          diagnosticReportVersionId: 'v1',
          actionConceptId: 'otra-accion',
          patientVisibilityConceptId: DIAG.VISIBILITY_PATIENT_VISIBLE,
          recordedAt: RELEASED_AT,
        },
      ],
    });

    await expectNotFound(service.getReleasedResult(TENANT, PATIENT, REPORT));
  });
});

describe('DiagnosticsPractitionerResultsService.getReleasedResultFileContent', () => {
  it('sirve los bytes de un archivo de la versión liberada', async () => {
    const { service, fileUpload } = build();

    const content = await service.getReleasedResultFileContent(
      TENANT,
      PATIENT,
      REPORT,
      FILE,
    );

    expect(content.mimeType).toBe('application/pdf');
    expect(fileUpload.downloadForAuthorizedContext).toHaveBeenCalledWith(
      FILE,
      'diagnostics.practitioner-result.file.content',
    );
  });

  it('un archivo que no cuelga de la versión → 404 sin pedir bytes', async () => {
    const { service, fileUpload } = build();

    await expectNotFound(
      service.getReleasedResultFileContent(TENANT, PATIENT, REPORT, 'ajeno'),
    );
    expect(fileUpload.downloadForAuthorizedContext).not.toHaveBeenCalled();
  });

  it('informe de otro paciente o sin liberar → 404 sin pedir bytes', async () => {
    const other = build();
    await expectNotFound(
      other.service.getReleasedResultFileContent(TENANT, 'otro', REPORT, FILE),
    );
    expect(
      other.fileUpload.downloadForAuthorizedContext,
    ).not.toHaveBeenCalled();

    const draft = build({ releases: [] });
    await expectNotFound(
      draft.service.getReleasedResultFileContent(TENANT, PATIENT, REPORT, FILE),
    );
    expect(
      draft.fileUpload.downloadForAuthorizedContext,
    ).not.toHaveBeenCalled();
  });
});
