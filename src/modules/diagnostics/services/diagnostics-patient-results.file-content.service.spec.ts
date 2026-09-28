import { jest } from '@jest/globals';
import { DiagnosticsPatientResultsService } from './diagnostics-patient-results.service';
import { DIAG } from '../diagnostics.concepts';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const USUARIO = { id: 'u1' } as any;
const PACIENTE = 'p1';
const INFORME = 'r1';
const ARCHIVO = 'f-lab';
const BYTES = Buffer.from('%PDF-1.4');

/**
 * CL-40: el paciente baja el archivo de SU resultado liberado por la ruta del
 * contexto; todo lo demás es 404 y nunca llega a pedir bytes.
 */
function build(
  opts: {
    reportPatient?: string;
    released?: boolean;
    fileId?: string;
  } = {},
) {
  const { reportPatient = PACIENTE, released = true, fileId = ARCHIVO } = opts;
  const em = { fork: mockFn().mockReturnValue({}) };
  const ordersRepo = {
    findReportById: mockFn().mockResolvedValue({
      id: INFORME,
      patientProfileId: reportPatient,
      codeConceptId: 'c',
      custodianTenantId: 't',
    }),
  };
  const reportsRepo = {
    findVersionsByReports: mockFn().mockResolvedValue([
      {
        id: 'v1',
        diagnosticReportId: INFORME,
        versionNumber: 1,
        recordedAt: new Date(),
      },
    ]),
    findReleaseEventsByVersions: mockFn().mockResolvedValue(
      released
        ? [
            {
              diagnosticReportVersionId: 'v1',
              patientVisibilityConceptId: DIAG.VISIBILITY_PATIENT_VISIBLE,
              recordedAt: new Date(),
            },
          ]
        : [],
    ),
    findFilesByVersions: mockFn().mockResolvedValue([
      {
        id: 'rf1',
        diagnosticReportVersionId: 'v1',
        fileId,
        contentRoleConceptId: 'role',
        ordinal: 1,
      },
    ]),
    findResultsByVersions: mockFn().mockResolvedValue([]),
  };
  const fileUpload = {
    downloadForAuthorizedContext: mockFn().mockResolvedValue({
      buffer: BYTES,
      mimeType: 'application/pdf',
      originalName: 'informe.pdf',
    }),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new DiagnosticsPatientResultsService(
    em as any,
    ordersRepo as any,
    reportsRepo as any,
    {
      findActiveByUser: mockFn().mockResolvedValue({ personId: 'per' }),
    } as any,
    { findById: mockFn().mockResolvedValue({ profileId: PACIENTE }) } as any,
    {} as any,
    {} as any,
    logger as any,
    {} as any,
    fileUpload as any,
  );
  return { service, fileUpload };
}

describe('DiagnosticsPatientResultsService.getOwnResultFileContent (CL-40)', () => {
  it('titular + liberado + archivo del informe: entrega los bytes', async () => {
    const d = build();
    const out = await d.service.getOwnResultFileContent(
      USUARIO,
      INFORME,
      ARCHIVO,
    );
    expect(out.buffer).toBe(BYTES);
    expect(out.mimeType).toBe('application/pdf');
    expect(d.fileUpload.downloadForAuthorizedContext).toHaveBeenCalledWith(
      ARCHIVO,
      'diagnostics.patient-result.file.content',
    );
  });

  it('informe no liberado: 404 y no pide bytes', async () => {
    const d = build({ released: false });
    await expect(
      d.service.getOwnResultFileContent(USUARIO, INFORME, ARCHIVO),
    ).rejects.toMatchObject({ status: 404 });
    expect(d.fileUpload.downloadForAuthorizedContext).not.toHaveBeenCalled();
  });

  it('informe de otro paciente: 404, no 401 ni 403', async () => {
    const d = build({ reportPatient: 'otro' });
    await expect(
      d.service.getOwnResultFileContent(USUARIO, INFORME, ARCHIVO),
    ).rejects.toMatchObject({ status: 404 });
    expect(d.fileUpload.downloadForAuthorizedContext).not.toHaveBeenCalled();
  });

  it('fileId que no cuelga del informe: 404', async () => {
    const d = build({ fileId: 'otro-archivo' });
    await expect(
      d.service.getOwnResultFileContent(USUARIO, INFORME, ARCHIVO),
    ).rejects.toMatchObject({ status: 404 });
    expect(d.fileUpload.downloadForAuthorizedContext).not.toHaveBeenCalled();
  });
});
