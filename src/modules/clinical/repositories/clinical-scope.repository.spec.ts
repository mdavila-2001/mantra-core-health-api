import { jest } from '@jest/globals';
import { CLIN } from '../clinical.concepts';
import { Conditions, EncounterParticipants, Encounters } from '../entities';
import { ClinicalScopeRepository } from './clinical-scope.repository';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const PATIENT = 'pat-1';
const PRACTITIONER = 'hp-1';
const FILTER = {
  profileIds: ['hp-1'],
  userIds: ['u-1'],
  encounterIds: ['e-1'],
};

describe('ClinicalScopeRepository', () => {
  describe('page', () => {
    it('filtra en SQL, pide el tope y cuenta lo que el alcance oculta', async () => {
      const rows = [{ id: 'c1' }];
      const em: any = {
        find: mockFn().mockResolvedValue(rows),
        // visibles = 1, totales del paciente = 4
        count: mockFn().mockImplementation(async (_e: unknown, where: any) =>
          where.$or ? 1 : 4,
        ),
      };

      const page = await new ClinicalScopeRepository().page(em, {
        entity: Conditions,
        base: { patientProfileId: PATIENT },
        filter: FILTER,
        columns: { user: 'recordedByUserId', encounter: 'encounterId' },
        always: [{ clinicalStatusConceptId: 'ACTIVE' }],
        orderBy: { createdAt: 'DESC' },
        limit: 51,
      });

      expect(page).toEqual({ rows, hidden: 3 });
      const [entity, where, options] = em.find.mock.calls[0];
      expect(entity).toBe(Conditions);
      expect(where).toEqual({
        patientProfileId: PATIENT,
        $or: [
          { clinicalStatusConceptId: 'ACTIVE' },
          { recordedByUserId: { $in: ['u-1'] } },
          { recordedByUserId: null, encounterId: { $in: ['e-1'] } },
        ],
      });
      expect(options).toEqual({ orderBy: { createdAt: 'DESC' }, limit: 51 });
    });

    it('lo oculto nunca es negativo', async () => {
      const em: any = {
        find: mockFn().mockResolvedValue([]),
        count: mockFn().mockResolvedValue(2),
      };

      const page = await new ClinicalScopeRepository().page(em, {
        entity: Conditions,
        base: { patientProfileId: PATIENT },
        filter: FILTER,
        columns: { user: 'recordedByUserId' },
        orderBy: { createdAt: 'DESC' },
        limit: 10,
      });

      expect(page.hidden).toBe(0);
    });
  });

  describe('findEncounterIds', () => {
    it('devuelve los encuentros del paciente cuyo responsable está en la lista', async () => {
      const em: any = {
        find: mockFn().mockResolvedValue([{ id: 'e-1' }, { id: 'e-2' }]),
      };

      await expect(
        new ClinicalScopeRepository().findEncounterIds(em, PATIENT, ['hp-1']),
      ).resolves.toEqual(['e-1', 'e-2']);
      expect(em.find).toHaveBeenCalledWith(
        Encounters,
        { patientProfileId: PATIENT, primaryPractitionerId: { $in: ['hp-1'] } },
        { fields: ['id'] },
      );
    });

    it('sin profesionales no consulta', async () => {
      const em: any = { find: mockFn() };
      await expect(
        new ClinicalScopeRepository().findEncounterIds(em, PATIENT, []),
      ).resolves.toEqual([]);
      expect(em.find).not.toHaveBeenCalled();
    });
  });

  describe('isOwnOpenEncounter', () => {
    const OPEN = [CLIN.ENCOUNTER_ARRIVED, CLIN.ENCOUNTER_IN_PROGRESS];
    const repo = new ClinicalScopeRepository();

    it('es propio si el profesional es el responsable del encuentro abierto del paciente', async () => {
      const em: any = {
        findOne: mockFn().mockResolvedValue({
          id: 'e-1',
          primaryPractitionerId: PRACTITIONER,
        }),
        count: mockFn(),
      };

      await expect(
        repo.isOwnOpenEncounter(em, 'e-1', PATIENT, PRACTITIONER),
      ).resolves.toBe(true);
      expect(em.findOne).toHaveBeenCalledWith(Encounters, {
        id: 'e-1',
        patientProfileId: PATIENT,
        statusConceptId: { $in: OPEN },
      });
      expect(em.count).not.toHaveBeenCalled();
    });

    it('es propio si participa activamente aunque no sea el responsable', async () => {
      const em: any = {
        findOne: mockFn().mockResolvedValue({
          id: 'e-1',
          primaryPractitionerId: 'otro',
        }),
        count: mockFn().mockResolvedValue(1),
      };

      await expect(
        repo.isOwnOpenEncounter(em, 'e-1', PATIENT, PRACTITIONER),
      ).resolves.toBe(true);
      expect(em.count).toHaveBeenCalledWith(EncounterParticipants, {
        encounterId: { $in: ['e-1'] },
        practitionerProfileId: PRACTITIONER,
        statusConceptId: CLIN.PARTICIPANT_ACTIVE,
      });
    });

    it('no es propio si el encuentro no existe, está cerrado o es de otro paciente', async () => {
      const em: any = {
        findOne: mockFn().mockResolvedValue(null),
        count: mockFn(),
      };

      await expect(
        repo.isOwnOpenEncounter(em, 'e-1', PATIENT, PRACTITIONER),
      ).resolves.toBe(false);
      expect(em.count).not.toHaveBeenCalled();
    });

    it('no es propio si es de otro y no participa', async () => {
      const em: any = {
        findOne: mockFn().mockResolvedValue({
          id: 'e-1',
          primaryPractitionerId: 'otro',
        }),
        count: mockFn().mockResolvedValue(0),
      };

      await expect(
        repo.isOwnOpenEncounter(em, 'e-1', PATIENT, PRACTITIONER),
      ).resolves.toBe(false);
    });
  });

  describe('hasOwnOpenEncounter', () => {
    const repo = new ClinicalScopeRepository();

    it('true si alguno de los encuentros abiertos del paciente lo lidera', async () => {
      const em: any = {
        find: mockFn().mockResolvedValue([
          { id: 'e-1', primaryPractitionerId: 'otro' },
          { id: 'e-2', primaryPractitionerId: PRACTITIONER },
        ]),
        count: mockFn(),
      };

      await expect(
        repo.hasOwnOpenEncounter(em, PATIENT, PRACTITIONER),
      ).resolves.toBe(true);
      expect(em.count).not.toHaveBeenCalled();
    });

    it('true si participa en alguno; false si no hay encuentros abiertos', async () => {
      const em: any = {
        find: mockFn().mockResolvedValue([
          { id: 'e-1', primaryPractitionerId: 'otro' },
        ]),
        count: mockFn().mockResolvedValue(1),
      };

      await expect(
        repo.hasOwnOpenEncounter(em, PATIENT, PRACTITIONER),
      ).resolves.toBe(true);

      em.find.mockResolvedValue([]);
      em.count.mockClear();
      await expect(
        repo.hasOwnOpenEncounter(em, PATIENT, PRACTITIONER),
      ).resolves.toBe(false);
      expect(em.count).not.toHaveBeenCalled();
    });
  });
});
