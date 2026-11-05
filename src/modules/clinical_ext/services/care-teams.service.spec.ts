import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ForbiddenException } from '@nestjs/common';
import { CareTeamsService } from './care-teams.service';
import {
  ConflictException,
  DomainException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { CEXT } from '../clinical_ext.concepts';
import { ClinicalExtErrorReason } from '../clinical_ext.error-reasons';
import { ACTIVE_TENANT, inTenant, thrown } from './clinical-ext-tenant.testing';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em: any = { transactional: mockFn((cb: any) => cb(tx)) };
  em.fork = mockFn(() => em);
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
  const clinicalRead = {
    assertCanReadHistory: mockFn().mockResolvedValue(undefined),
    assertCanWriteHistory: mockFn().mockResolvedValue(undefined),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const raw = new CareTeamsService(
    em as any,
    teamsRepo,
    membersRepo as any,
    clinicalRead as any,
    logger as any,
  );
  return {
    service: inTenant(raw),
    raw,
    tx,
    em,
    teamsRepo,
    membersRepo,
    clinicalRead,
  };
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
          tenantId: ACTIVE_TENANT,
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
            tenantId: ACTIVE_TENANT,
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
        tenantId: ACTIVE_TENANT,
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
        tenantId: ACTIVE_TENANT,
        patientProfileId: 'p1',
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
        tenantId: ACTIVE_TENANT,
        patientProfileId: 'p1',
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

  describe('alcance por tenant y por paciente (CE-01)', () => {
    const notFoundShape = {
      message: 'Equipo de cuidado no encontrado',
      reason: ClinicalExtErrorReason.CARE_TEAM_NOT_FOUND,
    };

    it('create: el equipo nace en el tenant del contexto y exige escritura sobre el paciente', async () => {
      const d = build();
      d.teamsRepo.create.mockReturnValue({
        id: 't1',
        patientProfileId: 'p1',
        statusConceptId: CEXT.CARE_TEAM_ACTIVE,
        createdAt: new Date(),
      });
      await d.service.create(
        { patientProfileId: 'p1', tenantId: ACTIVE_TENANT, members: [] },
        actor,
      );
      expect(d.clinicalRead.assertCanWriteHistory).toHaveBeenCalledWith(
        'p1',
        actor,
      );
      expect(d.teamsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ tenantId: ACTIVE_TENANT }),
      );
    });

    it('create: un tenantId del cuerpo distinto del activo da 403 y no persiste', async () => {
      const d = build();
      const err = await d.service
        .create(
          { patientProfileId: 'p1', tenantId: 'ten-other', members: [] },
          actor,
        )
        .catch((e: unknown) => e);
      expect(err).toBeInstanceOf(DomainException);
      expect((err as DomainException).getStatus()).toBe(403);
      expect((err as DomainException).reason).toBe(
        ClinicalExtErrorReason.CLINICAL_EXT_TENANT_SCOPE_REQUIRED,
      );
      expect(d.teamsRepo.create).not.toHaveBeenCalled();
    });

    it('create: sin relación clínica con el paciente da 403 y no persiste', async () => {
      const d = build();
      d.clinicalRead.assertCanWriteHistory.mockRejectedValue(
        new ForbiddenException('sin acceso'),
      );
      await expect(
        d.service.create(
          { patientProfileId: 'p-ajeno', tenantId: ACTIVE_TENANT, members: [] },
          actor,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(d.teamsRepo.create).not.toHaveBeenCalled();
    });

    it('create: sin tenant en el contexto falla antes de tocar nada', async () => {
      const d = build();
      await expect(
        d.raw.create(
          { patientProfileId: 'p1', tenantId: ACTIVE_TENANT, members: [] },
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.teamsRepo.create).not.toHaveBeenCalled();
    });

    it('setResponsible: un equipo de otro tenant responde igual que uno inexistente', async () => {
      const d = build();
      d.teamsRepo.findById.mockResolvedValue(null);
      const missing = await thrown(d.service.setResponsible('t1', 'm1', actor));
      d.teamsRepo.findById.mockResolvedValue({
        id: 't1',
        tenantId: 'ten-other',
        patientProfileId: 'p1',
        statusConceptId: CEXT.CARE_TEAM_ACTIVE,
      });
      const foreign = await thrown(d.service.setResponsible('t1', 'm1', actor));
      expect(foreign).toBeInstanceOf(ResourceNotFoundException);
      expect(foreign.getStatus()).toBe(404);
      expect(foreign.getResponse()).toEqual(missing.getResponse());
      expect(foreign.message).toBe(notFoundShape.message);
      expect(foreign.reason).toBe(notFoundShape.reason);
      expect(foreign.details).toBeUndefined();
      expect(d.membersRepo.findById).not.toHaveBeenCalled();
    });

    it('setResponsible: el paciente del equipo que el actor no atiende responde 404 uniforme', async () => {
      const d = build();
      d.teamsRepo.findById.mockResolvedValue({
        id: 't1',
        tenantId: ACTIVE_TENANT,
        patientProfileId: 'p-ajeno',
        statusConceptId: CEXT.CARE_TEAM_ACTIVE,
      });
      d.clinicalRead.assertCanWriteHistory.mockRejectedValue(
        new ForbiddenException('sin acceso'),
      );
      const err = await thrown(d.service.setResponsible('t1', 'm1', actor));
      expect(err).toBeInstanceOf(ResourceNotFoundException);
      expect(err.reason).toBe(notFoundShape.reason);
      expect(err.details).toBeUndefined();
      expect(d.membersRepo.findById).not.toHaveBeenCalled();
    });
  });

  describe('listByPatient (CE-01)', () => {
    it('exige lectura de la historia y acota al tenant activo', async () => {
      const d = build();
      d.teamsRepo.findByPatient.mockResolvedValue([{ id: 't1' }]);
      const res = await d.service.listByPatient('p1', actor);
      expect(d.clinicalRead.assertCanReadHistory).toHaveBeenCalledWith(
        'p1',
        actor,
      );
      expect(d.teamsRepo.findByPatient).toHaveBeenCalledWith(
        expect.anything(),
        'p1',
        ACTIVE_TENANT,
        50,
      );
      expect(res).toEqual([{ id: 't1' }]);
    });

    it('un paciente que el actor no atiende da 403 y no consulta', async () => {
      const d = build();
      d.clinicalRead.assertCanReadHistory.mockRejectedValue(
        new ForbiddenException('sin acceso'),
      );
      await expect(
        d.service.listByPatient('p-ajeno', actor),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(d.teamsRepo.findByPatient).not.toHaveBeenCalled();
    });
  });
});
