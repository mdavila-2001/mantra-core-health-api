import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { MEDICAL_GROUP_STATUS } from '../entities/medical_groups.entity';
import { MedicalGroupsService } from './medical-groups.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const creator = { id: 'u-1', practitionerProfileId: 'prac-1' } as any;
const member = { id: 'u-2', practitionerProfileId: 'prac-2' } as any;
const stranger = { id: 'u-3', practitionerProfileId: 'prac-9' } as any;

const groupAt = (offsetMs: number, extra: Record<string, unknown> = {}) => ({
  id: 'g-1',
  serviceCatalogId: 's-1',
  requestingPractitionerId: 'prac-1',
  patientProfileId: 'pat-1',
  scheduledAt: new Date(Date.now() + offsetMs),
  status: MEDICAL_GROUP_STATUS.SCHEDULED,
  createdAt: new Date(),
  ...extra,
});

const members = [
  {
    id: 'm-1',
    practitionerProfileId: 'prac-1',
    isCreator: true,
    invitationStatus: 'ACCEPTED',
  },
  {
    id: 'm-2',
    practitionerProfileId: 'prac-2',
    isCreator: false,
    invitationStatus: 'ACCEPTED',
  },
];

function build(group: any = groupAt(-HOUR)) {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const forkEm = {
    flush: mockFn().mockResolvedValue(undefined),
    find: mockFn().mockResolvedValue([]),
  };
  const em = {
    fork: mockFn(() => forkEm),
    transactional: mockFn((cb: any) => cb(tx)),
  };
  const groupsRepo = { findById: mockFn().mockResolvedValue(group) };
  const membersRepo = { findByGroup: mockFn().mockResolvedValue(members) };
  const conditionsRepo = {
    findByPatient: mockFn().mockResolvedValue([
      { id: 'c-1', codeConceptId: 'k-1', onsetAt: new Date() },
    ]),
  };
  const clinicalRead = {
    assertPuedeLeerHistoria: mockFn().mockResolvedValue(undefined),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new MedicalGroupsService(
    em as any,
    groupsRepo as any,
    membersRepo as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    conditionsRepo as any,
    clinicalRead as any,
    logger as any,
  );
  return { service, group, conditionsRepo, clinicalRead };
}

describe('MedicalGroupsService (CV-26)', () => {
  describe('listPatientConditions', () => {
    it('autoriza la lectura de la historia antes de leer diagnósticos y no lee nada sin permiso', async () => {
      const d = build();
      d.clinicalRead.assertPuedeLeerHistoria.mockRejectedValue(
        new ForbiddenException('sin relación asistencial'),
      );
      await expect(
        d.service.listPatientConditions('pat-1', stranger),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(d.conditionsRepo.findByPatient).not.toHaveBeenCalled();
    });

    it('con permiso devuelve los diagnósticos, el más reciente marcado', async () => {
      const d = build();
      const res = await d.service.listPatientConditions('pat-1', creator);
      expect(d.clinicalRead.assertPuedeLeerHistoria).toHaveBeenCalledWith(
        'pat-1',
        creator,
      );
      expect(res).toHaveLength(1);
      expect(res[0].isMostRecent).toBe(true);
    });
  });

  describe('findOne', () => {
    it('un profesional ajeno al grupo recibe 404, no 403', async () => {
      const d = build();
      await expect(d.service.findOne('g-1', stranger)).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
    });

    it('el creador y un miembro lo leen', async () => {
      const d = build();
      await expect(d.service.findOne('g-1', creator)).resolves.toMatchObject({
        id: 'g-1',
      });
      await expect(d.service.findOne('g-1', member)).resolves.toMatchObject({
        id: 'g-1',
      });
    });
  });

  describe('updateExerciseNotes (ventana de 7 días)', () => {
    it('antes de la cita: 422', async () => {
      const d = build(groupAt(DAY));
      await expect(
        d.service.updateExerciseNotes('g-1', 'nota', creator),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('dentro de la ventana: guarda la nota', async () => {
      const d = build(groupAt(-DAY));
      const res = await d.service.updateExerciseNotes('g-1', 'nota', creator);
      expect(res.exerciseNotesText).toBe('nota');
      expect(res.canEditExerciseNotes).toBe(true);
    });

    it('pasados los 7 días: 422 y el expediente queda cerrado', async () => {
      const d = build(groupAt(-8 * DAY));
      await expect(
        d.service.updateExerciseNotes('g-1', 'tarde', creator),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.group.status).toBe(MEDICAL_GROUP_STATUS.CLOSED);
      expect(d.group.closedAt).toBeInstanceOf(Date);
    });

    it('un ajeno al grupo recibe 404', async () => {
      const d = build(groupAt(-DAY));
      await expect(
        d.service.updateExerciseNotes('g-1', 'x', stranger),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });
});
