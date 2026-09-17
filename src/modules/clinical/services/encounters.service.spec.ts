import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { EncountersService } from './encounters.service';
import {
  ConcurrencyConflictException,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { CLIN } from '../clinical.concepts';

const actor = { id: 'user-1', roles: [] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const encountersRepo = {
    findById: mockFn(),
    findByPatient: mockFn().mockResolvedValue([]),
    create: mockFn(),
    createParticipant: mockFn(),
    createLocation: mockFn(),
    findActiveParticipants: mockFn().mockResolvedValue([]),
    findActiveLocations: mockFn().mockResolvedValue([]),
    findAppointmentForUpdate: mockFn().mockResolvedValue(null),
    findByAppointmentId: mockFn().mockResolvedValue([]),
    findLatestIdsByAppointmentIds: mockFn().mockResolvedValue(new Map()),
    findIdsByAppointmentIds: mockFn().mockResolvedValue(new Map()),
  };
  const episodesRepo = { findById: mockFn() };
  // Carril P1: el aviso in-app del cierre. Se dobla con un espía que no hace
  // nada para que las pruebas del cierre sigan siendo del cierre.
  const clinicalNotifications = {
    encounterClosed: mockFn(() => Promise.resolve({ suppressed: false })),
  };
  // El sello se cubre por su propio spec (`encounter-seal.service.spec.ts`);
  // acá se dobla para probar sólo el cableado del cierre.
  const seal = {
    computeHash: mockFn().mockResolvedValue('a'.repeat(64)),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new EncountersService(
    em as any,
    encountersRepo,
    episodesRepo as any,
    clinicalNotifications as any,
    seal as any,
    logger as any,
  );
  return {
    service,
    tx,
    encountersRepo,
    episodesRepo,
    clinicalNotifications,
    seal,
  };
}

/**
 * Ejecuta la operación encounter.
 * @returns Resultado de encounter.
 */
const encounter = () => ({
  id: 'enc1',
  patientProfileId: 'p1',
  episodeId: undefined,
  statusConceptId: CLIN.ENCOUNTER_IN_PROGRESS,
  startAt: new Date(),
  endAt: undefined,
  createdAt: new Date(),
  contentHash: undefined,
  sealedAt: undefined,
  rowVersion: 1,
});

describe('EncountersService', () => {
  describe('checkIn (UC-08-02)', () => {
    it('opens an encounter without participants', async () => {
      const d = build();
      d.encountersRepo.create.mockReturnValue(encounter());
      const res = await d.service.checkIn(
        { patientProfileId: 'p1', tenantId: 't1' },
        actor,
      );
      expect(res.id).toBe('enc1');
      expect(res.status).toBe(CLIN.ENCOUNTER_IN_PROGRESS);
      expect(d.encountersRepo.createParticipant).not.toHaveBeenCalled();
      expect(d.tx.flush).toHaveBeenCalledTimes(2);
    });

    it('creates participants and a location when provided', async () => {
      const d = build();
      d.encountersRepo.create.mockReturnValue(encounter());
      d.encountersRepo.createParticipant.mockReturnValue({ id: 'part1' });
      d.encountersRepo.createLocation.mockReturnValue({ id: 'loc1' });
      const res = await d.service.checkIn(
        {
          patientProfileId: 'p1',
          tenantId: 't1',
          participants: [{ practitionerProfileId: 'hp1' }],
          location: { practiceSiteId: 'site1' },
        },
        actor,
      );
      expect(res.participantIds).toEqual(['part1']);
      expect(res.locationIds).toEqual(['loc1']);
    });

    it('rejects when the referenced episode does not exist', async () => {
      const d = build();
      d.episodesRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.checkIn(
          {
            patientProfileId: 'p1',
            tenantId: 't1',
            episodeId: 'missing',
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('reuses the in-progress encounter already open for the appointment', async () => {
      const d = build();
      const enc = { ...encounter(), id: 'enc-existing' };
      d.encountersRepo.findByAppointmentId.mockResolvedValue([enc]);
      d.encountersRepo.findActiveParticipants.mockResolvedValue([
        { id: 'part1' },
      ]);
      d.encountersRepo.findActiveLocations.mockResolvedValue([{ id: 'loc1' }]);

      const res = await d.service.checkIn(
        { patientProfileId: 'p1', tenantId: 't1', appointmentId: 'appt1' },
        actor,
      );

      expect(res.id).toBe('enc-existing');
      expect(res.participantIds).toEqual(['part1']);
      expect(res.locationIds).toEqual(['loc1']);
      expect(d.encountersRepo.create).not.toHaveBeenCalled();
    });

    it('rejects with 409 when the appointment already has a finished encounter', async () => {
      const d = build();
      const enc = {
        ...encounter(),
        id: 'enc-finished',
        statusConceptId: CLIN.ENCOUNTER_FINISHED,
        endAt: new Date(),
      };
      d.encountersRepo.findByAppointmentId.mockResolvedValue([enc]);

      const promesa = d.service.checkIn(
        { patientProfileId: 'p1', tenantId: 't1', appointmentId: 'appt1' },
        actor,
      );

      await expect(promesa).rejects.toBeInstanceOf(ConflictException);
      await expect(promesa).rejects.toMatchObject({
        details: {
          encounterId: 'enc-finished',
          status: 'ENC_FINISHED',
        },
      });
      expect(d.encountersRepo.create).not.toHaveBeenCalled();
    });

    it('creates a new encounter when the appointment has none', async () => {
      const d = build();
      d.encountersRepo.findByAppointmentId.mockResolvedValue([]);
      d.encountersRepo.create.mockReturnValue(encounter());

      await d.service.checkIn(
        { patientProfileId: 'p1', tenantId: 't1', appointmentId: 'appt1' },
        actor,
      );

      expect(d.encountersRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ appointmentId: 'appt1' }),
      );
    });

    it('does not look up the appointment when none is given', async () => {
      const d = build();
      d.encountersRepo.create.mockReturnValue(encounter());

      await d.service.checkIn(
        { patientProfileId: 'p1', tenantId: 't1' },
        actor,
      );

      expect(d.encountersRepo.findAppointmentForUpdate).not.toHaveBeenCalled();
      expect(d.encountersRepo.findByAppointmentId).not.toHaveBeenCalled();
    });
  });

  describe('close (UC-08-14)', () => {
    it('closes an in-progress encounter and its active periods', async () => {
      const d = build();
      const enc = encounter();
      d.encountersRepo.findById.mockResolvedValue(enc);
      const part = { id: 'part1', updatedAt: new Date() };
      const loc = { id: 'loc1', updatedAt: new Date() };
      d.encountersRepo.findActiveParticipants.mockResolvedValue([part]);
      d.encountersRepo.findActiveLocations.mockResolvedValue([loc]);

      const res = await d.service.close('enc1', {}, actor);

      expect(enc.statusConceptId).toBe(CLIN.ENCOUNTER_FINISHED);
      expect(enc.endAt).toBeInstanceOf(Date);
      expect((part as any).statusConceptId).toBe(CLIN.PARTICIPANT_COMPLETED);
      expect((loc as any).locationStatusConceptId).toBe(
        CLIN.LOCATION_COMPLETED,
      );
      expect(res.status).toBe(CLIN.ENCOUNTER_FINISHED);
      expect(d.seal.computeHash).toHaveBeenCalledWith(d.tx, enc);
      expect(enc.contentHash).toBe('a'.repeat(64));
      expect(enc.sealedAt).toBeInstanceOf(Date);
      expect(res.contentHash).toBe('a'.repeat(64));
      expect(res.sealedAt).toBeInstanceOf(Date);
    });

    it('throws when the encounter does not exist', async () => {
      const d = build();
      d.encountersRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.close('missing', {}, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects closing an encounter that is not in progress, and does not seal it', async () => {
      const d = build();
      d.encountersRepo.findById.mockResolvedValue({
        ...encounter(),
        statusConceptId: CLIN.ENCOUNTER_FINISHED,
      });
      await expect(d.service.close('enc1', {}, actor)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
      expect(d.seal.computeHash).not.toHaveBeenCalled();
    });

    it('rejects on optimistic version mismatch', async () => {
      const d = build();
      d.encountersRepo.findById.mockResolvedValue({
        ...encounter(),
        rowVersion: 3,
      });
      await expect(
        d.service.close('enc1', { expectedRowVersion: 1 }, actor),
      ).rejects.toBeInstanceOf(ConcurrencyConflictException);
    });
  });
});
