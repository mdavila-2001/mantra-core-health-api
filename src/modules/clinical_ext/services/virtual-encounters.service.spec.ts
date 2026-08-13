import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { VirtualEncountersService } from './virtual-encounters.service';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { CEXT } from '../clinical_ext.concepts';

const actor = { id: 'md-1', roles: ['USER'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const encountersRepo = {
    findById: mockFn(),
    findByPatient: mockFn(() => Promise.resolve([])),
    findByEncounter: mockFn(),
    create: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new VirtualEncountersService(
    em as any,
    encountersRepo,
    logger as any,
  );
  return { service, encountersRepo };
}

describe('VirtualEncountersService (UC-18-12)', () => {
  it('creates a scheduled session', async () => {
    const d = build();
    d.encountersRepo.findByEncounter.mockResolvedValue(null);
    d.encountersRepo.create.mockReturnValue({
      id: 've1',
      encounterId: 'e1',
      statusConceptId: CEXT.VIRTUAL_ENCOUNTER_SCHEDULED,
    });
    const res = await d.service.create({ encounterId: 'e1' }, actor);
    expect(res.statusConceptId).toBe(CEXT.VIRTUAL_ENCOUNTER_SCHEDULED);
  });

  it('rejects a second session for the same encounter (conflict)', async () => {
    const d = build();
    d.encountersRepo.findByEncounter.mockResolvedValue({ id: 've0' });
    await expect(
      d.service.create({ encounterId: 'e1' } as any, actor),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('joins a scheduled session (scheduled -> in-progress)', async () => {
    const d = build();
    const venc = {
      id: 've1',
      encounterId: 'e1',
      statusConceptId: CEXT.VIRTUAL_ENCOUNTER_SCHEDULED,
      updatedAt: new Date(),
    };
    d.encountersRepo.findById.mockResolvedValue(venc);
    const res = await d.service.join('ve1', actor);
    expect(res.statusConceptId).toBe(CEXT.VIRTUAL_ENCOUNTER_IN_PROGRESS);
  });

  it('rejects joining a non-scheduled session (precondition)', async () => {
    const d = build();
    d.encountersRepo.findById.mockResolvedValue({
      id: 've1',
      statusConceptId: CEXT.VIRTUAL_ENCOUNTER_COMPLETED,
    });
    await expect(d.service.join('ve1', actor)).rejects.toBeInstanceOf(
      PreconditionFailedException,
    );
  });

  it('throws when ending a missing session', async () => {
    const d = build();
    d.encountersRepo.findById.mockResolvedValue(null);
    await expect(d.service.end('ve1', {} as any, actor)).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
  });

  it('ends an in-progress session (in-progress -> completed)', async () => {
    const d = build();
    const venc: any = {
      id: 've1',
      encounterId: 'e1',
      statusConceptId: CEXT.VIRTUAL_ENCOUNTER_IN_PROGRESS,
      updatedAt: new Date(),
    };
    d.encountersRepo.findById.mockResolvedValue(venc);
    const res = await d.service.end('ve1', { recordingFileId: 'f1' }, actor);
    expect(res.statusConceptId).toBe(CEXT.VIRTUAL_ENCOUNTER_COMPLETED);
    expect(venc.recordingFileId).toBe('f1');
  });
});
