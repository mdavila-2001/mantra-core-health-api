import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { PreconditionFailedException } from '../../../common';
import { CLIN } from '../../clinical/clinical.concepts';
import { CHART } from '../chart.concepts';
import { PatientRecordPdfService } from './patient-record-pdf.service';

const titular = {
  id: 'user-pat',
  roles: ['PATIENT'],
  patientProfileId: 'pat-1',
} as any;

function build() {
  const em: any = { fork: mockFn(() => em), flush: mockFn() };
  const encountersRepo = {
    findByPatient: mockFn().mockResolvedValue([
      {
        id: 'e1',
        statusConceptId: CLIN.ENCOUNTER_FINISHED,
        contentHash: 'a'.repeat(64),
        startAt: new Date('2026-09-15T11:00:00.000Z'),
      },
      {
        id: 'e2',
        statusConceptId: CLIN.ENCOUNTER_IN_PROGRESS,
        contentHash: undefined,
      },
    ]),
  };
  const conditionsRepo = { findByPatient: mockFn().mockResolvedValue([]) };
  const allergiesRepo = { findByPatient: mockFn().mockResolvedValue([]) };
  const medsRepo = { findByPatient: mockFn().mockResolvedValue([]) };
  const notesRepo = {
    findHeadersByPatient: mockFn().mockResolvedValue([
      {
        id: 'h-released',
        patientReleaseStatusConceptId: CHART.RELEASE_RELEASED,
        currentReleasedVersionId: 'v-released',
      },
      {
        id: 'h-draft',
        patientReleaseStatusConceptId: CHART.RELEASE_WITHHELD,
        currentReleasedVersionId: undefined,
      },
    ]),
    findVersionsByIds: mockFn().mockResolvedValue(new Map()),
  };
  const documentsRepo = {
    findRecordsByPatient: mockFn().mockResolvedValue([
      {
        id: 'doc-visible',
        patientVisibilityConceptId: CHART.VISIBILITY_PATIENT_VISIBLE,
      },
      {
        id: 'doc-oculto',
        patientVisibilityConceptId: CHART.VISIBILITY_PROVIDER_ONLY,
      },
    ]),
    findFilesForRecords: mockFn().mockResolvedValue([]),
  };
  const catalogRepo = { findByIds: mockFn().mockResolvedValue(new Map()) };
  const patientProfilesRepo = {
    findById: mockFn().mockResolvedValue({ profileId: 'person-pat' }),
  };
  const personsRepo = {
    findById: mockFn().mockResolvedValue({ displayName: 'Paciente de Prueba' }),
  };
  const filesRepo = { findById: mockFn() };
  const dataAccessLogRepo = { record: mockFn() };
  const service = new PatientRecordPdfService(
    em,
    encountersRepo as any,
    conditionsRepo as any,
    allergiesRepo as any,
    medsRepo as any,
    notesRepo as any,
    documentsRepo as any,
    catalogRepo as any,
    patientProfilesRepo as any,
    personsRepo as any,
    filesRepo as any,
    dataAccessLogRepo as any,
  );
  return { service, notesRepo, documentsRepo, dataAccessLogRepo };
}

describe('PatientRecordPdfService (BR-15, CV-06, TX-32)', () => {
  it('412 si la sesión no tiene perfil de paciente, sin leer nada', async () => {
    const d = build();
    await expect(
      d.service.renderForPatient({ id: 'x', roles: [] } as any),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
    expect(d.notesRepo.findHeadersByPatient).not.toHaveBeenCalled();
    expect(d.dataAccessLogRepo.record).not.toHaveBeenCalled();
  });

  it('devuelve un PDF real y deja rastro de la descarga', async () => {
    const d = build();
    const result = await d.service.renderForPatient(titular);
    expect(result.buffer.subarray(0, 4).toString()).toBe('%PDF');
    expect(result.fileName).toBe('historia-pat-1.pdf');
    expect(d.dataAccessLogRepo.record).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        userId: 'user-pat',
        patientProfileId: 'pat-1',
        resourceType: 'PATIENT_RECORD_PDF',
        resourceId: 'pat-1',
      }),
    );
  });

  it('pide sólo la versión liberada y los documentos visibles', async () => {
    const d = build();
    await d.service.renderForPatient(titular);
    expect(d.notesRepo.findVersionsByIds).toHaveBeenCalledWith(
      expect.anything(),
      ['v-released'],
    );
    expect(d.documentsRepo.findFilesForRecords).toHaveBeenCalledWith(
      expect.anything(),
      ['doc-visible'],
    );
  });

  it('el sello es el mismo para el mismo contenido', async () => {
    const d = build();
    const a = await d.service.renderForPatient(titular);
    const b = await d.service.renderForPatient(titular);
    const keyword = (buf: Buffer) =>
      /sello:([0-9a-f]{64})/.exec(buf.toString('latin1'))?.[1];
    expect(keyword(a.buffer)).toBeDefined();
    expect(keyword(a.buffer)).toBe(keyword(b.buffer));
  });
});
