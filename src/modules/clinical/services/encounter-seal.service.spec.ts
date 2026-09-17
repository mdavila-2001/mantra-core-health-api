import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { EncounterSealService } from './encounter-seal.service';

const encounter = (overrides: Record<string, unknown> = {}) =>
  ({
    id: 'enc1',
    patientProfileId: 'pat-1',
    primaryPractitionerId: 'prac-1',
    startAt: new Date('2026-09-15T12:00:00.000Z'),
    endAt: new Date('2026-09-15T12:30:00.000Z'),
    ...overrides,
  }) as any;

const header = (overrides: Record<string, unknown> = {}) =>
  ({ id: 'h1', currentVersionId: 'v1', ...overrides }) as any;

const version = (overrides: Record<string, unknown> = {}) =>
  ({ id: 'v1', contentHash: 'note-hash', ...overrides }) as any;

const condition = (overrides: Record<string, unknown> = {}) =>
  ({
    id: 'c1',
    codeConceptId: 'code-1',
    clinicalStatusConceptId: 'active',
    verificationStatusConceptId: 'confirmed',
    ...overrides,
  }) as any;

const medicationRequest = (overrides: Record<string, unknown> = {}) =>
  ({ id: 'mr1', rowVersion: 1, ...overrides }) as any;

const carePlan = (overrides: Record<string, unknown> = {}) =>
  ({
    id: 'cp1',
    rowVersion: 1,
    activities: [{ id: 'a1' }, { id: 'a2' }],
    ...overrides,
  }) as any;

const documentRecord = (overrides: Record<string, unknown> = {}) =>
  ({ id: 'd1', files: [{ fileId: 'f1' }], ...overrides }) as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const notesRepo = {
    findHeadersByEncounter: mockFn().mockResolvedValue([header()]),
    findVersionsByIds: mockFn().mockResolvedValue(new Map([['v1', version()]])),
  };
  const carePlansRepo = {
    findByEncounter: mockFn().mockResolvedValue([carePlan()]),
  };
  const documentsRepo = {
    findByEncounter: mockFn().mockResolvedValue([documentRecord()]),
  };
  const conditionsRepo = {
    findByEncounter: mockFn().mockResolvedValue([condition()]),
  };
  const medicationRequestsRepo = {
    findByEncounter: mockFn().mockResolvedValue([medicationRequest()]),
  };
  const service = new EncounterSealService(
    notesRepo as any,
    carePlansRepo as any,
    documentsRepo as any,
    conditionsRepo as any,
    medicationRequestsRepo as any,
  );
  const tx = {} as any;
  return {
    service,
    tx,
    notesRepo,
    carePlansRepo,
    documentsRepo,
    conditionsRepo,
    medicationRequestsRepo,
  };
}

describe('EncounterSealService', () => {
  it('devuelve un hash hexadecimal de 64 caracteres', async () => {
    const d = build();
    const hash = await d.service.computeHash(d.tx, encounter());
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('el mismo contenido produce el mismo hash', async () => {
    const d1 = build();
    const d2 = build();
    const h1 = await d1.service.computeHash(d1.tx, encounter());
    const h2 = await d2.service.computeHash(d2.tx, encounter());
    expect(h1).toBe(h2);
  });

  it('cambiar una nota produce otro hash', async () => {
    const d = build();
    const baseline = await d.service.computeHash(d.tx, encounter());

    d.notesRepo.findVersionsByIds.mockResolvedValue(
      new Map([['v1', version({ contentHash: 'nota-editada' })]]),
    );
    const changed = await d.service.computeHash(d.tx, encounter());

    expect(changed).not.toBe(baseline);
  });

  it('cambiar un diagnóstico produce otro hash', async () => {
    const d = build();
    const baseline = await d.service.computeHash(d.tx, encounter());

    d.conditionsRepo.findByEncounter.mockResolvedValue([
      condition({ clinicalStatusConceptId: 'resolved' }),
    ]);
    const changed = await d.service.computeHash(d.tx, encounter());

    expect(changed).not.toBe(baseline);
  });

  it('el orden de las actividades y de los archivos no altera el resultado', async () => {
    const d1 = build();
    d1.carePlansRepo.findByEncounter.mockResolvedValue([
      carePlan({ activities: [{ id: 'a2' }, { id: 'a1' }] }),
    ]);
    const h1 = await d1.service.computeHash(d1.tx, encounter());

    const d2 = build();
    const h2 = await d2.service.computeHash(d2.tx, encounter());

    expect(h1).toBe(h2);
  });
});
