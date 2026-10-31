import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { OrgUserAssignmentsService } from './org-user-assignments.service';
import {
  ConcurrencyConflictException,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { STATUS } from './concept-maps';
import {
  ACTIVE_TENANT,
  buildScope,
  inTenant,
  thrown,
} from './delegation-scope.testing';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const assignmentsRepo = {
    findActiveOverlap: mockFn().mockResolvedValue(null),
    create: mockFn(),
    findById: mockFn(),
    findOverdueActive: mockFn().mockResolvedValue([]),
  };
  const delegatesRepo = {
    suspendByDelegateAssignment: mockFn().mockResolvedValue(0),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  // Política de alcance REAL con las lecturas de otros módulos en doble: por
  // defecto la membresía, los nodos de alcance y el supervisor son del tenant activo.
  const { scope, scopeRepo } = buildScope({
    setsRepo: {},
    delegatesRepo,
    orgAssignmentsRepo: assignmentsRepo,
  });
  const service = inTenant(
    new OrgUserAssignmentsService(
      em as any,
      assignmentsRepo,
      delegatesRepo as any,
      scope,
      logger as any,
    ),
  );
  return { service, tx, em, assignmentsRepo, delegatesRepo, scopeRepo };
}

describe('OrgUserAssignmentsService', () => {
  describe('createAssignment (UC-29-01)', () => {
    it('creates the assignment and flushes', async () => {
      const d = build();
      const created = {
        id: 'a1',
        statusConceptId: STATUS.ACTIVE,
        createdAt: new Date('2026-01-01'),
      };
      d.assignmentsRepo.create.mockReturnValue(created);
      const res = await d.service.createAssignment(
        'm1',
        { role: 'SECRETARY' } as any,
        actor,
      );
      expect(res).toEqual({
        id: 'a1',
        status: STATUS.ACTIVE,
        createdAt: created.createdAt,
      });
      expect(d.tx.flush).toHaveBeenCalledTimes(1);
    });

    // ── A-M1: IDOR entre organizaciones ───────────────────────────────────
    it('A-M1: una membresía de OTRA organización responde 404 uniforme y no escribe', async () => {
      const d = build();
      d.scopeRepo.membershipOf.mockResolvedValue({
        tenantId: 'otra-organizacion',
        userId: 'u-ajeno',
      });
      const err: any = await thrown(
        d.service.createAssignment('m-ajena', { role: 'SECRETARY' }, actor),
      );
      expect(err).toBeInstanceOf(ResourceNotFoundException);
      expect(d.assignmentsRepo.create).not.toHaveBeenCalled();
      expect(d.tx.flush).not.toHaveBeenCalled();
    });

    it('A-M1: una membresía inexistente responde igual que una ajena', async () => {
      const d = build();
      d.scopeRepo.membershipOf.mockResolvedValue(null);
      const ajena = build();
      ajena.scopeRepo.membershipOf.mockResolvedValue({
        tenantId: 'otra-organizacion',
        userId: 'x',
      });
      const a: any = await thrown(d.service.createAssignment('m-x', {}, actor));
      const b: any = await thrown(
        ajena.service.createAssignment('m-x', {}, actor),
      );
      expect(a).toBeInstanceOf(ResourceNotFoundException);
      expect(b).toBeInstanceOf(ResourceNotFoundException);
      expect(a.message).toBe(b.message);
      expect(a.reason ?? a.getResponse?.()?.reason).toBe(
        b.reason ?? b.getResponse?.()?.reason,
      );
      expect(a.details).toBeUndefined();
    });

    it.each([
      ['practiceId'],
      ['practiceSiteId'],
      ['clinicalUnitId'],
      ['careSpaceId'],
      ['diagnosticUnitId'],
      ['pharmacyId'],
    ])(
      'A-M1: el nodo de alcance %s de otra organización responde 404 y no escribe',
      async (field) => {
        const d = build();
        d.scopeRepo.scopeNodeTenant.mockResolvedValue('otra-organizacion');
        await expect(
          d.service.createAssignment(
            'm1',
            { [field]: 'nodo-ajeno' } as any,
            actor,
          ),
        ).rejects.toBeInstanceOf(ResourceNotFoundException);
        expect(d.assignmentsRepo.create).not.toHaveBeenCalled();
      },
    );

    it('A-M1: un nodo de alcance inexistente responde 404', async () => {
      const d = build();
      d.scopeRepo.scopeNodeTenant.mockResolvedValue(null);
      await expect(
        d.service.createAssignment('m1', { careSpaceId: 'no-existe' }, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('A-M1: un supervisor que no es de la organización responde 404', async () => {
      const d = build();
      d.scopeRepo.userHasMembership.mockResolvedValue(false);
      await expect(
        d.service.createAssignment(
          'm1',
          { supervisorUserId: 'u-ajeno' },
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.assignmentsRepo.create).not.toHaveBeenCalled();
    });

    it('A-M1: con todo en la organización activa crea el vínculo y fija su tenant', async () => {
      const d = build();
      d.assignmentsRepo.create.mockReturnValue({
        id: 'a1',
        statusConceptId: STATUS.ACTIVE,
        createdAt: new Date(),
      });
      await d.service.createAssignment(
        'm1',
        { careSpaceId: 'cs-1', supervisorUserId: 'dueno-1' },
        actor,
      );
      expect(d.assignmentsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ tenantId: ACTIVE_TENANT }),
      );
      expect(d.scopeRepo.scopeNodeTenant).toHaveBeenCalledWith(
        d.tx,
        'care_space',
        'cs-1',
      );
    });

    it('rejects an overlapping active role+scope (conflict)', async () => {
      const d = build();
      d.assignmentsRepo.findActiveOverlap.mockResolvedValue({ id: 'x' });
      await expect(
        d.service.createAssignment('m1', {} as any, actor),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(d.assignmentsRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('updateAssignment (UC-29-10) · A-M1', () => {
    it('A-M1: la asignación de una membresía de OTRA organización responde 404 y no suspende ni cascada', async () => {
      const d = build();
      const ajena = {
        id: 'a-b',
        tenantMembershipId: 'm-b',
        statusConceptId: STATUS.ACTIVE,
        rowVersion: 1,
        updatedAt: new Date(),
      };
      d.assignmentsRepo.findById.mockResolvedValue(ajena);
      d.scopeRepo.membershipOf.mockResolvedValue({
        tenantId: 'otra-organizacion',
        userId: 'u-b',
      });
      await expect(
        d.service.updateAssignment('a-b', { suspend: true }, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(ajena.statusConceptId).toBe(STATUS.ACTIVE);
      expect(
        d.delegatesRepo.suspendByDelegateAssignment,
      ).not.toHaveBeenCalled();
    });

    it('A-M1: no cambia el supervisor a alguien que no es de la organización', async () => {
      const d = build();
      const propia = {
        id: 'a1',
        tenantMembershipId: 'm1',
        statusConceptId: STATUS.ACTIVE,
        rowVersion: 1,
        updatedAt: new Date(),
        supervisorUserId: 'dueno-actual',
      };
      d.assignmentsRepo.findById.mockResolvedValue(propia);
      d.scopeRepo.userHasMembership.mockResolvedValue(false);
      await expect(
        d.service.updateAssignment(
          'a1',
          { supervisorUserId: 'u-ajeno' },
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(propia.supervisorUserId).toBe('dueno-actual');
    });
  });

  describe('updateAssignment (UC-29-10)', () => {
    it('rejects when there is nothing to change (precondition)', async () => {
      const d = build();
      await expect(
        d.service.updateAssignment('a1', {} as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('throws when the assignment does not exist', async () => {
      const d = build();
      d.assignmentsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.updateAssignment('a1', { suspend: true } as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects when the assignment is not active (precondition)', async () => {
      const d = build();
      d.assignmentsRepo.findById.mockResolvedValue({
        id: 'a1',
        statusConceptId: STATUS.SUSPENDED,
      });
      await expect(
        d.service.updateAssignment('a1', { suspend: true } as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects on row_version mismatch (concurrency)', async () => {
      const d = build();
      d.assignmentsRepo.findById.mockResolvedValue({
        id: 'a1',
        statusConceptId: STATUS.ACTIVE,
        rowVersion: 3,
      });
      await expect(
        d.service.updateAssignment(
          'a1',
          { suspend: true, expectedRowVersion: 2 } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ConcurrencyConflictException);
    });

    it('suspends and cascades to dependent delegations', async () => {
      const d = build();
      const assignment = {
        id: 'a1',
        statusConceptId: STATUS.ACTIVE,
        rowVersion: 1,
        updatedAt: new Date(),
      };
      d.assignmentsRepo.findById.mockResolvedValue(assignment);
      const res = await d.service.updateAssignment(
        'a1',
        { suspend: true },
        actor,
      );
      expect(res).toEqual({ ok: true });
      expect(assignment.statusConceptId).toBe(STATUS.SUSPENDED);
      expect(d.delegatesRepo.suspendByDelegateAssignment).toHaveBeenCalled();
    });
  });
});
