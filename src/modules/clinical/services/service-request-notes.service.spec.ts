import { jest } from '@jest/globals';
import { ServiceRequestNotesService } from './service-request-notes.service';
import { PreconditionFailedException } from '../../../common';
import { ServiceRequestNotes } from '../entities';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const NOTE_A = { id: 'n-a', patientProfileId: 'p1', encounterId: 'enc-1' };
const NOTE_B = { id: 'n-b', patientProfileId: 'p1', encounterId: 'enc-2' };
const NOTE_OTHER = { id: 'n-x', patientProfileId: 'p2', encounterId: 'enc-9' };

/**
 * Un EntityManager con las cabeceras de nota sembradas.
 *
 * @param rows - Filas que devuelve `find`.
 * @returns El doble del EntityManager.
 */
function em(rows: unknown[]) {
  return { find: mockFn().mockResolvedValue(rows), create: mockFn() };
}

/** Atrapa el rechazo para mirar su `reason`. */
async function reasonOf(
  promise: Promise<unknown>,
): Promise<string | undefined> {
  const err = await promise.catch((e: unknown) => e);
  expect(err).toBeInstanceOf(PreconditionFailedException);
  return (err as PreconditionFailedException).reason;
}

describe('ServiceRequestNotesService (P40)', () => {
  const service = new ServiceRequestNotesService();

  describe('assertUsable', () => {
    it('acepta notas del mismo paciente y del mismo encuentro', async () => {
      const m = em([NOTE_A]);
      await expect(
        service.assertUsable(m as any, ['n-a'], 'p1', 'enc-1'),
      ).resolves.toBeUndefined();
      expect(m.find).toHaveBeenCalledTimes(1);
    });

    it('sin lista no consulta la base', async () => {
      const m = em([]);
      await service.assertUsable(m as any, [], 'p1', 'enc-1');
      expect(m.find).not.toHaveBeenCalled();
    });

    it('una nota de otro paciente responde igual que una inexistente', async () => {
      const ajena = await reasonOf(
        service.assertUsable(em([NOTE_OTHER]) as any, ['n-x'], 'p1', 'enc-1'),
      );
      const inexistente = await reasonOf(
        service.assertUsable(em([]) as any, ['n-zz'], 'p1', 'enc-1'),
      );
      expect(ajena).toBe('BASED_ON_NOTE_NOT_FOUND');
      expect(inexistente).toBe('BASED_ON_NOTE_NOT_FOUND');
    });

    it('una nota del paciente pero de otra consulta da ENCOUNTER_MISMATCH', async () => {
      expect(
        await reasonOf(
          service.assertUsable(
            em([NOTE_A, NOTE_B]) as any,
            ['n-a', 'n-b'],
            'p1',
            'enc-1',
          ),
        ),
      ).toBe('BASED_ON_NOTE_ENCOUNTER_MISMATCH');
    });

    it('una orden sin encuentro sólo exige el mismo paciente', async () => {
      await expect(
        service.assertUsable(em([NOTE_A, NOTE_B]) as any, ['n-a', 'n-b'], 'p1'),
      ).resolves.toBeUndefined();
    });
  });

  it('link crea un vínculo por nota con su posición', () => {
    const m = em([]);
    service.link(m as any, 'sr-1', ['n-b', 'n-a'], 'u1');
    expect(m.create).toHaveBeenCalledTimes(2);
    expect(m.create.mock.calls[0][0]).toBe(ServiceRequestNotes);
    expect(m.create.mock.calls[0][1]).toMatchObject({
      serviceRequestId: 'sr-1',
      clinicalNoteHeaderId: 'n-b',
      ordinal: 0,
      createdByUserId: 'u1',
    });
    expect(m.create.mock.calls[1][1]).toMatchObject({
      clinicalNoteHeaderId: 'n-a',
      ordinal: 1,
    });
  });

  describe('noteIdsFor', () => {
    it('agrupa por orden respetando el orden de las filas', async () => {
      const m = em([
        { serviceRequestId: 'sr-1', clinicalNoteHeaderId: 'n-b', ordinal: 0 },
        { serviceRequestId: 'sr-1', clinicalNoteHeaderId: 'n-a', ordinal: 1 },
        { serviceRequestId: 'sr-2', clinicalNoteHeaderId: 'n-c', ordinal: 0 },
      ]);
      const out = await service.noteIdsFor(m as any, ['sr-1', 'sr-2', 'sr-1']);
      expect(out.get('sr-1')).toEqual(['n-b', 'n-a']);
      expect(out.get('sr-2')).toEqual(['n-c']);
      expect(m.find.mock.calls[0][1]).toEqual({
        serviceRequestId: { $in: ['sr-1', 'sr-2'] },
      });
    });

    it('sin órdenes no consulta la base', async () => {
      const m = em([]);
      expect((await service.noteIdsFor(m as any, [])).size).toBe(0);
      expect(m.find).not.toHaveBeenCalled();
    });
  });
});
