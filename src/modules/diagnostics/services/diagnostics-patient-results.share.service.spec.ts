import { jest } from '@jest/globals';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { DiagnosticsPatientResultsService } from './diagnostics-patient-results.service';
import { ShareDiagnosticResultDto } from '../dto';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const ACTOR = { id: 'u-pac', patientProfileId: 'pat-1' } as any;
const REPORT = 'rep-1';
const PROFESIONAL = '11111111-1111-4111-8111-111111111111';
const FUTURO = () => new Date(Date.now() + 24 * 60 * 60 * 1000);

/** CL-50: el motivo con el que el paciente comparte un resultado se guarda y se devuelve. */
function build(existing?: any) {
  const tx = {
    flush: mockFn().mockResolvedValue(undefined),
    persist: mockFn(),
    find: mockFn().mockResolvedValue([]),
  };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const grantsRepo = {
    findExisting: mockFn().mockResolvedValue(existing ?? null),
    create: mockFn((_tx: unknown, data: any) => ({ id: 'g-1', ...data })),
  };
  const careRepo = { findActive: mockFn().mockResolvedValue({ id: 'cr-1' }) };
  const accountLinksRepo = {
    findActiveByPerson: mockFn().mockResolvedValue({ userId: 'u-prof' }),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service: any = new DiagnosticsPatientResultsService(
    em as any,
    {} as any,
    {} as any,
    accountLinksRepo as any,
    {} as any,
    grantsRepo as any,
    careRepo as any,
    logger as any,
    {} as any,
  );
  // Los pasos de autorización y de liberación tienen su propia cobertura viva
  // (diagnostics-release.int-spec); acá sólo se ejercita el motivo.
  service.requireOwnReport = mockFn().mockResolvedValue({
    id: REPORT,
    patientProfileId: 'pat-1',
    custodianTenantId: 't-1',
  });
  service.projectReleasedResults = mockFn().mockResolvedValue([{ id: REPORT }]);
  return { service, grantsRepo };
}

describe('DiagnosticsPatientResultsService.shareOwnResult · motivo (CL-50)', () => {
  it('guarda el motivo recortado en el grant y lo devuelve', async () => {
    const d = build();
    const res = await d.service.shareOwnResult(ACTOR, REPORT, {
      practitionerProfileId: PROFESIONAL,
      validUntil: FUTURO(),
      reason: '  Segunda opinión  ',
    });
    expect(d.grantsRepo.create.mock.calls[0][1].reasonText).toBe(
      'Segunda opinión',
    );
    expect(res.reason).toBe('Segunda opinión');
  });

  it('sin motivo no inventa uno', async () => {
    const d = build();
    const res = await d.service.shareOwnResult(ACTOR, REPORT, {
      practitionerProfileId: PROFESIONAL,
      validUntil: FUTURO(),
    });
    expect(d.grantsRepo.create.mock.calls[0][1].reasonText).toBeUndefined();
    expect(res.reason).toBeUndefined();
  });

  it('volver a compartir con otro motivo lo actualiza; sin motivo conserva el anterior', async () => {
    const existing = {
      id: 'g-0',
      validFrom: new Date(),
      validTo: FUTURO(),
      reasonText: 'Motivo original',
    };
    const d = build(existing);
    await d.service.shareOwnResult(ACTOR, REPORT, {
      practitionerProfileId: PROFESIONAL,
      validUntil: FUTURO(),
    });
    expect(existing.reasonText).toBe('Motivo original');

    const res = await d.service.shareOwnResult(ACTOR, REPORT, {
      practitionerProfileId: PROFESIONAL,
      validUntil: FUTURO(),
      reason: 'Control anual',
    });
    expect(existing.reasonText).toBe('Control anual');
    expect(res.reason).toBe('Control anual');
  });
});

describe('ShareDiagnosticResultDto · reason', () => {
  const dto = (extra: Record<string, unknown>) =>
    plainToInstance(ShareDiagnosticResultDto, {
      practitionerProfileId: PROFESIONAL,
      validUntil: FUTURO().toISOString(),
      ...extra,
    });

  it('es opcional', async () => {
    expect(await validate(dto({}))).toEqual([]);
  });

  it('acepta un motivo de hasta 500 caracteres y rechaza uno más largo', async () => {
    expect(await validate(dto({ reason: 'a'.repeat(500) }))).toEqual([]);
    const errors = await validate(dto({ reason: 'a'.repeat(501) }));
    expect(errors.map((e) => e.property)).toEqual(['reason']);
  });
});
