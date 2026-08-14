import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { CareTeamsService } from './care-teams.service';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { CEXT } from '../clinical_ext.concepts';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const teamsRepo = {
    findById: mockFn(),
    findByPatient: mockFn(() => Promise.resolve([])),
    create: mockFn(),
  };
  const membersRepo = {
    findById: mockFn(),
    findByPatient: mockFn(() => Promise.resolve([])),
    findResponsible: mockFn(),
    create: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new CareTeamsService(
    em as any,
    teamsRepo,
    membersRepo as any,
    logger as any,
  );
  return { service, tx, em, teamsRepo, membersRepo };
}

describe('CareTeamsService', () => {
  describe('create (UC-18-01)', () => {
    it('creates the team, flushes parent before members and returns the members', async () => {
      const d = build();
      const team = {
        id: 't1',
        patientProfileId: 'p1',
        statusConceptId: CEXT.CARE_TEAM_ACTIVE,
        createdAt: new Date(),
      };
      d.teamsRepo.create.mockReturnValue(team);
      d.membersRepo.create.mockImplementation((_tx: any, data: any) => ({
        id: 'm1',
        ...data,
      }));

      const res = await d.service.create(
        {
          patientProfileId: 'p1',
          tenantId: 'te1',
          members: [{ memberRoleConceptId: 'r1', isResponsible: true }],
        },
        actor,
      );

      expect(res.id).toBe('t1');
      expect(res.members).toHaveLength(1);
      expect(d.tx.flush).toHaveBeenCalledTimes(2);
    });

    it('rejects more than one responsible member (conflict)', async () => {
      const d = build();
      await expect(
        d.service.create(
          {
            patientProfileId: 'p1',
            tenantId: 'te1',
            members: [
              { memberRoleConceptId: 'r1', isResponsible: true },
              { memberRoleConceptId: 'r2', isResponsible: true },
            ],
          } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(d.teamsRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('setResponsible (UC-18-02)', () => {
    it('throws when the team does not exist', async () => {
      const d = build();
      d.teamsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.setResponsible('t1', 'm1', actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('throws when the team is not active (precondition)', async () => {
      const d = build();
      d.teamsRepo.findById.mockResolvedValue({
        id: 't1',
        statusConceptId: 'other',
      });
      await expect(
        d.service.setResponsible('t1', 'm1', actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('transfers leadership: clears the previous responsible and sets the new one', async () => {
      const d = build();
      d.teamsRepo.findById.mockResolvedValue({
        id: 't1',
        statusConceptId: CEXT.CARE_TEAM_ACTIVE,
        updatedAt: new Date(),
      });
      const target = {
        id: 'm2',
        careTeamId: 't1',
        statusConceptId: CEXT.MEMBER_ACTIVE,
        isResponsible: false,
        updatedAt: new Date(),
      };
      const current = {
        id: 'm1',
        careTeamId: 't1',
        statusConceptId: CEXT.MEMBER_ACTIVE,
        isResponsible: true,
        updatedAt: new Date(),
      };
      d.membersRepo.findById.mockResolvedValue(target);
      d.membersRepo.findResponsible.mockResolvedValue(current);

      const res = await d.service.setResponsible('t1', 'm2', actor);

      expect(res).toEqual({ ok: true });
      expect(current.isResponsible).toBe(false);
      expect(target.isResponsible).toBe(true);
    });

    it('throws when the target member is not in the team (not found)', async () => {
      const d = build();
      d.teamsRepo.findById.mockResolvedValue({
        id: 't1',
        statusConceptId: CEXT.CARE_TEAM_ACTIVE,
      });
      d.membersRepo.findById.mockResolvedValue({
        id: 'm2',
        careTeamId: 'OTHER',
      });
      await expect(
        d.service.setResponsible('t1', 'm2', actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });
});
